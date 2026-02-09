const express = require('express');
const router = express.Router();
const { fork } = require('child_process');
const path = require('path');
const {
    getUsers,
    getEmailData,
    getActiveEmailInfo,
    getActiveEmailTemplate,
} = require('../db/queries');
const { emailSendLimiter, testEmailLimiter } = require('../middleware/rateLimiter');

// POST send emails via Gmail API
router.post('/gmail-api', emailSendLimiter, async (req, res, next) => {
    try {
        // Validate prerequisites
        const users = await getUsers();
        const data = await getEmailData();
        const info = await getActiveEmailInfo();
        const template = await getActiveEmailTemplate();

        if (!users || users.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No users found in database. Please create users first.',
            });
        }

        if (!data || data.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No email data found. Please add recipient emails first.',
            });
        }

        if (!info) {
            return res.status(400).json({
                success: false,
                error: 'No active email info found. Please create and activate email info.',
            });
        }

        if (!template) {
            return res.status(400).json({
                success: false,
                error: 'No active email template found. Please create and activate a template.',
            });
        }

        // Return immediate response and start email sending in background
        res.json({
            success: true,
            message: 'Email sending started via Gmail API',
            details: {
                totalUsers: users.length,
                totalRecipients: data.length,
                fromName: info.from_name,
                subject: info.subject,
                templateName: template.name,
            },
            note: 'Email sending is running in the background. Check email_logs table for status.',
        });

        // Start email sending process in background
        const sendApiPath = path.join(__dirname, '..', 'sendApi.js');
        const child = fork(sendApiPath, [], {
            detached: true,
            stdio: 'ignore',
        });
        child.unref();
    } catch (error) {
        next(error);
    }
});

// POST send emails via SMTP
router.post('/smtp', emailSendLimiter, async (req, res, next) => {
    try {
        // Validate prerequisites
        const users = await getUsers();
        const data = await getEmailData();
        const info = await getActiveEmailInfo();
        const template = await getActiveEmailTemplate();

        if (!users || users.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No users found in database. Please create users first.',
            });
        }

        if (!data || data.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No email data found. Please add recipient emails first.',
            });
        }

        if (!info) {
            return res.status(400).json({
                success: false,
                error: 'No active email info found. Please create and activate email info.',
            });
        }

        if (!template) {
            return res.status(400).json({
                success: false,
                error: 'No active email template found. Please create and activate a template.',
            });
        }

        // Return immediate response and start email sending in background
        res.json({
            success: true,
            message: 'Email sending started via SMTP',
            details: {
                totalUsers: users.length,
                totalRecipients: data.length,
                fromName: info.from_name,
                subject: info.subject,
                templateName: template.name,
            },
            note: 'Email sending is running in the background. Check email_logs table for status.',
        });

        // Start email sending process in background
        const smtpPath = path.join(__dirname, '..', 'smtp.js');
        const child = fork(smtpPath, [], {
            detached: true,
            stdio: 'ignore',
        });
        child.unref();
    } catch (error) {
        next(error);
    }
});

// POST generate users
router.post('/generate-users', async (req, res, next) => {
    try {
        const { domain, numRecords } = req.body;

        if (!domain) {
            return res.status(400).json({
                success: false,
                error: 'domain is required',
            });
        }

        // Validate domain format to prevent command injection
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!domainRegex.test(domain)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid domain format',
            });
        }

        if (!numRecords || isNaN(numRecords) || numRecords <= 0) {
            return res.status(400).json({
                success: false,
                error: 'numRecords must be a positive integer',
            });
        }

        // Limit numRecords to prevent resource exhaustion
        if (numRecords > 10000) {
            return res.status(400).json({
                success: false,
                error: 'numRecords cannot exceed 10000',
            });
        }

        // Return immediate response and start user generation in background
        res.json({
            success: true,
            message: 'User generation started',
            details: {
                domain,
                numRecords,
            },
            note: 'User generation is running in the background. Check users table for results.',
        });

        // Start user generation process in background
        const generatePath = path.join(__dirname, '..', 'generate.js');
        const child = fork(generatePath, [domain, numRecords.toString()], {
            detached: true,
            stdio: 'ignore',
        });
        child.unref();
    } catch (error) {
        next(error);
    }
});

// POST bulk add email recipients
router.post('/bulk-recipients', async (req, res, next) => {
    try {
        const { emails } = req.body;

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'emails array is required and must not be empty',
            });
        }

        // Limit bulk insert size to prevent resource exhaustion
        if (emails.length > 10000) {
            return res.status(400).json({
                success: false,
                error: 'Cannot add more than 10000 emails at once',
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = emails.filter((email) => !emailRegex.test(email));
        
        if (invalidEmails.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format detected',
                invalidEmails: invalidEmails.slice(0, 10), // Show first 10 invalid emails
            });
        }

        // Insert emails in bulk
        const { query } = require('../db');
        const duplicates = [];
        const results = [];

        for (const email of emails) {
            try {
                const result = await query(
                    'INSERT INTO email_data (to_email) VALUES ($1) RETURNING id, to_email',
                    [email]
                );
                results.push(result.rows[0]);
            } catch (error) {
                // Handle duplicate emails (unique constraint violation)
                if (error.code === '23505') {
                    duplicates.push(email);
                } else {
                    throw error;
                }
            }
        }

        res.status(201).json({
            success: true,
            message: 'Bulk email recipients added',
            inserted: results.length,
            duplicatesSkipped: duplicates.length,
            data: results,
        });
    } catch (error) {
        next(error);
    }
});

