const express = require('express');
const router = express.Router();
const { fork } = require('child_process');
const path = require('path');
const {
    getUsers,
    getEmailData,
    getActiveEmailInfo,
    getActiveEmailTemplate,
    getNames,
    createJob,
    getJob,
    getJobs,
    updateJob,
    getSetting,
} = require('../db/queries');
const { query } = require('../db');

// In-memory SSE connections per job
const sseClients = new Map();

function notifyJob(jobId, data) {
    const clients = sseClients.get(jobId);
    if (clients) {
        const msg = `data: ${JSON.stringify(data)}\n\n`;
        clients.forEach((res) => {
            try { res.write(msg); } catch (_) { /* client gone */ }
        });
        if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
            clients.forEach((res) => { try { res.end(); } catch (_) {} });
            sseClients.delete(jobId);
        }
    }
}

// Active child processes
const activeProcesses = new Map();

async function startJobProcess(job, scriptPath, args = []) {
    await updateJob(job.id, { status: 'running', started_at: new Date() });
    notifyJob(job.id, { status: 'running', progress: 0 });

    const child = fork(scriptPath, ['--job', job.id.toString(), ...args], {
        env: { ...process.env, JOB_ID: job.id.toString() },
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    });

    activeProcesses.set(job.id, child);

    child.on('message', async (msg) => {
        if (msg.type === 'progress') {
            const updated = await updateJob(job.id, {
                progress: msg.progress,
                processed_items: msg.processed || 0,
                total_items: msg.total || 0,
            });
            notifyJob(job.id, updated);
        }
    });

    child.on('exit', async (code) => {
        activeProcesses.delete(job.id);
        const current = await getJob(job.id);
        if (current && current.status === 'running') {
            const finalStatus = code === 0 ? 'completed' : 'failed';
            const updated = await updateJob(job.id, {
                status: finalStatus,
                progress: code === 0 ? 100 : current.progress,
                completed_at: new Date(),
                error_message: code !== 0 ? `Process exited with code ${code}` : null,
            });
            notifyJob(job.id, updated);
        }
    });

    child.on('error', async (err) => {
        activeProcesses.delete(job.id);
        const updated = await updateJob(job.id, {
            status: 'failed',
            error_message: err.message,
            completed_at: new Date(),
        });
        notifyJob(job.id, updated);
    });

    return job;
}

