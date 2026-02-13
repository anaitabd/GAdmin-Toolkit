const { google } = require('googleapis');
const axios = require('axios');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const {
    getUsers,
    getEmailData,
    getActiveEmailInfo,
    getActiveEmailTemplate,
    insertEmailLog,
} = require('./db/queries');
const { loadGoogleCreds } = require('./googleCreds');
const { isValidEmail, isValidGoogleCreds } = require('./lib/validation');

// Constants for email sending configuration
const QUOTA_LIMIT = 1200000;
const REQUESTS_PER_EMAIL = 300;
const INTERVAL = 60000 / QUOTA_LIMIT;

// Variables to track successful email sending and request count
let successfulEmails = 0;

// Function to generate a random string of given length
const generateRandomString = (length) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

const createMimeMessage = (user, to, from, subject, htmlContent) => {

    /* 
    htmlContent = htmlContent.replace('[user]',user)            
    */

    const raw = Buffer.from(
        `Content-Type: text/html; charset="UTF-8"\n` +
        `From: "${from} <${user}>\n` +
        `To: ${to}\n` +
        `Subject: ${subject}\n\n` +
        htmlContent,
        `utf-8`
    ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');


    return raw;
};

// Function to send email using Google APIs
const sendEmail = async (creds, user, to, from, subject, htmlContent, messageIndex) => {
    // Validate inputs
    if (!isValidGoogleCreds(creds)) {
        throw new Error('Invalid Google credentials');
    }
    if (!isValidEmail(user)) {
        throw new Error(`Invalid sender email address: ${user}`);
    }
    if (!isValidEmail(to)) {
        throw new Error(`Invalid recipient email address: ${to}`);
    }
    if (!from) {
        throw new Error('From name is required');
    }
    if (!subject) {
        throw new Error('Subject is required');
    }
    if (!htmlContent) {
        throw new Error('HTML content is required');
    }

    const jwtClient = new google.auth.JWT(
        creds.client_email,
        null,
        creds.private_key,
        ['https://mail.google.com/'],
        user
    );

    const tokens = await jwtClient.authorize();
    if (!tokens) {
        console.log('Failed to authorize');
        return;
    }

    const raw = createMimeMessage(user, to, from, subject, htmlContent);

    const url = 'https://www.googleapis.com/gmail/v1/users/me/messages/send';
    const headers = { 'Authorization': `Bearer ${tokens.access_token}`, 'Content-Type': 'application/json' };
    const data = { raw };

    try {
        await axios.post(url, data, { headers });
        await successfulEmails++;
        await insertEmailLog({
            userEmail: user,
            toEmail: to,
            messageIndex,
            status: 'sent',
            provider: 'gmail_api',
            errorMessage: null,
            sentAt: new Date(),
        });
        await console.log(successfulEmails);
    } catch (error) {
        await insertEmailLog({
            userEmail: user,
            toEmail: to,
            messageIndex,
            status: 'failed',
            provider: 'gmail_api',
            errorMessage: error && error.message ? error.message : 'send failed',
            sentAt: new Date(),
        });
        console.error('Failed to send email:');
    }
};

// Function to introduce delay for rate limiting
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const sendEmails = async () => {
    const users = await getUsers();
    if (!users || users.length === 0) {
        throw new Error('No users found in database');
    }
    
    const data = await getEmailData();
    if (!data || data.length === 0) {
        throw new Error('No email data found in database');
    }
    
    const info = await getActiveEmailInfo();
    const template = await getActiveEmailTemplate();
    if (!info || !template) {
        throw new Error('Missing active email_info or email_templates in DB');
    }
    
    const { from_name: from, subject } = info;
    const htmlContent = template.html_content;

    console.log(`Starting Gmail API campaign: ${users.length} users, ${data.length} recipients`);


    const emailsPerWorker = Math.ceil(data.length / Math.ceil(users.length / 100));

    const workerPromises = [];
    for (let i = 0, dataIndex = 0; dataIndex < data.length; i++, dataIndex += emailsPerWorker) {
        const usersBatch = users.slice(i * 100, (i + 1) * 100);
        const dataSlice = data.slice(dataIndex, dataIndex + emailsPerWorker);
        const workerData = {
            users: usersBatch,
            data: dataSlice,
            htmlContent,
            from,
            subject,
        };
        const workerPromise = createWorker(workerData);
        workerPromises.push(workerPromise);
    }
    // Wait for all worker threads to complete
    await Promise.all(workerPromises);
    console.log('All emails sent successfully.');
};

const createWorker = (workerData) => new Promise((resolve, reject) => {
    const worker = new Worker(__filename, { workerData });
    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
        if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
    });
});

const main = async() => {
    // If running as a worker thread, execute the email sending logic
    if (!isMainThread) {
        const { users, data, htmlContent, from, subject } = workerData;
        const creds = await loadGoogleCreds();
        // Process each user and send emails
        let index = 0;
        let messageIndex = 0;
        for (let user of users) {
            for (let j = 0; j < REQUESTS_PER_EMAIL && index < data.length; j++) {
                const emailData = data[index++];
                console.log(emailData['to_email']);
                
                await sendEmail(
                    creds,
                    user.email,
                    emailData.to_email,
                    from,
                    subject,
                    htmlContent,
                    messageIndex++
                );
                await sleep(INTERVAL);
            }
        }
        parentPort.postMessage('Done');
    } else {
        sendEmails().catch(console.error);
    }
}

main();
