const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { google } = require('googleapis');
const axios = require('axios');
const nodemailer = require('nodemailer');
const { getDB } = require('../config/database');

const createMimeMessage = (user, to, from, subject, htmlContent) => {
    const raw = Buffer.from(
        `Content-Type: text/html; charset="UTF-8"\n` +
        `From: "${from}" <${user}>\n` +
        `To: ${to}\n` +
        `Subject: ${subject}\n\n` +
        htmlContent,
        `utf-8`
    ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

    return raw;
};

const sendEmailViaAPI = async (req, res) => {
    try {
        const { recipients, from, subject, htmlContent } = req.body;

        if (!recipients || !from || !subject || !htmlContent) {
            return res.status(400).json({ 
                error: 'Recipients, from, subject, and htmlContent are required' 
            });
        }

        const credPath = './cred.json';
        if (!fs.existsSync(credPath)) {
            return res.status(400).json({ error: 'Google credentials file not found' });
        }

        const privateKey = require(credPath);
        const db = getDB();

        // Read users from CSV
        const users = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(path.resolve(__dirname, '../../files/users.csv'))
                .pipe(csv())
                .on('data', (row) => users.push(row))
                .on('end', resolve)
                .on('error', reject);
        });

        if (users.length === 0) {
            return res.status(400).json({ error: 'No users found in users.csv' });
        }

        const results = { sent: 0, failed: 0 };
        let userIndex = 0;

        for (const recipient of recipients) {
            try {
                const user = users[userIndex % users.length];
                
                const jwtClient = new google.auth.JWT(
                    privateKey.client_email, 
                    null, 
                    privateKey.private_key, 
                    ['https://mail.google.com/'], 
                    user.email
                );

                const tokens = await jwtClient.authorize();
                const raw = createMimeMessage(user.email, recipient, from, subject, htmlContent);

                const url = 'https://www.googleapis.com/gmail/v1/users/me/messages/send';
                const headers = { 
                    'Authorization': `Bearer ${tokens.access_token}`, 
                    'Content-Type': 'application/json' 
                };

                await axios.post(url, { raw }, { headers });

                // Log to database
                await db.collection('email_logs').insertOne({
                    user: user.email,
                    to: recipient,
                    from: from,
                    subject: subject,
                    method: 'gmail_api',
                    status: 'sent',
                    timestamp: new Date()
                });

                results.sent++;
                userIndex++;

                // Rate limiting delay
                await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error) {
                console.error('Failed to send email:', error.message);
                results.failed++;
            }
        }

        res.json({
            message: 'Email sending completed',
            results
        });
    } catch (error) {
        console.error('Send email via API error:', error);
        res.status(500).json({ error: 'Failed to send emails' });
    }
};

const sendEmailViaSMTP = async (req, res) => {
    try {
        const { recipients, from, subject, htmlContent } = req.body;

        if (!recipients || !from || !subject || !htmlContent) {
            return res.status(400).json({ 
                error: 'Recipients, from, subject, and htmlContent are required' 
            });
        }

        const db = getDB();

        // Read users from CSV
        const users = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(path.resolve(__dirname, '../../files/users.csv'))
                .pipe(csv())
                .on('data', (row) => users.push(row))
                .on('end', resolve)
                .on('error', reject);
        });

        if (users.length === 0) {
            return res.status(400).json({ error: 'No users found in users.csv' });
        }

        const results = { sent: 0, failed: 0 };
        let userIndex = 0;

        for (const recipient of recipients) {
            try {
                const user = users[userIndex % users.length];
                
                const transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false,
                    auth: {
                        user: user.email,
                        pass: user.password || 'Password123@',
                    },
                });

                await transporter.sendMail({
                    from: `"${from}" <${user.email}>`,
                    to: recipient,
                    subject: subject,
                    html: htmlContent,
                });

                // Log to database
                await db.collection('email_logs').insertOne({
                    user: user.email,
                    to: recipient,
                    from: from,
                    subject: subject,
                    method: 'smtp',
                    status: 'sent',
                    timestamp: new Date()
                });

                results.sent++;
                userIndex++;

                // Rate limiting delay
                await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error) {
                console.error('Failed to send email:', error.message);
                results.failed++;
            }
        }

        res.json({
            message: 'Email sending completed',
            results
        });
    } catch (error) {
        console.error('Send email via SMTP error:', error);
        res.status(500).json({ error: 'Failed to send emails' });
    }
};

const getBouncedEmails = async (req, res) => {
    try {
        const credPath = './cred.json';
        if (!fs.existsSync(credPath)) {
            return res.status(400).json({ error: 'Google credentials file not found' });
        }

        const privateKey = require(credPath);
        const db = getDB();

        // Read users from CSV
        const users = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(path.resolve(__dirname, '../../files/users.csv'))
                .pipe(csv())
                .on('data', (row) => users.push(row))
                .on('end', resolve)
                .on('error', reject);
        });

        const bouncedEmails = [];

        for (const user of users) {
            try {
                const jwtClient = new google.auth.JWT(
                    privateKey.client_email,
                    null,
                    privateKey.private_key,
                    ['https://mail.google.com'],
                    user.email
                );

                const gmail = google.gmail({ version: 'v1', auth: jwtClient });
                
                const response = await gmail.users.messages.list({
                    userId: 'me',
                    q: 'from:"Mail Delivery Subsystem"'
                });

                if (response.data.messages) {
                    for (const message of response.data.messages) {
                        const msg = await gmail.users.messages.get({
                            userId: 'me',
                            id: message.id,
                        });

                        const snippet = msg.data.snippet;
                        const match = snippet.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
                        
                        if (match && !snippet.includes("Message blocked")) {
                            bouncedEmails.push({
                                email: match[0],
                                user: user.email,
                                timestamp: new Date()
                            });

                            // Save to database
                            await db.collection('bounced_emails').updateOne(
                                { email: match[0] },
                                { $set: { email: match[0], user: user.email, timestamp: new Date() } },
                                { upsert: true }
                            );
                        }
                    }
                }
            } catch (error) {
                console.error(`Error processing user ${user.email}:`, error.message);
            }
        }

        res.json({
            message: 'Bounced emails retrieved',
            count: bouncedEmails.length,
            emails: bouncedEmails
        });
    } catch (error) {
        console.error('Get bounced emails error:', error);
        res.status(500).json({ error: 'Failed to get bounced emails' });
    }
};

const getEmailLogs = async (req, res) => {
    try {
        const db = getDB();
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const logs = await db.collection('email_logs')
            .find({})
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        const total = await db.collection('email_logs').countDocuments();

        res.json({
            logs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get email logs error:', error);
        res.status(500).json({ error: 'Failed to get email logs' });
    }
};

module.exports = {
    sendEmailViaAPI,
    sendEmailViaSMTP,
    getBouncedEmails,
    getEmailLogs
};
