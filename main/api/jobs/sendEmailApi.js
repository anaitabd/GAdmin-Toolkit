/**
 * Job worker: Send emails via Gmail API
 * Spawned by the jobs router via child_process.fork()
 * Communicates progress back via process.send()
 */
const { google } = require('googleapis');
const axios = require('axios');
const {
    getUsers,
    getEmailData,
    getActiveEmailInfo,
    getActiveEmailTemplate,
    insertEmailLog,
    updateJob,
} = require('../db/queries');
const { loadGoogleCreds } = require('../googleCreds');

const REQUESTS_PER_EMAIL = 300;
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
        const creds = await loadGoogleCreds();
        const users = await getUsers();
        const data = await getEmailData();
        const info = await getActiveEmailInfo();
        const template = await getActiveEmailTemplate();

        if (!info || !template) throw new Error('Missing active email_info or template');

        const { from_name: from, subject } = info;
        const baseHtml = template.html_content;
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

            for (let j = 0; j < REQUESTS_PER_EMAIL && dataIndex < total; j++) {
                const emailData = data[dataIndex++];
                const to_ = emailData.to_email.split('@')[0];
                const htmlContent = baseHtml.replace(/\[to\]/g, to_);
                const raw = createMimeMessage(user.email, emailData.to_email, from, subject, htmlContent);

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
