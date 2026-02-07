/**
 * Job worker: Delete users in Google Admin (Workspace)
 */
const { google } = require('googleapis');
const { loadGoogleCreds } = require('../googleCreds');
const { updateJob } = require('../db/queries');

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
        const jwtClient = new google.auth.JWT(
            creds.client_email, null, creds.private_key,
            ['https://www.googleapis.com/auth/admin.directory.user'],
            adminEmail
        );
        await jwtClient.authorize();

        const admin = google.admin({ version: 'directory_v1', auth: jwtClient });

        // Collect all users first
        const usersToDelete = [];
        let pageToken = undefined;
        do {
            const res = await admin.users.list({ customer: 'my_customer', maxResults: 100, pageToken });
            const users = res.data.users || [];
            for (const u of users) {
                if (u.primaryEmail !== adminEmail) usersToDelete.push(u.id);
            }
            pageToken = res.data.nextPageToken;
        } while (pageToken);

        const total = usersToDelete.length;
        await updateJob(jobId, { total_items: total });

        if (total === 0) {
            await updateJob(jobId, { status: 'completed', progress: 100, processed_items: 0, completed_at: new Date() });
            process.exit(0);
        }

        let deleted = 0;
        for (const userId of usersToDelete) {
            try {
                await admin.users.delete({ userKey: userId });
                deleted++;
            } catch (err) {
                console.error(`Error deleting ${userId}:`, err?.message);
            }
            if (process.send) {
                process.send({ type: 'progress', progress: Math.round(((deleted) / total) * 100), processed: deleted, total });
            }
            await sleep(250);
        }

        await updateJob(jobId, { status: 'completed', progress: 100, processed_items: deleted, completed_at: new Date() });
        process.exit(0);
    } catch (err) {
        try { await updateJob(jobId, { status: 'failed', error_message: err.message, completed_at: new Date() }); } catch (_) {}
        process.exit(1);
    }
}

run();
