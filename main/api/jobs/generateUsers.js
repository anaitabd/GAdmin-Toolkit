/**
 * Job worker: Generate random users from names DB
 */
const { query } = require('../db');
const { getNames, updateJob } = require('../db/queries');

function parseWorkerArgs() {
    const raw = process.argv.slice(2);
    const idx = raw.indexOf('--job');
    return idx !== -1 ? [...raw.slice(0, idx), ...raw.slice(idx + 2)] : raw;
}

async function run() {
    const jobId = parseInt(process.env.JOB_ID, 10);
    const args = parseWorkerArgs();
    const domain = args[0] || process.env.DOMAIN || 'example.com';
    const numRecords = parseInt(args[1] || process.env.NUM_RECORDS || '100', 10);

    try {
        const names = await getNames();
        if (!names.length) throw new Error('No names in DB');

        const givenNames = names.map(r => r.given_name);
        const surnames = names.map(r => r.family_name);
        const generated = new Set();
        const rows = [];
        const fixedPassword = 'Password123@';

        let attempts = 0;
        while (rows.length < numRecords && attempts < numRecords * 10) {
            attempts++;
            const gn = givenNames[Math.floor(Math.random() * givenNames.length)];
            const fn = surnames[Math.floor(Math.random() * surnames.length)];
            const email = `${gn.toLowerCase()}.${fn.toLowerCase()}@${domain}`;
            if (!generated.has(email)) {
                generated.add(email);
                rows.push({ email, password: fixedPassword, givenName: gn, familyName: fn });
            }
        }

        await updateJob(jobId, { total_items: rows.length });

        let inserted = 0;
        for (const row of rows) {
            await query(
                `INSERT INTO users (email, password, given_name, family_name)
                 VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING`,
                [row.email, row.password, row.givenName, row.familyName]
            );
            inserted++;
            if (inserted % 50 === 0 && process.send) {
                const progress = Math.round((inserted / rows.length) * 100);
                process.send({ type: 'progress', progress, processed: inserted, total: rows.length });
            }
        }

        await updateJob(jobId, { status: 'completed', progress: 100, processed_items: inserted, completed_at: new Date() });
        process.exit(0);
    } catch (err) {
        try { await updateJob(jobId, { status: 'failed', error_message: err.message, completed_at: new Date() }); } catch (_) {}
        process.exit(1);
    }
}

run();