// ── POST /api/jobs/send-test-email ─────────────────────────────────
router.post('/send-test-email', async (req, res, next) => {
    try {
        const { provider, from_name, subject, html_content, test_email } = req.body;
        const customHeaders = req.body.headers || {};
        if (!provider || !['gmail_api', 'smtp'].includes(provider)) {
            return res.status(400).json({ success: false, error: 'provider must be gmail_api or smtp' });
        }
        if (!from_name?.trim()) return res.status(400).json({ success: false, error: 'from_name is required' });
        if (!subject?.trim()) return res.status(400).json({ success: false, error: 'subject is required' });
        if (!html_content?.trim()) return res.status(400).json({ success: false, error: 'html_content is required' });
        if (!test_email?.trim() || !test_email.includes('@')) {
            return res.status(400).json({ success: false, error: 'A valid test_email is required' });
        }

        const users = await getUsers();
        if (!users.length) return res.status(400).json({ success: false, error: 'No sender users found' });

        const sender = users[0]; // Use first user as sender

        if (provider === 'gmail_api') {
            const { google } = require('googleapis');
            const axios = require('axios');
            const { loadGoogleCreds } = require('../googleCreds');
            const creds = await loadGoogleCreds();

            const jwtClient = new google.auth.JWT(
                creds.client_email, null, creds.private_key,
                ['https://mail.google.com/'], sender.email
            );
            const tokens = await jwtClient.authorize();
            const encodeRfc2047 = (str) => {
                if (!/[^\x20-\x7E]/.test(str)) return str;
                const bytes = Buffer.from(str, 'utf-8');
                const chunks = [];
                const chunkSize = 45;
                for (let i = 0; i < bytes.length; i += chunkSize) {
                    const chunk = bytes.slice(i, Math.min(i + chunkSize, bytes.length));
                    chunks.push(`=?UTF-8?B?${chunk.toString('base64')}?=`);
                }
                return chunks.join('\r\n ');
            };

            const encodedSubject = encodeRfc2047(subject);
            const encodedFrom = /[^\x20-\x7E]/.test(from_name)
                ? `${encodeRfc2047(from_name)} <${sender.email}>`
                : `"${from_name}" <${sender.email}>`;

            const bodyBase64 = Buffer.from(html_content, 'utf-8').toString('base64');
            const bodyLines = bodyBase64.match(/.{1,76}/g)?.join('\r\n') || '';

            const headerLines = [
                'MIME-Version: 1.0',
                'Content-Type: text/html; charset=UTF-8',
                'Content-Transfer-Encoding: base64',
                `From: ${encodedFrom}`,
                `To: ${test_email.trim()}`,
                `Subject: ${encodedSubject}`,
            ];
            if (customHeaders && typeof customHeaders === 'object') {
                for (const [key, value] of Object.entries(customHeaders)) {
                    if (value && String(value).trim()) headerLines.push(`${key}: ${String(value).trim()}`);
                }
            }

            const raw = Buffer.from(headerLines.join('\r\n') + '\r\n\r\n' + bodyLines, 'utf-8')
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            await axios.post(
                'https://www.googleapis.com/gmail/v1/users/me/messages/send',
                { raw },
                { headers: { Authorization: `Bearer ${tokens.access_token}`, 'Content-Type': 'application/json' } }
            );
        } else {
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com', port: 587, secure: false,
                auth: { user: sender.email, pass: sender.password },
            });
            await transporter.sendMail({
                from: `"${from_name}" <${sender.email}>`,
                to: test_email.trim(),
                subject,
                html: html_content,
                headers: customHeaders,
            });
        }

        // Log the test email
        await query(
            `INSERT INTO email_logs (user_email, to_email, message_index, status, provider, error_message, sent_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [sender.email, test_email.trim(), 0, 'sent', provider, null, new Date()]
        );

        res.json({ success: true, message: `Test email sent to ${test_email.trim()} via ${provider}` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message || 'Failed to send test email' });
    }
});

// ── GET /api/jobs ──────────────────────────────────────────────────
router.get('/', async (_req, res, next) => {
    try {
        const jobs = await getJobs();
        res.json({ success: true, data: jobs, count: jobs.length });
    } catch (error) { next(error); }
});

// ── GET /api/jobs/:id ──────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
    try {
        const job = await getJob(req.params.id);
        if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
        res.json({ success: true, data: job });
    } catch (error) { next(error); }
});

// ── GET /api/jobs/:id/stream  (SSE) ───────────────────────────────
router.get('/:id/stream', async (req, res) => {
    const jobId = parseInt(req.params.id, 10);
    const job = await getJob(jobId);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
    });
    res.write(`data: ${JSON.stringify(job)}\n\n`);

    if (!sseClients.has(jobId)) sseClients.set(jobId, []);
    sseClients.get(jobId).push(res);

    req.on('close', () => {
        const arr = sseClients.get(jobId);
        if (arr) {
            const idx = arr.indexOf(res);
            if (idx !== -1) arr.splice(idx, 1);
            if (arr.length === 0) sseClients.delete(jobId);
        }
    });

    if (['completed', 'failed', 'cancelled'].includes(job.status)) {
        res.end();
    }
});

// ── DELETE /api/jobs/:id ────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
    try {
        const job = await getJob(req.params.id);
        if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
        if (['running', 'paused', 'pending'].includes(job.status)) {
            return res.status(400).json({ success: false, error: 'Cannot delete an active job. Cancel it first.' });
        }
        await query('DELETE FROM jobs WHERE id = $1', [job.id]);
        res.json({ success: true, message: 'Job deleted' });
    } catch (error) { next(error); }
});

// ── POST /api/jobs/:id/cancel ─────────────────────────────────────
router.post('/:id/cancel', async (req, res, next) => {
    try {
        const job = await getJob(req.params.id);
        if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
        if (job.status !== 'running' && job.status !== 'pending' && job.status !== 'paused') {
            return res.status(400).json({ success: false, error: 'Job is not running or paused' });
        }
        const child = activeProcesses.get(job.id);
        if (child) { child.kill('SIGTERM'); activeProcesses.delete(job.id); }
        const updated = await updateJob(job.id, { status: 'cancelled', completed_at: new Date() });
        notifyJob(job.id, updated);
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

// ── POST /api/jobs/:id/pause ──────────────────────────────────────
router.post('/:id/pause', async (req, res, next) => {
    try {
        const job = await getJob(req.params.id);
        if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
        if (job.status !== 'running') {
            return res.status(400).json({ success: false, error: 'Only running jobs can be paused' });
        }
        const child = activeProcesses.get(job.id);
        if (child) { child.kill('SIGSTOP'); }
        const updated = await updateJob(job.id, { status: 'paused' });
        notifyJob(job.id, updated);
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

// ── POST /api/jobs/:id/resume ─────────────────────────────────────
router.post('/:id/resume', async (req, res, next) => {
    try {
        const job = await getJob(req.params.id);
        if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
        if (job.status !== 'paused') {
            return res.status(400).json({ success: false, error: 'Only paused jobs can be resumed' });
        }
        const child = activeProcesses.get(job.id);
        if (child) { child.kill('SIGCONT'); }
        const updated = await updateJob(job.id, { status: 'running' });
        notifyJob(job.id, updated);
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

// ── POST /api/jobs/send-campaign ───────────────────────────────────
router.post('/send-campaign', async (req, res, next) => {
    try {
        const { provider, from_name, subject, html_content, batch_size, geo, list_name, recipient_limit, recipient_offset, user_ids, campaign_id, campaign_name, campaign_description, offer_id } = req.body;
        const customHeaders = req.body.headers || {};
        if (!provider || !['gmail_api', 'smtp'].includes(provider)) {
            return res.status(400).json({ success: false, error: 'provider must be gmail_api or smtp' });
        }
        if (!from_name || !from_name.trim()) {
            return res.status(400).json({ success: false, error: 'from_name is required' });
        }
        if (!subject || !subject.trim()) {
            return res.status(400).json({ success: false, error: 'subject is required' });
        }
        if (!html_content || !html_content.trim()) {
            return res.status(400).json({ success: false, error: 'html_content is required' });
        }

        // Calculate LIMIT/OFFSET from "from index" / "to index" range
        const effOffset = recipient_offset ? Math.max(0, Number(recipient_offset) - 1) : null;
        const effLimit = (recipient_limit && effOffset != null)
            ? Math.max(1, Number(recipient_limit) - (effOffset)) 
            : (recipient_limit ? Number(recipient_limit) : null);

        const [allUsers, data] = await Promise.all([getUsers(), getEmailData(geo || null, effLimit, effOffset, list_name || null)]);
        if (!allUsers.length) return res.status(400).json({ success: false, error: 'No users found' });
        if (!data.length) return res.status(400).json({ success: false, error: 'No email recipients found' });

        // Filter users by IDs if specified, otherwise use all
        const users = (Array.isArray(user_ids) && user_ids.length > 0)
            ? allUsers.filter((u) => user_ids.includes(u.id))
            : allUsers;
        if (!users.length) return res.status(400).json({ success: false, error: 'No matching users found for selected IDs' });

        const batchNum = parseInt(batch_size, 10) || (provider === 'gmail_api' ? 300 : 20);
        const type = provider === 'gmail_api' ? 'send_campaign_api' : 'send_campaign_smtp';
        const job = await createJob({
            type,
            params: { provider, from_name, subject, html_content, batch_size: batchNum, geo: geo || null, list_name: list_name || null, recipient_offset: recipient_offset || null, recipient_limit: recipient_limit || null, user_ids: users.map((u) => u.id), totalRecipients: data.length, totalUsers: users.length, offer_id: offer_id || null, headers: customHeaders },
        });

        // If campaign_id provided, link it; otherwise create a new campaign record
        if (campaign_id) {
            await query('UPDATE campaigns SET job_id = $1, updated_at = NOW() WHERE id = $2', [job.id, campaign_id]);
        } else {
            // Always create a campaign record (use campaign_name if given, otherwise auto-generate)
            const name = campaign_name || `${from_name} — ${subject.slice(0, 60)}`;
            await query(
                `INSERT INTO campaigns (
                    name, description, job_id, from_name, subject, html_content,
                    provider, batch_size, geo, list_name, recipient_offset, recipient_limit, user_ids, offer_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
                [
                    name,
                    campaign_description || null,
                    job.id,
                    from_name,
                    subject,
                    html_content,
                    provider,
                    batchNum,
                    geo || null,
                    list_name || null,
                    recipient_offset || null,
                    recipient_limit || null,
                    users.map(u => u.id),
                    offer_id || null
                ]
            );
        }

        const script = provider === 'gmail_api'
            ? path.join(__dirname, '..', 'jobs', 'sendCampaignApi.js')
            : path.join(__dirname, '..', 'jobs', 'sendCampaignSmtp.js');

        await startJobProcess(job, script);
        res.status(201).json({ success: true, data: job });
    } catch (error) { next(error); }
});

