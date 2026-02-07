/**
 * Job worker: Detect bounced emails from Mail Delivery Subsystem
 */
const { google } = require('googleapis');
const { loadGoogleCreds } = require('../googleCreds');
const { getUsers, insertBounceLog, updateJob } = require('../db/queries');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function listMessages(jwtClient) {
    return new Promise((resolve) => {
        const gmail = google.gmail({ version: 'v1', auth: jwtClient });
        gmail.users.messages.list({ userId: 'me', q: 'from:"Mail Delivery Subsystem"' }, (err, res) => {
            if (err) { resolve([]); return; }
            resolve(res.data.messages || []);
        });
    });
}

function getMessage(messageId, jwtClient) {
    return new Promise((resolve) => {
        const gmail = google.gmail({ version: 'v1', auth: jwtClient });
        gmail.users.messages.get({ userId: 'me', id: messageId }, (err, res) => {
            if (err) { resolve(null); return; }
            const snippet = res.data.snippet || '';
            const match = snippet.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
            resolve(match ? match[0] : null);
        });
    });
}

async function run() {
    const jobId = parseInt(process.env.JOB_ID, 10);

    try {
        const creds = await loadGoogleCreds();
        const users = await getUsers();
        const emails = users.map(u => u.email).filter(Boolean);
        const total = emails.length;

        await updateJob(jobId, { total_items: total });

        let processed = 0;
        let bouncesFound = 0;

        for (const userEmail of emails) {
            try {
                const jwtClient = new google.auth.JWT(
                    creds.client_email, null, creds.private_key,
                    ['https://mail.google.com'], userEmail
                );
                const messages = await listMessages(jwtClient);

                for (const msg of messages) {
                    const bounced = await getMessage(msg.id, jwtClient);
                    if (bounced) {
                        await insertBounceLog({ email: bounced, reason: `Detected from ${userEmail}` });
                        bouncesFound++;
                    }
                }
            } catch (err) {
                console.error(`Error processing ${userEmail}:`, err?.message);
            }

            processed++;
            if (process.send) {
                process.send({ type: 'progress', progress: Math.round((processed / total) * 100), processed, total });
            }
            await sleep(100);
        }

        await updateJob(jobId, {
            status: 'completed', progress: 100,
            processed_items: bouncesFound, completed_at: new Date(),
        });
        process.exit(0);
    } catch (err) {
        try { await updateJob(jobId, { status: 'failed', error_message: err.message, completed_at: new Date() }); } catch (_) {}
        process.exit(1);
    }
}

run();
