const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { validateEmailSend } = require('../middleware/validator');
const emailService = require('../services/emailService');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

/**
 * @route   POST /api/email/send
 * @desc    Send single email
 * @access  Private
 */
router.post('/send', authenticateToken, validateEmailSend, async (req, res) => {
    try {
        const { method, user, password, recipient, from, subject, htmlContent } = req.body;

        let result;
        if (method === 'api') {
            result = await emailService.sendEmailViaAPI(user, recipient, from, subject, htmlContent);
        } else if (method === 'smtp') {
            if (!password) {
                return res.status(400).json({ 
                    error: { message: 'Password required for SMTP method' } 
                });
            }
            result = await emailService.sendEmailViaSMTP(user, password, recipient, from, subject, htmlContent);
        } else {
            return res.status(400).json({ 
                error: { message: 'Invalid method. Use "api" or "smtp"' } 
            });
        }

        res.json({
            success: true,
            data: {
                message: 'Email sent successfully',
                method,
                recipient
            }
        });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({
            error: {
                message: error.message || 'Failed to send email'
            }
        });
    }
});

/**
 * @route   POST /api/email/send-bulk
 * @desc    Send bulk emails
 * @access  Private
 */
router.post('/send-bulk', authenticateToken, async (req, res) => {
    try {
        const { method, users, recipients, from, subject, htmlContent } = req.body;

        // Validate input
        if (!Array.isArray(users) || users.length === 0) {
            return res.status(400).json({ 
                error: { message: 'Users array is required and cannot be empty' } 
            });
        }

        if (!Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({ 
                error: { message: 'Recipients array is required and cannot be empty' } 
            });
        }

        if (!from || !subject || !htmlContent) {
            return res.status(400).json({ 
                error: { message: 'From, subject, and htmlContent are required' } 
            });
        }

        let results;
        if (method === 'api') {
            results = await emailService.sendBulkEmailsAPI(users, recipients, from, subject, htmlContent);
        } else if (method === 'smtp') {
            results = await emailService.sendBulkEmailsSMTP(users, recipients, from, subject, htmlContent);
        } else {
            return res.status(400).json({ 
                error: { message: 'Invalid method. Use "api" or "smtp"' } 
            });
        }

        res.json({
            success: true,
            data: {
                message: 'Bulk email sending completed',
                method,
                totalSent: results.success.length,
                totalFailed: results.failed.length,
                results
            }
        });
    } catch (error) {
        console.error('Error sending bulk emails:', error);
        res.status(500).json({
            error: {
                message: error.message || 'Failed to send bulk emails'
            }
        });
    }
});

/**
 * @route   POST /api/email/send-python
 * @desc    Send emails using Python script
 * @access  Private
 */
router.post('/send-python', authenticateToken, async (req, res) => {
    try {
        const result = await emailService.sendEmailsViaPython();
        
        res.json({
            success: true,
            data: {
                message: 'Python email script executed successfully',
                output: result.output
            }
        });
    } catch (error) {
        console.error('Error executing Python script:', error);
        res.status(500).json({
            error: {
                message: error.message || 'Failed to execute Python email script'
            }
        });
    }
});

/**
 * @route   POST /api/email/upload-recipients
 * @desc    Upload CSV file with recipients
 * @access  Private
 */
router.post('/upload-recipients', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                error: { message: 'No file uploaded' } 
            });
        }

        const recipients = [];
        const filePath = req.file.path;

        // Parse CSV file
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    if (row.to || row.email) {
                        recipients.push(row.to || row.email);
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        res.json({
            success: true,
            data: {
                message: 'Recipients uploaded successfully',
                count: recipients.length,
                recipients
            }
        });
    } catch (error) {
        console.error('Error uploading recipients:', error);
        
        // Clean up file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            error: {
                message: error.message || 'Failed to upload recipients'
            }
        });
    }
});

/**
 * @route   POST /api/email/upload-users
 * @desc    Upload CSV file with email users
 * @access  Private
 */
router.post('/upload-users', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                error: { message: 'No file uploaded' } 
            });
        }

        const users = [];
        const filePath = req.file.path;

        // Parse CSV file
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    if (row.email) {
                        users.push({
                            email: row.email,
                            password: row.password || ''
                        });
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        res.json({
            success: true,
            data: {
                message: 'Users uploaded successfully',
                count: users.length,
                users
            }
        });
    } catch (error) {
        console.error('Error uploading users:', error);
        
        // Clean up file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            error: {
                message: error.message || 'Failed to upload users'
            }
        });
    }
});

module.exports = router;