// ── POST /api/jobs/send-emails ────────────────────────────────────
router.post('/send-emails', async (req, res, next) => {
    try {
        const { provider } = req.body;
        if (!provider || !['gmail_api', 'smtp'].includes(provider)) {
            return res.status(400).json({ success: false, error: 'provider must be gmail_api or smtp' });
        }

        const [users, data, info, template] = await Promise.all([
            getUsers(), getEmailData(), getActiveEmailInfo(), getActiveEmailTemplate(),
        ]);
        if (!users.length) return res.status(400).json({ success: false, error: 'No users found' });
        if (!data.length) return res.status(400).json({ success: false, error: 'No email recipients found' });
        if (!info) return res.status(400).json({ success: false, error: 'No active email info' });
        if (!template) return res.status(400).json({ success: false, error: 'No active email template' });

        const type = provider === 'gmail_api' ? 'send_email_api' : 'send_email_smtp';
        const job = await createJob({ type, params: { provider, totalRecipients: data.length, totalUsers: users.length } });

        const script = provider === 'gmail_api'
            ? path.join(__dirname, '..', 'jobs', 'sendEmailApi.js')
            : path.join(__dirname, '..', 'jobs', 'sendEmailSmtp.js');

        await startJobProcess(job, script);
        res.status(201).json({ success: true, data: job });
    } catch (error) { next(error); }
});

