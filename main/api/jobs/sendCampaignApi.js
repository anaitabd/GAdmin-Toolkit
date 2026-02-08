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
    updateJob,
    getJob,
} = require('../db/queries');
const { loadGoogleCreds } = require('../googleCreds');

const INTERVAL = 50; // ms between emails

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const createMimeMessage = (user, to, from, subject, htmlContent) => {
    return Buffer.from(
        `Content-Type: text/html; charset="UTF-8"\n` +
        `From: "${from}" <${user}>\n` +
        `To: ${to}\n` +
        `Subject: ${subject}\n\n` +
        htmlContent,
        'utf-8'
    ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
};

async function run() {
    const jobId = parseInt(process.env.JOB_ID, 10);

    try {
        const job = await getJob(jobId);
        const params = job.params || {};
        const { from_name, subject, html_content, batch_size } = params;
        const batchSize = parseInt(batch_size, 10) || 300;

        if (!from_name || !subject || !html_content) {
            throw new Error('Missing campaign params: from_name, subject, or html_content');
        }

        const creds = await loadGoogleCreds();
        const users = await getUsers();
        const data = await getEmailData();

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
                const htmlBody = html_content.replace(/\[to\]/g, to_);
                const raw = createMimeMessage(user.email, emailData.to_email, from_name, subject, htmlBody);

                try {
                    await axios.post(
                        'https://www.googleapis.com/gmail/v1/users/me/messages/send',
                        { raw },
                        { headers }
                    );
                    await insertEmailLog({
                        userEmail: user.email, toEmail: emailData.to_email,
                        messageIndex: dataIndex, status: 'sent', provider: 'gmail_api',
                        errorMessage: null, sentAt: new Date(),
                    });
                } catch (error) {
                    await insertEmailLog({
                        userEmail: user.email, toEmail: emailData.to_email,
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
