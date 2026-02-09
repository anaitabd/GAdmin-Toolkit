/**
 * Job worker: Send campaign emails via Gmail API
 * Reads from_name, subject, html_content, batch_size from job params
 * Spawned by the jobs router via child_process.fork()
 */
const { google } = require('googleapis');
const axios = require('axios');
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
const { loadGoogleCreds } = require('../googleCreds');
const { extractUrls, rewriteLinks, injectOpenPixel, replaceOfferTags, detectOfferTags, htmlContainsUrl, replaceUrlInHtml } = require('./utils/linkRewriter');

const INTERVAL = 50; // ms between emails

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Build a proper RFC 2822 MIME message for Gmail API.
 * - MIME-Version 1.0
 * - Content-Transfer-Encoding: base64 (body is base64-encoded for safe transport)
 * - RFC 2047 B-encoding for non-ASCII Subject & From name
 * - Custom headers support (Reply-To, List-Unsubscribe, X-Mailer, etc.)
 */
const createMimeMessage = (user, to, from, subject, htmlContent, customHeaders = {}) => {
    /**
     * RFC 2047 B-encoding for non-ASCII characters in structured headers.
     * Splits into multiple encoded-words of max 45 bytes each to stay within
     * the 75-character encoded-word limit.
     */
    const encodeRfc2047 = (str) => {
        if (!/[^\x20-\x7E]/.test(str)) return str;
        const bytes = Buffer.from(str, 'utf-8');
        const chunks = [];
        // Each encoded word: =?UTF-8?B?<base64>?= must be ≤75 chars
        // Overhead is 12 chars (=?UTF-8?B?...?=), leaving 63 for base64
        // 63 base64 chars = 47 raw bytes. Use 45 to be safe.
        const chunkSize = 45;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.slice(i, Math.min(i + chunkSize, bytes.length));
            chunks.push(`=?UTF-8?B?${chunk.toString('base64')}?=`);
        }
        return chunks.join('\r\n ');
    };

    const encodedSubject = encodeRfc2047(subject);
    const encodedFrom = /[^\x20-\x7E]/.test(from)
        ? `${encodeRfc2047(from)} <${user}>`
        : `"${from}" <${user}>`;

    // Base64-encode the HTML body (Content-Transfer-Encoding: base64)
    const bodyBase64 = Buffer.from(htmlContent, 'utf-8').toString('base64');
    // Split into 76-char lines per RFC 2045 §6.8
    const bodyLines = bodyBase64.match(/.{1,76}/g)?.join('\r\n') || '';

    const headerLines = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        `From: ${encodedFrom}`,
        `To: ${to}`,
        `Subject: ${encodedSubject}`,
    ];

    // Append custom headers (Reply-To, List-Unsubscribe, X-Mailer, etc.)
    if (customHeaders && typeof customHeaders === 'object') {
        for (const [key, value] of Object.entries(customHeaders)) {
            if (value && String(value).trim()) {
                headerLines.push(`${key}: ${String(value).trim()}`);
            }
        }
    }

    const rawMessage = headerLines.join('\r\n') + '\r\n\r\n' + bodyLines;

    // Base64url-encode the entire MIME message for Gmail API
    return Buffer.from(rawMessage, 'utf-8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

async function run() {
    const jobId = parseInt(process.env.JOB_ID, 10);

    try {
        const job = await getJob(jobId);
        const params = job.params || {};
        const { from_name, subject, html_content, batch_size } = params;
        const batchSize = parseInt(batch_size, 10) || 300;
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
        // This ensures offer tracking works even without explicit tags
        const trackOfferClick = offer && offer.click_url &&
            (offerTags.hasClick || htmlContainsUrl(processedHtml, offer.click_url));
        const trackOfferUnsub = offer && offer.unsub_url &&
            (offerTags.hasUnsub || htmlContainsUrl(processedHtml, offer.unsub_url));

        // Apply recipient filters from campaign params
        const effOffset = params.recipient_offset ? Math.max(0, Number(params.recipient_offset) - 1) : null;
        const effLimit = (params.recipient_limit && effOffset != null)
            ? Math.max(1, Number(params.recipient_limit) - effOffset)
            : (params.recipient_limit ? Number(params.recipient_limit) : null);

        const creds = await loadGoogleCreds();
        const allUsers = await getUsers();
        const data = await getEmailData(params.geo || null, effLimit, effOffset, params.list_name || null);

        // Extract URLs from processedHtml for click tracking
        const baseUrl = process.env.BASE_URL || 'http://localhost';
        let originalUrls = extractUrls(processedHtml);

        // Exclude offer click_url and unsub_url from normal batch tracking
        // (they get dedicated per-recipient tracking rows with link_type)
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

            const jwtClient = new google.auth.JWT(
                creds.client_email, null, creds.private_key,
                ['https://mail.google.com/'], user.email
            );
            const tokens = await jwtClient.authorize();
            if (!tokens) continue;

            const headers = { Authorization: `Bearer ${tokens.access_token}`, 'Content-Type': 'application/json' };

            for (let j = 0; j < batchSize && dataIndex < total; j++) {
                const emailData = data[dataIndex++];
                const to_ = emailData.to_email.split('@')[0];
                let htmlBody = processedHtml.replace(/\[to\]/g, to_);

                // Insert offer-specific tracking rows BEFORE normal link rewriting
                // These create per-recipient tracking for offer click and unsub URLs
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

                const raw = createMimeMessage(user.email, emailData.to_email, from_name, subject, htmlBody, customHeaders);

                try {
                    await axios.post(
                        'https://www.googleapis.com/gmail/v1/users/me/messages/send',
                        { raw },
                        { headers }
                    );
                    await insertEmailLog({
                        jobId, userEmail: user.email, toEmail: emailData.to_email,
                        messageIndex: dataIndex, status: 'sent', provider: 'gmail_api',
                        errorMessage: null, sentAt: new Date(),
                    });
                } catch (error) {
                    await insertEmailLog({
                        jobId, userEmail: user.email, toEmail: emailData.to_email,
                        messageIndex: dataIndex, status: 'failed', provider: 'gmail_api',
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