// ── POST /api/jobs/generate-users ─────────────────────────────────
router.post('/generate-users', async (req, res, next) => {
    try {
        const { domain, num_records } = req.body;
        if (!domain) return res.status(400).json({ success: false, error: 'domain is required' });
        const n = parseInt(num_records, 10);
        if (!n || n <= 0) return res.status(400).json({ success: false, error: 'num_records must be positive integer' });
        if (n > 10000) return res.status(400).json({ success: false, error: 'num_records max is 10000' });

        const names = await getNames();
        if (!names.length) return res.status(400).json({ success: false, error: 'No names in DB. Add names first.' });

        const job = await createJob({ type: 'generate_users', params: { domain, num_records: n } });
        await startJobProcess(job, path.join(__dirname, '..', 'jobs', 'generateUsers.js'), [domain, n.toString()]);
        res.status(201).json({ success: true, data: job });
    } catch (error) { next(error); }
});

// ── POST /api/jobs/create-google-users ────────────────────────────
router.post('/create-google-users', async (req, res, next) => {
    try {
        let { admin_email } = req.body;
        if (!admin_email) admin_email = await getSetting('admin_email');
        if (!admin_email || admin_email === 'admin@example.com') {
            return res.status(400).json({ success: false, error: 'admin_email is required. Set it in Settings or provide in request.' });
        }

        const users = await getUsers();
        if (!users.length) return res.status(400).json({ success: false, error: 'No users to create' });

        const job = await createJob({ type: 'create_google_users', params: { admin_email, totalUsers: users.length } });
        await startJobProcess(job, path.join(__dirname, '..', 'jobs', 'createGoogleUsers.js'), [admin_email]);
        res.status(201).json({ success: true, data: job });
    } catch (error) { next(error); }
});

// ── POST /api/jobs/delete-google-users ────────────────────────────
router.post('/delete-google-users', async (req, res, next) => {
    try {
        let { admin_email } = req.body;
        if (!admin_email) admin_email = await getSetting('admin_email');
        if (!admin_email || admin_email === 'admin@example.com') {
            return res.status(400).json({ success: false, error: 'admin_email is required' });
        }

        const job = await createJob({ type: 'delete_google_users', params: { admin_email } });
        await startJobProcess(job, path.join(__dirname, '..', 'jobs', 'deleteGoogleUsers.js'), [admin_email]);
        res.status(201).json({ success: true, data: job });
    } catch (error) { next(error); }
});

// ── POST /api/jobs/detect-bounces ─────────────────────────────────
router.post('/detect-bounces', async (req, res, next) => {
    try {
        const users = await getUsers();
        if (!users.length) return res.status(400).json({ success: false, error: 'No users to scan' });

        const job = await createJob({ type: 'detect_bounces', params: { totalUsers: users.length } });
        await startJobProcess(job, path.join(__dirname, '..', 'jobs', 'detectBounces.js'));
        res.status(201).json({ success: true, data: job });
    } catch (error) { next(error); }
});

