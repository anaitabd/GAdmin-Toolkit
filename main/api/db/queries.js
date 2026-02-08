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
        (user_email, to_email, message_index, status, provider, error_message, sent_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
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

module.exports = {
    getUsers,
    getEmailData,
    getActiveEmailInfo,
    getActiveEmailTemplate,
    insertEmailLog,
    insertBounceLog,
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
