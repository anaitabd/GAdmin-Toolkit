/**
 * Job worker: Send campaign emails via SMTP
 * Reads from_name, subject, html_content, batch_size from job params
 * Spawned by the jobs router via child_process.fork()
 */
const nodemailer = require('nodemailer');
const {
    getUsers,
    getEmailData,
    insertEmailLog,
    insertClickTrackingBatch,
    insertOfferTagTracking,
    insertOpenTracking,
    updateJob,
    getJob,
    getOffer,
} = require('../db/queries');
const { extractUrls, rewriteLinks, injectOpenPixel, replaceOfferTags, detectOfferTags, htmlContainsUrl, replaceUrlInHtml } = require('./utils/linkRewriter');

const INTERVAL = 50;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
    const jobId = parseInt(process.env.JOB_ID, 10);

    try {
        const job = await getJob(jobId);
        const params = job.params || {};
        const { from_name, subject, html_content, batch_size } = params;
        const batchSize = parseInt(batch_size, 10) || 20;
        const offerId = params.offer_id || null;
        const customHeaders = params.headers || {};

        if (!from_name || !subject || !html_content) {
            throw new Error('Missing campaign params: from_name, subject, or html_content');
        }

        // Fetch offer details for [click]/[unsub] tag replacement and auto-tracking
        let offer = null;
        if (offerId) {
            offer = await getOffer(offerId);
        }

        // Detect [click] and [unsub] tags in HTML
        const offerTags = detectOfferTags(html_content);

        // If offer is linked, replace [click]/[unsub] tags with offer URLs
        let processedHtml = html_content;
        if (offer) {
            processedHtml = replaceOfferTags(html_content, offer.click_url, offer.unsub_url);
        }

        // Determine which offer URLs should get special offer tracking:
        // - If [click]/[unsub] tags were used, those URLs get tracked
        // - If the offer's click_url or unsub_url appear as href links in the HTML, also track them
        const trackOfferClick = offer && offer.click_url &&
            (offerTags.hasClick || htmlContainsUrl(processedHtml, offer.click_url));
        const trackOfferUnsub = offer && offer.unsub_url &&
            (offerTags.hasUnsub || htmlContainsUrl(processedHtml, offer.unsub_url));

        // Apply recipient filters from campaign params
        const effOffset = params.recipient_offset ? Math.max(0, Number(params.recipient_offset) - 1) : null;
        const effLimit = (params.recipient_limit && effOffset != null)
            ? Math.max(1, Number(params.recipient_limit) - effOffset)
            : (params.recipient_limit ? Number(params.recipient_limit) : null);

        const allUsers = await getUsers();
        const data = await getEmailData(params.geo || null, effLimit, effOffset, params.list_name || null);

        // Extract URLs from processedHtml for click tracking
        const baseUrl = process.env.BASE_URL || 'http://localhost';
        let originalUrls = extractUrls(processedHtml);

        // Exclude offer click_url and unsub_url from normal batch tracking
        if (offer) {
            const offerUrls = new Set();
            if (trackOfferClick) offerUrls.add(offer.click_url);
            if (trackOfferUnsub) offerUrls.add(offer.unsub_url);
            if (offerUrls.size > 0) {
                originalUrls = originalUrls.filter(u => !offerUrls.has(u));
            }
        }

        // Filter users by IDs if specified
        const userIds = params.user_ids;
        const users = (Array.isArray(userIds) && userIds.length > 0)
            ? allUsers.filter((u) => userIds.includes(u.id))
            : allUsers;

        const total = data.length;
        let processed = 0;

        await updateJob(jobId, { total_items: total });

        let dataIndex = 0;
        for (const user of users) {
            if (dataIndex >= total) break;

            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: { user: user.email, pass: user.password },
            });

            for (let j = 0; j < batchSize && dataIndex < total; j++) {
                const emailData = data[dataIndex++];
                const to_ = emailData.to_email.split('@')[0];
                let htmlBody = processedHtml.replace(/\[to\]/g, to_);

                // Insert offer-specific tracking rows BEFORE normal link rewriting
                // Works with [click]/[unsub] tags AND direct href URLs from the offer
                if (offer) {
                    try {
                        if (trackOfferClick) {
                            const clickTrack = await insertOfferTagTracking(jobId, emailData.to_email, offer.click_url, offerId, 'click');
                            const trackingUrl = `${baseUrl}/t/c/${clickTrack.track_id}`;
                            htmlBody = replaceUrlInHtml(htmlBody, offer.click_url, trackingUrl);
                        }
                        if (trackOfferUnsub) {
                            const unsubTrack = await insertOfferTagTracking(jobId, emailData.to_email, offer.unsub_url, offerId, 'unsub');
                            const trackingUrl = `${baseUrl}/t/c/${unsubTrack.track_id}`;
                            htmlBody = replaceUrlInHtml(htmlBody, offer.unsub_url, trackingUrl);
                        }
                    } catch (err) {
                        console.error(`[Job ${jobId}] Offer tracking insert failed for ${emailData.to_email}:`, err.message);
                    }
                }

                // Insert click tracking rows and rewrite remaining links for this recipient
                if (originalUrls.length > 0) {
                    try {
                        const trackRows = await insertClickTrackingBatch(jobId, emailData.to_email, originalUrls, offerId);
                        const urlToTrackId = new Map(trackRows.map(r => [r.original_url, r.track_id]));
                        htmlBody = rewriteLinks(htmlBody, urlToTrackId, baseUrl);
                    } catch (err) {
                        console.error(`[Job ${jobId}] Click tracking insert failed for ${emailData.to_email}:`, err.message);
                    }
                }

                // Insert open tracking pixel for this recipient
                try {
                    const openTrack = await insertOpenTracking(jobId, emailData.to_email);
                    htmlBody = injectOpenPixel(htmlBody, openTrack.track_id, baseUrl);
                } catch (_) { /* open tracking failed, send without pixel */ }

                try {
                    await transporter.sendMail({
                        from: `"${from_name}" <${user.email}>`,
                        to: emailData.to_email,
                        subject,
                        html: htmlBody,
                        encoding: 'base64',
                        headers: customHeaders,
                    });
                    await insertEmailLog({
                        jobId, userEmail: user.email, toEmail: emailData.to_email,
                        messageIndex: dataIndex, status: 'sent', provider: 'smtp',
                        errorMessage: null, sentAt: new Date(),
                    });
                } catch (error) {
                    await insertEmailLog({
                        jobId, userEmail: user.email, toEmail: emailData.to_email,
                        messageIndex: dataIndex, status: 'failed', provider: 'smtp',
                        errorMessage: error?.message || 'send failed', sentAt: new Date(),
                    });
                }

                processed++;
                const progress = Math.round((processed / total) * 100);
                if (process.send) {
                    process.send({ type: 'progress', progress, processed, total });
                }
                await sleep(INTERVAL);
            }
        }

        await updateJob(jobId, { status: 'completed', progress: 100, processed_items: processed, completed_at: new Date() });
        process.exit(0);
    } catch (err) {
        await updateJob(jobId, { status: 'failed', error_message: err.message, completed_at: new Date() });
        process.exit(1);
    }
}

run();