// ── POST /api/jobs/bulk-users  (JSON array) ───────────────────────
router.post('/bulk-users', async (req, res, next) => {
    try {
        const { users } = req.body;
        if (!users || !Array.isArray(users) || !users.length) {
            return res.status(400).json({ success: false, error: 'users array is required' });
        }
        if (users.length > 10000) {
            return res.status(400).json({ success: false, error: 'Max 10000 users at once' });
        }

        let inserted = 0;
        let skipped = 0;
        for (const u of users) {
            if (!u.email) { skipped++; continue; }
            try {
                await query(
                    `INSERT INTO users (email, password, given_name, family_name) VALUES ($1,$2,$3,$4)
                     ON CONFLICT (email) DO NOTHING`,
                    [u.email, u.password || null, u.given_name || null, u.family_name || null]
                );
                inserted++;
            } catch (_) { skipped++; }
        }
        res.status(201).json({ success: true, inserted, skipped });
    } catch (error) { next(error); }
});

// ── POST /api/jobs/bulk-emails  (JSON array) ──────────────────────
router.post('/bulk-emails', async (req, res, next) => {
    try {
        const { emails } = req.body;
        if (!emails || !Array.isArray(emails) || !emails.length) {
            return res.status(400).json({ success: false, error: 'emails array is required' });
        }
        if (emails.length > 50000) {
            return res.status(400).json({ success: false, error: 'Max 50000 emails at once' });
        }

        let inserted = 0;
        for (const item of emails) {
            // Support both plain strings and objects { to_email, geo }
            const email = typeof item === 'string' ? item : item?.to_email;
            const geo = typeof item === 'object' ? (item?.geo || null) : null;
            const listName = typeof item === 'object' ? (item?.list_name || null) : null;
            if (!email || typeof email !== 'string') continue;
            await query('INSERT INTO email_data (to_email, geo, list_name) VALUES ($1, $2, $3)', [email.trim(), geo, listName]);
            inserted++;
        }
        res.status(201).json({ success: true, inserted });
    } catch (error) { next(error); }
});

// ── GET /api/jobs/:id/stats ─────────────────────────────────────────
router.get('/:id/stats', async (req, res, next) => {
    try {
        const jobId = parseInt(req.params.id, 10);
        const job = await getJob(jobId);
        if (!job) return res.status(404).json({ success: false, error: 'Job not found' });

        // Email log counts for this job
        const logResult = await query(
            `SELECT
                COUNT(*) FILTER (WHERE status = 'sent') AS sent,
                COUNT(*) FILTER (WHERE status = 'failed') AS failed,
                COUNT(*) AS total
             FROM email_logs
             WHERE job_id = $1`,
            [jobId]
        );

        // Click tracking counts for this job
        const clickResult = await query(
            `SELECT
                COUNT(*) AS total_links,
                COUNT(*) FILTER (WHERE clicked = TRUE) AS total_clicks,
                COUNT(DISTINCT to_email) FILTER (WHERE clicked = TRUE) AS unique_clickers
             FROM click_tracking
             WHERE job_id = $1`,
            [jobId]
        );

        const logStats = logResult.rows[0] || { sent: '0', failed: '0', total: '0' };
        const clickStats = clickResult.rows[0] || { total_links: '0', total_clicks: '0', unique_clickers: '0' };

        const sent = parseInt(logStats.sent, 10);
        const failed = parseInt(logStats.failed, 10);
        const totalClicks = parseInt(clickStats.total_clicks, 10);
        const uniqueClickers = parseInt(clickStats.unique_clickers, 10);
        const ctr = sent > 0 ? Math.round((uniqueClickers / sent) * 10000) / 100 : 0;

        res.json({
            success: true,
            data: {
                job_id: jobId,
                sent,
                failed,
                total_clicks: totalClicks,
                unique_clickers: uniqueClickers,
                ctr,
            },
        });
    } catch (error) { next(error); }
});

// ── POST /api/jobs/bulk-names  (JSON array) ───────────────────────
router.post('/bulk-names', async (req, res, next) => {
    try {
        const { names } = req.body;
        if (!names || !Array.isArray(names) || !names.length) {
            return res.status(400).json({ success: false, error: 'names array is required' });
        }

        let inserted = 0;
        for (const n of names) {
            if (!n.given_name || !n.family_name) continue;
            await query(
                'INSERT INTO names (given_name, family_name) VALUES ($1, $2)',
                [n.given_name.trim(), n.family_name.trim()]
            );
            inserted++;
        }
        res.status(201).json({ success: true, inserted });
    } catch (error) { next(error); }
});

module.exports = router;
