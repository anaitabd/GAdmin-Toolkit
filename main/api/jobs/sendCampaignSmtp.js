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
    updateJob,
    getJob,
} = require('../db/queries');

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

        const users = await getUsers();
        const data = await getEmailData();

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
                const htmlBody = html_content.replace(/\[to\]/g, to_);

                try {
                    await transporter.sendMail({
                        from: `"${from_name}" <${user.email}>`,
                        to: emailData.to_email,
                        subject,
                        html: htmlBody,
                    });
                    await insertEmailLog({
                        userEmail: user.email, toEmail: emailData.to_email,
                        messageIndex: dataIndex, status: 'sent', provider: 'smtp',
                        errorMessage: null, sentAt: new Date(),
                    });
                } catch (error) {
                    await insertEmailLog({
                        userEmail: user.email, toEmail: emailData.to_email,
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
