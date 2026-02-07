const { query } = require('./index');

const getUsers = async () => {
    const result = await query(
        'SELECT id, email, password, given_name, family_name FROM users ORDER BY id'
    );
    return result.rows;
};

const getEmailData = async () => {
    const result = await query(
        'SELECT id, to_email FROM email_data ORDER BY id'
    );
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

module.exports = {
    getUsers,
    getEmailData,
    getActiveEmailInfo,
    getActiveEmailTemplate,
    insertEmailLog,
    insertBounceLog,
    getNames,
};
