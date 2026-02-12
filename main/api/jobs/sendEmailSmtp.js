/**
 * Job worker: Send emails via SMTP
 */
const nodemailer = require('nodemailer');
const {
    getUsers,
    getEmailData,
    getActiveEmailInfo,
    getActiveEmailTemplate,
    insertEmailLog,
    updateJob,
} = require('../db/queries');
const { filterRecipients, replacePlaceholders } = require('../lib/sendFilters');

const REQUESTS_PER_EMAIL = 20;
const INTERVAL = 50;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
    const jobId = parseInt(process.env.JOB_ID, 10);

    try {
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
        const htmlContent = template.html_content;
        const total = data.length;
        let processed = 0;
        let sent = 0;
        let failed = 0;

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

            for (let j = 0; j < REQUESTS_PER_EMAIL && dataIndex < total; j++) {
                const emailData = data[dataIndex++];
                
                // Replace placeholders with recipient data
                const html = replacePlaceholders(htmlContent, emailData);

                try {
                    await transporter.sendMail({
                        from: `"${from}" <${user.email}>`,
                        to: emailData.to_email,
                        subject,
                        html,
                    });
                    await insertEmailLog({
                        userEmail: user.email, toEmail: emailData.to_email,
                        messageIndex: dataIndex, status: 'sent', provider: 'smtp',
                        errorMessage: null, sentAt: new Date(),
                    });
                    sent++;
                    console.log(`[Job ${jobId}] Sent ${sent}/${total}: ${emailData.to_email}`);
                } catch (error) {
                    await insertEmailLog({
                        userEmail: user.email, toEmail: emailData.to_email,
                        messageIndex: dataIndex, status: 'failed', provider: 'smtp',
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
