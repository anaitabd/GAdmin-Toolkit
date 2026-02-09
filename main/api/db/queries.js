const { query } = require('./index');

const getUsers = async () => {
    const result = await query(
        'SELECT id, email, password, given_name, family_name FROM users ORDER BY id'
    );
    return result.rows;
};

const getEmailData = async (geo, limit, offset, listName) => {
    let text = 'SELECT id, to_email, geo, list_name FROM email_data';
    const params = [];
    const conditions = [];
    if (geo) {
        params.push(geo);
        conditions.push(`geo = $${params.length}`);
    }
    if (listName) {
        params.push(listName);
        conditions.push(`list_name = $${params.length}`);
    }
    if (conditions.length > 0) {
        text += ` WHERE ${conditions.join(' AND ')}`;
    }
    text += ' ORDER BY id';
    if (limit && Number(limit) > 0) {
        params.push(Number(limit));
        text += ` LIMIT $${params.length}`;
    }
    if (offset && Number(offset) > 0) {
        params.push(Number(offset));
        text += ` OFFSET $${params.length}`;
    }
    const result = await query(text, params);
    return result.rows;
};

const getActiveEmailInfo = async () => {
    const result = await query(
        'SELECT id, from_name, subject FROM email_info WHERE active = true ORDER BY created_at DESC LIMIT 1'
    );
    return result.rows[0] || null;
};

const getActiveEmailTemplate = async () => {
    const result = await query(
        'SELECT id, name, html_content FROM email_templates WHERE active = true ORDER BY created_at DESC LIMIT 1'
    );
    return result.rows[0] || null;
};

const insertEmailLog = async ({
    jobId,
    userEmail,
    toEmail,
    messageIndex,
    status,
    provider,
    errorMessage,
    sentAt,
}) => {
    await query(
        `INSERT INTO email_logs
        (job_id, user_email, to_email, message_index, status, provider, error_message, sent_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
            jobId || null,
            userEmail,
            toEmail,
            messageIndex,
            status,
            provider,
            errorMessage || null,
            sentAt || new Date(),
        ]
    );
};

const insertBounceLog = async ({ email, reason }) => {
    await query(
        'INSERT INTO bounce_logs (email, reason, detected_at) VALUES ($1, $2, $3)',
        [email, reason || null, new Date()]
    );
};

const getNames = async () => {
    const result = await query(
        'SELECT id, given_name, family_name FROM names ORDER BY id'
    );
    return result.rows;
};

const getActiveCredential = async () => {
    const result = await query(
        'SELECT id, name, cred_json FROM credentials WHERE active = true ORDER BY updated_at DESC LIMIT 1'
    );
    return result.rows[0] || null;
};

const getCredentials = async () => {
    const result = await query(
        'SELECT id, name, cred_json, active FROM credentials ORDER BY id'
    );
    return result.rows;
};

// ── Jobs ───────────────────────────────────────────────────────────
const createJob = async ({ type, params }) => {
    const result = await query(
        `INSERT INTO jobs (type, status, params) VALUES ($1, 'pending', $2) RETURNING *`,
        [type, params ? JSON.stringify(params) : null]
    );
    return result.rows[0];
};

const getJob = async (id) => {
    const result = await query('SELECT * FROM jobs WHERE id = $1', [id]);
    return result.rows[0] || null;
};

const getJobs = async (limit = 50) => {
    const result = await query(
        'SELECT * FROM jobs ORDER BY created_at DESC LIMIT $1',
        [limit]
    );
    return result.rows;
};

const updateJob = async (id, fields) => {
    const sets = [];
    const vals = [];
    let i = 1;
    for (const [k, v] of Object.entries(fields)) {
        sets.push(`${k} = $${i++}`);
        vals.push(v);
    }
    vals.push(id);
    const result = await query(
        `UPDATE jobs SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
        vals
    );
    return result.rows[0];
};

// ── Settings ───────────────────────────────────────────────────────
const getSetting = async (key) => {
    const result = await query('SELECT value FROM settings WHERE key = $1', [key]);
    return result.rows[0]?.value ?? null;
};

const getAllSettings = async () => {
    const result = await query('SELECT key, value, updated_at FROM settings ORDER BY key');
    return result.rows;
};

const upsertSetting = async (key, value) => {
    await query(
        `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, value]
    );
};

// ── Click Tracking ─────────────────────────────────────────────────
/**
 * Insert a batch of click tracking rows and return their track_ids.
 * @param {number} jobId
 * @param {string} toEmail
 * @param {string[]} urls - array of original URLs to track
 * @param {number|null} offerId - optional offer ID for dynamic redirect
 * @param {string} linkType - 'click' (default) or 'unsub'
 * @returns {Promise<{original_url: string, track_id: string}[]>}
 */
const insertClickTrackingBatch = async (jobId, toEmail, urls, offerId = null, linkType = 'click') => {
    if (!urls.length) return [];
    // Build a multi-row INSERT
    const params = [];
    const rows = [];
    for (let i = 0; i < urls.length; i++) {
        const offset = i * 5;
        rows.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`);
        params.push(jobId, toEmail, urls[i], offerId, linkType);
    }
    const result = await query(
        `INSERT INTO click_tracking (job_id, to_email, original_url, offer_id, link_type)
         VALUES ${rows.join(', ')}
         RETURNING original_url, track_id`,
        params
    );
    return result.rows;
};

/**
 * Insert a single tracking row for an offer tag ([click] or [unsub]).
 * @param {number} jobId
 * @param {string} toEmail
 * @param {string} originalUrl - the offer's click_url or unsub_url
 * @param {number} offerId - offer ID for dynamic redirect
 * @param {string} linkType - 'click' or 'unsub'
 * @returns {Promise<{track_id: string}>}
 */
const insertOfferTagTracking = async (jobId, toEmail, originalUrl, offerId, linkType) => {
    const result = await query(
        `INSERT INTO click_tracking (job_id, to_email, original_url, offer_id, link_type)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING track_id`,
        [jobId, toEmail, originalUrl, offerId, linkType]
    );
    return result.rows[0];
};

/**
 * Fetch an offer by ID.
 * @param {number} id
 * @returns {Promise<{id: number, name: string, click_url: string, unsub_url: string|null} | null>}
 */
const getOffer = async (id) => {
    const result = await query(
        'SELECT id, name, subject, from_name, html_content, click_url, unsub_url, active FROM offers WHERE id = $1',
        [id]
    );
    return result.rows[0] || null;
};

/**
 * Insert an open tracking row for a recipient.
 * @param {number} jobId
 * @param {string} toEmail
 * @returns {Promise<{id: number, track_id: string}>}
 */
const insertOpenTracking = async (jobId, toEmail) => {
    const result = await query(
        `INSERT INTO open_tracking (job_id, to_email)
         VALUES ($1, $2)
         RETURNING id, track_id`,
        [jobId, toEmail]
    );
    return result.rows[0];
};

module.exports = {
    getUsers,
    getEmailData,
    getActiveEmailInfo,
    getActiveEmailTemplate,
    insertEmailLog,
    insertBounceLog,
    insertClickTrackingBatch,
    insertOfferTagTracking,
    insertOpenTracking,
    getOffer,
    getNames,
    getActiveCredential,
    getCredentials,
    createJob,
    getJob,
    getJobs,
    updateJob,
    getSetting,
    getAllSettings,
    upsertSetting,
};
