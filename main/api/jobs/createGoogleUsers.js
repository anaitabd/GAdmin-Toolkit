/**
 * Job worker: Create users in Google Admin (Workspace)
 */
const { google } = require('googleapis');
const { loadGoogleCreds } = require('../googleCreds');
const { getUsers, updateJob } = require('../db/queries');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseWorkerArgs() {
    const raw = process.argv.slice(2);
    const idx = raw.indexOf('--job');
    return idx !== -1 ? [...raw.slice(0, idx), ...raw.slice(idx + 2)] : raw;
}

async function run() {
    const jobId = parseInt(process.env.JOB_ID, 10);
    const args = parseWorkerArgs();
    const adminEmail = args[0];

    try {
        const creds = await loadGoogleCreds();
        const users = await getUsers();

        const jwtClient = new google.auth.JWT(
            creds.client_email, null, creds.private_key,
            ['https://www.googleapis.com/auth/admin.directory.user'],
            adminEmail
        );
        await jwtClient.authorize();

        const admin = google.admin({ version: 'directory_v1', auth: jwtClient });
        const total = users.length;

        await updateJob(jobId, { total_items: total });

        let created = 0;
        for (let i = 0; i < total; i++) {
            const u = users[i];
            try {
                await admin.users.insert({
                    resource: {
                        primaryEmail: u.email,
                        password: u.password,
                        name: { givenName: u.given_name || 'User', familyName: u.family_name || 'User' },
                        changePasswordAtNextLogin: false,
                    },
                });
                created++;
            } catch (err) {
                // user may already exist
                console.error(`Error creating ${u.email}:`, err?.message);
            }

            if (process.send) {
                process.send({ type: 'progress', progress: Math.round(((i + 1) / total) * 100), processed: i + 1, total });
            }
            await sleep(250); // rate limit
        }

        await updateJob(jobId, { status: 'completed', progress: 100, processed_items: created, completed_at: new Date() });
        process.exit(0);
    } catch (err) {
        try { await updateJob(jobId, { status: 'failed', error_message: err.message, completed_at: new Date() }); } catch (_) {}
        process.exit(1);
    }
}

run();
