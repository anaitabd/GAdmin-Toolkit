const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { withClient } = require('./index');

const filesDir = path.resolve(__dirname, '../../../files');
const apiDir = path.resolve(__dirname, '..');

const readCsv = async (filePath) => {
    const items = [];
    if (!fs.existsSync(filePath)) return items;
    await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => items.push(row))
            .on('end', resolve)
            .on('error', reject);
    });
    return items;
};

const readLines = (filePath) => {
    if (!fs.existsSync(filePath)) return [];
    return fs.readFileSync(filePath, 'utf8')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
};

const parseLogLine = (line) => {
    // Example: User: a@b.com, To: c@d.com, Message sent: 1, Date-Time: 4/9/2024, 10:00:00
    const userMatch = line.match(/User:\s*([^,]+),/i);
    const toMatch = line.match(/To:\s*([^,]+),/i);
    const dateMatch = line.match(/Date-Time:\s*(.+)$/i);
    const userEmail = userMatch ? userMatch[1].trim() : null;
    const toEmail = toMatch ? toMatch[1].trim() : null;
    const sentAt = dateMatch ? new Date(dateMatch[1].trim()) : null;
    return { userEmail, toEmail, sentAt };
};

const importUsers = async (client) => {
    const usersFile = path.join(filesDir, 'users.csv');
    const userListFile = path.join(filesDir, 'user_list.csv');
    const users = await readCsv(usersFile);
    const userList = await readCsv(userListFile);

    const allUsers = [];
    for (const row of users) {
        if (!row.email) continue;
        allUsers.push({
            email: row.email,
            password: row.password || null,
            givenName: row.givenName || null,
            familyName: row.familyName || null,
        });
    }
    for (const row of userList) {
        if (!row.email) continue;
        allUsers.push({
            email: row.email,
            password: row.password || null,
            givenName: row.givenName || null,
            familyName: row.familyName || null,
        });
    }

    for (const user of allUsers) {
        await client.query(
            `INSERT INTO users (email, password, given_name, family_name)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (email) DO UPDATE SET
             password = EXCLUDED.password,
             given_name = COALESCE(EXCLUDED.given_name, users.given_name),
             family_name = COALESCE(EXCLUDED.family_name, users.family_name)`,
            [user.email, user.password, user.givenName, user.familyName]
        );
    }
    return allUsers.length;
};

const importEmailData = async (client) => {
    const dataFile = path.join(filesDir, 'data.csv');
    const data = await readCsv(dataFile);
    for (const row of data) {
        if (!row.to) continue;
        await client.query(
            'INSERT INTO email_data (to_email) VALUES ($1)',
            [row.to]
        );
    }
    return data.length;
};

const importEmailInfo = async (client) => {
    const infoFile = path.join(filesDir, 'info.csv');
    const info = await readCsv(infoFile);
    let count = 0;
    for (const row of info) {
        if (!row.from || !row.subject) continue;
        await client.query(
            'INSERT INTO email_info (from_name, subject, active) VALUES ($1, $2, $3)',
            [row.from, row.subject, true]
        );
        count++;
    }
    return count;
};

const importEmailTemplate = async (client) => {
    const htmlFile = path.join(filesDir, 'html.txt');
    if (!fs.existsSync(htmlFile)) return 0;
    const htmlContent = fs.readFileSync(htmlFile, 'utf8').trim();
    if (!htmlContent) return 0;
    await client.query(
        'INSERT INTO email_templates (name, html_content, active) VALUES ($1, $2, $3)',
        ['default', htmlContent, true]
    );
    return 1;
};

const importEmailLogs = async (client) => {
    const apiLogs = path.join(apiDir, 'email_logs.txt');
    const smtpLogs = path.join(apiDir, 'smtp_email_logs.txt');

    const importLogFile = async (filePath, provider) => {
        const lines = readLines(filePath);
        let count = 0;
        for (const line of lines) {
            const { userEmail, toEmail, sentAt } = parseLogLine(line);
            if (!userEmail || !toEmail) continue;
            await client.query(
                `INSERT INTO email_logs
                (user_email, to_email, status, provider, sent_at)
                VALUES ($1, $2, $3, $4, $5)`,
                [userEmail, toEmail, 'sent', provider, sentAt || new Date()]
            );
            count++;
        }
        return count;
    };

    const apiCount = await importLogFile(apiLogs, 'gmail_api');
    const smtpCount = await importLogFile(smtpLogs, 'smtp');
    return apiCount + smtpCount;
};

const importNames = async (client) => {
    const namesFile = path.join(filesDir, 'names.csv');
    if (!fs.existsSync(namesFile)) return 0;
    const lines = readLines(namesFile);
    let count = 0;
    for (const line of lines) {
        const [givenName, familyName] = line.split(',');
        if (!givenName || !familyName) continue;
        await client.query(
            'INSERT INTO names (given_name, family_name) VALUES ($1, $2)',
            [givenName.trim(), familyName.trim()]
        );
        count++;
    }
    return count;
};

const importBounceLogs = async (client) => {
    const bounceFile = path.join(apiDir, 'bounced_emails.csv');
    if (!fs.existsSync(bounceFile)) return 0;
    const lines = readLines(bounceFile);
    let count = 0;
    for (const line of lines) {
        const email = line.trim();
        if (!email || email.includes('email')) continue;
        await client.query(
            'INSERT INTO bounce_logs (email, reason, detected_at) VALUES ($1, $2, $3)',
            [email, null, new Date()]
        );
        count++;
    }
    return count;
};

const main = async () => {
    await withClient(async (client) => {
        await client.query('BEGIN');
        try {
            const usersCount = await importUsers(client);
            const dataCount = await importEmailData(client);
            const infoCount = await importEmailInfo(client);
            const templateCount = await importEmailTemplate(client);
            const logCount = await importEmailLogs(client);
            const namesCount = await importNames(client);
            const bounceCount = await importBounceLogs(client);
            await client.query('COMMIT');
            console.log('Import complete');
            console.log('users:', usersCount);
            console.log('email_data:', dataCount);
            console.log('email_info:', infoCount);
            console.log('email_templates:', templateCount);
            console.log('email_logs:', logCount);
            console.log('names:', namesCount);
            console.log('bounce_logs:', bounceCount);
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        }
    });
};

main().catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
});
