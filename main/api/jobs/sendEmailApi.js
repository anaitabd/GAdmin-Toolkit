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
const { filterRecipients, replacePlaceholders } = require('../lib/sendFilters');

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
        let data = await getEmailData();
        const info = await getActiveEmailInfo();
        const template = await getActiveEmailTemplate();

        if (!info || !template) throw new Error('Missing active email_info or template');

        // Apply recipient filtering (blacklists, suppressions, bounces, unsubscribes)
        console.log(`[Job ${jobId}] Before filtering: ${data.length} recipients`);
        data = await filterRecipients(data);
        console.log(`[Job ${jobId}] After filtering: ${data.length} recipients`);

        const { from_name: from, subject } = info;
        const baseHtml = template.html_content;
        const total = data.length;
        let processed = 0;
        let sent = 0;
        let failed = 0;

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
                
                // Replace placeholders with recipient data
                const htmlContent = replacePlaceholders(baseHtml, emailData);
                
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
                    sent++;
                    console.log(`[Job ${jobId}] Sent ${sent}/${total}: ${emailData.to_email}`);
                } catch (error) {
                    await insertEmailLog({
                        userEmail: user.email, toEmail: emailData.to_email,
                        messageIndex: dataIndex, status: 'failed', provider: 'gmail_api',
                        errorMessage: error?.message || 'send failed', sentAt: new Date(),
                    });
                    failed++;
                    console.error(`[Job ${jobId}] Failed ${failed}: ${emailData.to_email} - ${error?.message}`);
                }

                processed++;
                const progress = Math.round((processed / total) * 100);
                if (process.send) {
                    process.send({ type: 'progress', progress, processed, total });
                }

                await sleep(INTERVAL);
            }
        }

        console.log(`[Job ${jobId}] Completed: ${sent} sent, ${failed} failed out of ${total} total`);
        await updateJob(jobId, { status: 'completed', progress: 100, processed_items: processed, completed_at: new Date() });
        process.exit(0);
    } catch (err) {
        console.error(`[Job ${jobId}] Job failed: ${err.message}`);
        await updateJob(jobId, { status: 'failed', error_message: err.message, completed_at: new Date() });
        process.exit(1);
    }
}

run();