// GET email sending status
router.get('/status', async (req, res, next) => {
    try {
        const { query } = require('../db');
        
        // Get overall statistics
        const statsResult = await query(`
            SELECT 
                COUNT(*) as total_emails,
                SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_count,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
                MAX(sent_at) as last_sent_at
            FROM email_logs
        `);

        const stats = statsResult.rows[0];

        // Get recent logs
        const recentLogsResult = await query(`
            SELECT 
                id, user_email, to_email, status, provider, sent_at, error_message
            FROM email_logs
            ORDER BY sent_at DESC
            LIMIT 20
        `);

        res.json({
            success: true,
            statistics: {
                totalEmails: parseInt(stats.total_emails) || 0,
                sentCount: parseInt(stats.sent_count) || 0,
                failedCount: parseInt(stats.failed_count) || 0,
                lastSentAt: stats.last_sent_at,
            },
            recentLogs: recentLogsResult.rows,
        });
    } catch (error) {
        next(error);
    }
});

// POST send test email with inbox verification
router.post('/test-email', testEmailLimiter, async (req, res, next) => {
    try {
        const { provider, test_email, from_name, subject, html_content } = req.body;

        // Validate inputs
        if (!provider || !['gmail_api', 'smtp'].includes(provider)) {
            return res.status(400).json({
                success: false,
                error: 'provider must be either gmail_api or smtp',
            });
        }

        if (!test_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(test_email)) {
            return res.status(400).json({
                success: false,
                error: 'A valid test_email is required',
            });
        }

        // Get users for sending
        const users = await getUsers();
        if (!users || users.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No users found in database. Please create users first.',
            });
        }

        const sender = users[0];

        // Use provided values or get from active email info/template
        let finalFromName = from_name;
        let finalSubject = subject;
        let finalHtmlContent = html_content;

        if (!finalFromName || !finalSubject || !finalHtmlContent) {
            const info = await getActiveEmailInfo();
            const template = await getActiveEmailTemplate();

            if (!info || !template) {
                return res.status(400).json({
                    success: false,
                    error: 'Either provide from_name, subject, and html_content, or ensure active email_info and email_templates exist.',
                });
            }

            finalFromName = finalFromName || info.from_name;
            finalSubject = finalSubject || info.subject;
            finalHtmlContent = finalHtmlContent || template.html_content;
        }

        // Send test email based on provider
        let sendResult = { success: false };
        const testId = Date.now();

        try {
            if (provider === 'gmail_api') {
                const { google } = require('googleapis');
                const axios = require('axios');
                const { loadGoogleCreds } = require('../googleCreds');
                const creds = await loadGoogleCreds();

                const jwtClient = new google.auth.JWT(
                    creds.client_email,
                    null,
                    creds.private_key,
                    ['https://mail.google.com/'],
                    sender.email
                );

                const tokens = await jwtClient.authorize();

                // Create MIME message with test marker
                const testMarker = `X-Test-Email-ID: ${testId}`;
                const htmlWithMarker = `${finalHtmlContent}\n<!-- Test Email ID: ${testId} -->`;
                
                const raw = Buffer.from(
                    `Content-Type: text/html; charset="UTF-8"\n` +
                    `From: "${finalFromName}" <${sender.email}>\n` +
                    `To: ${test_email}\n` +
                    `Subject: ${finalSubject}\n` +
                    `${testMarker}\n\n` +
                    htmlWithMarker,
                    'utf-8'
                ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

                await axios.post(
                    'https://www.googleapis.com/gmail/v1/users/me/messages/send',
                    { raw },
                    { headers: { Authorization: `Bearer ${tokens.access_token}`, 'Content-Type': 'application/json' } }
                );

                sendResult = { success: true, provider: 'gmail_api' };
            } else {
                // SMTP
                const nodemailer = require('nodemailer');
                const transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false,
                    auth: {
                        user: sender.email,
                        pass: sender.password,
                    },
                });

                const htmlWithMarker = `${finalHtmlContent}\n<!-- Test Email ID: ${testId} -->`;

                await transporter.sendMail({
                    from: `"${finalFromName}" <${sender.email}>`,
                    to: test_email,
                    subject: finalSubject,
                    html: htmlWithMarker,
                    headers: {
                        'X-Test-Email-ID': testId.toString(),
                    },
                });

                sendResult = { success: true, provider: 'smtp' };
            }

            // Log the test email
            const { query } = require('../db');
            await query(
                `INSERT INTO email_logs (user_email, to_email, message_index, status, provider, error_message, sent_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [sender.email, test_email, 0, 'sent', provider, null, new Date()]
            );

            res.json({
                success: true,
                message: `Test email sent successfully to ${test_email} via ${provider}`,
                details: {
                    testId: testId,
                    provider: provider,
                    from: `${finalFromName} <${sender.email}>`,
                    to: test_email,
                    subject: finalSubject,
                    sentAt: new Date().toISOString(),
                },
                inboxVerification: {
                    note: 'Please check your inbox/spam folder for the test email.',
                    tips: [
                        'Check spam/junk folder if not in inbox',
                        'Mark as "Not Spam" to improve future deliverability',
                        'Add sender to contacts for better inbox placement',
                        'Check email headers for authentication results (SPF, DKIM, DMARC)',
                    ],
                    testId: testId,
                },
            });
        } catch (error) {
            // Log failed test email
            const { query } = require('../db');
            await query(
                `INSERT INTO email_logs (user_email, to_email, message_index, status, provider, error_message, sent_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [sender.email, test_email, 0, 'failed', provider, error.message, new Date()]
            );

            throw error;
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to send test email',
            details: 'Please check your credentials and network connection.',
        });
    }
});

module.exports = router;
