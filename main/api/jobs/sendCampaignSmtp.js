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
    updateJob,
    getJob,
} = require('../db/queries');
const { extractUrls, rewriteLinks } = require('./utils/linkRewriter');

const INTERVAL = 50;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
    const jobId = parseInt(process.env.JOB_ID, 10);

    try {
        const job = await getJob(jobId);
        const params = job.params || {};
        const { from_name, subject, html_content, batch_size } = params;
        const batchSize = parseInt(batch_size, 10) || 20;

        if (!from_name || !subject || !html_content) {
            throw new Error('Missing campaign params: from_name, subject, or html_content');
        }

        // Apply recipient filters from campaign params
        const effOffset = params.recipient_offset ? Math.max(0, Number(params.recipient_offset) - 1) : null;
        const effLimit = (params.recipient_limit && effOffset != null)
            ? Math.max(1, Number(params.recipient_limit) - effOffset)
            : (params.recipient_limit ? Number(params.recipient_limit) : null);

        const allUsers = await getUsers();
        const data = await getEmailData(params.geo || null, effLimit, effOffset, params.list_name || null);

        // Extract URLs from html_content for click tracking
        const baseUrl = process.env.BASE_URL || 'http://localhost';
        const originalUrls = extractUrls(html_content);

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
                let htmlBody = html_content.replace(/\[to\]/g, to_);

                // Insert click tracking rows and rewrite links for this recipient
                if (originalUrls.length > 0) {
                    try {
                        const trackRows = await insertClickTrackingBatch(jobId, emailData.to_email, originalUrls);
                        const urlToTrackId = new Map(trackRows.map(r => [r.original_url, r.track_id]));
                        htmlBody = rewriteLinks(htmlBody, urlToTrackId, baseUrl);
                    } catch (_) { /* tracking insert failed, send with original links */ }
                }

                try {
                    await transporter.sendMail({
                        from: `"${from_name}" <${user.email}>`,
                        to: emailData.to_email,
                        subject,
                        html: htmlBody,
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
