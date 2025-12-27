const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Load Google credentials
let privateKey;
try {
    const credPath = process.env.GOOGLE_CREDENTIALS_PATH || path.join(__dirname, '../config/cred.json');
    if (fs.existsSync(credPath)) {
        privateKey = require(credPath);
    }
} catch (error) {
    console.warn('Google credentials not found. SendAPI functionality will be disabled.');
}

/**
 * Create MIME message for Gmail API
 */
const createMimeMessage = (user, to, from, subject, htmlContent) => {
    const raw = Buffer.from(
        `Content-Type: text/html; charset="UTF-8"\n` +
        `From: "${from}" <${user}>\n` +
        `To: ${to}\n` +
        `Subject: ${subject}\n\n` +
        htmlContent,
        'utf-8'
    ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
    
    return raw;
};

/**
 * Send email using Google API (SendAPI method)
 */
const sendEmailViaAPI = async (user, to, from, subject, htmlContent) => {
    if (!privateKey) {
        throw new Error('Google credentials not configured');
    }

    const jwtClient = new google.auth.JWT(
        privateKey.client_email,
        null,
        privateKey.private_key,
        ['https://mail.google.com/'],
        user
    );

    const tokens = await jwtClient.authorize();
    if (!tokens) {
        throw new Error('Failed to authorize with Google');
    }

    const raw = createMimeMessage(user, to, from, subject, htmlContent);
    
    const gmail = google.gmail({ version: 'v1', auth: jwtClient });
    await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw }
    });

    return true;
};

/**
 * Send email using SMTP (nodemailer)
 */
const sendEmailViaSMTP = async (user, password, to, from, subject, htmlContent) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: user,
            pass: password
        }
    });

    await transporter.sendMail({
        from: `"${from}" <${user}>`,
        to: to,
        subject: subject,
        html: htmlContent
    });

    return true;
};

/**
 * Send emails in bulk using SendAPI method
 */
const sendBulkEmailsAPI = async (users, recipients, from, subject, htmlContent) => {
    const results = {
        success: [],
        failed: []
    };

    const REQUESTS_PER_EMAIL = 300;
    const INTERVAL = 50; // 50ms delay between requests

    let recipientIndex = 0;
    
    for (const user of users) {
        let emailsSent = 0;
        while (emailsSent < REQUESTS_PER_EMAIL && recipientIndex < recipients.length) {
            const recipient = recipients[recipientIndex];
            try {
                await sendEmailViaAPI(user.email, recipient, from, subject, htmlContent);
                results.success.push({
                    user: user.email,
                    recipient: recipient,
                    method: 'API'
                });
                emailsSent++;
                recipientIndex++;
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, INTERVAL));
            } catch (error) {
                results.failed.push({
                    user: user.email,
                    recipient: recipient,
                    error: error.message
                });
                recipientIndex++;
            }
        }
        
        if (recipientIndex >= recipients.length) break;
    }

    return results;
};

/**
 * Send emails in bulk using SMTP method
 */
const sendBulkEmailsSMTP = async (users, recipients, from, subject, htmlContent) => {
    const results = {
        success: [],
        failed: []
    };

    const REQUESTS_PER_EMAIL = 20;
    const INTERVAL = 50; // 50ms delay between requests

    let recipientIndex = 0;
    
    for (const user of users) {
        let emailsSent = 0;
        while (emailsSent < REQUESTS_PER_EMAIL && recipientIndex < recipients.length) {
            const recipient = recipients[recipientIndex];
            try {
                await sendEmailViaSMTP(user.email, user.password, recipient, from, subject, htmlContent);
                results.success.push({
                    user: user.email,
                    recipient: recipient,
                    method: 'SMTP'
                });
                emailsSent++;
                recipientIndex++;
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, INTERVAL));
            } catch (error) {
                results.failed.push({
                    user: user.email,
                    recipient: recipient,
                    error: error.message
                });
                recipientIndex++;
            }
        }
        
        if (recipientIndex >= recipients.length) break;
    }

    return results;
};

/**
 * Execute Python email sending script
 */
const sendEmailsViaPython = () => {
    return new Promise((resolve, reject) => {
        const pythonScript = path.join(__dirname, '../../py/send.py');
        
        if (!fs.existsSync(pythonScript)) {
            return reject(new Error('Python script not found'));
        }

        const pythonProcess = spawn('python3', [pythonScript]);
        
        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
            console.log(`Python output: ${data}`);
        });

        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
            console.error(`Python error: ${data}`);
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                resolve({ success: true, output });
            } else {
                reject(new Error(`Python script failed with code ${code}: ${errorOutput}`));
            }
        });
    });
};

module.exports = {
    sendEmailViaAPI,
    sendEmailViaSMTP,
    sendBulkEmailsAPI,
    sendBulkEmailsSMTP,
    sendEmailsViaPython
};
