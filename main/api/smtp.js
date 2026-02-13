const nodemailer = require('nodemailer');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const {
    getUsers,
    getEmailData,
    getActiveEmailInfo,
    getActiveEmailTemplate,
    insertEmailLog,
} = require('./db/queries');

// Constants for email sending configuration
const QUOTA_LIMIT = 1200000;
const REQUESTS_PER_EMAIL = 20;
const INTERVAL = 60000 / QUOTA_LIMIT;

// Variables to track successful email sending and request count
let successfulEmails = 0;

const generateRandomString = (length) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

// Function to send email using SMTP
const sendEmail = async (user, to, from, subject, htmlContent, messageIndex) => {
    // Validate inputs
    if (!user || !user.email || !user.password) {
        throw new Error('Invalid user credentials');
    }
    if (!to || !to.includes('@')) {
        throw new Error('Invalid recipient email address');
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

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: user.email,
            pass: user.password,
        },
    });

    htmlContent = htmlContent.replace('[to]', generateRandomString(1000));
    const to_ = to.split('@')[0];
    htmlContent = htmlContent.replace('[to]', to_);

    try {
        await transporter.sendMail({
            from: `"${from}" <${user.email}>`,
            to:to,
            subject:subject,
            html: htmlContent,
        });
        successfulEmails++;
        await insertEmailLog({
            userEmail: user.email,
            toEmail: to,
            messageIndex,
            status: 'sent',
            provider: 'smtp',
            errorMessage: null,
            sentAt: new Date(),
        });
    } catch (error) {
        await insertEmailLog({
            userEmail: user.email,
            toEmail: to,
            messageIndex,
            status: 'failed',
            provider: 'smtp',
            errorMessage: error && error.message ? error.message : 'send failed',
            sentAt: new Date(),
        });
        console.error('Failed to send email:', error);
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
    
    console.log(`Starting email campaign: ${users.length} users, ${data.length} recipients`);

    const emailsPerWorker = Math.ceil(data.length / Math.ceil(users.length / 50));

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

const main = async () => {
    // If running as a worker thread, execute the email sending logic
    if (!isMainThread) {
        const { users, data, htmlContent, from, subject } = workerData;
        // Process each user and send emails
        let index = 0;
        let messageIndex = 0;
        for (let user of users) {
            for (let j = 0; j < REQUESTS_PER_EMAIL && index < data.length; j++) {
                const emailData = data[index++];
                // Write the output to the log file
                await sendEmail(user, emailData.to_email, from, subject, htmlContent, messageIndex++);
                await sleep(INTERVAL);
            }
        }
        // Close the log file stream
        parentPort.postMessage('Done');
    } else {
        sendEmails().catch(console.error);
    }
}

main();
