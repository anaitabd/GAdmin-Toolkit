const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET all email logs with optional filtering
router.get('/', async (req, res, next) => {
    try {
        const { user_email, status, provider, limit = 100, offset = 0 } = req.query;
        
        let queryText = 'SELECT id, user_email, to_email, message_index, status, provider, error_message, sent_at FROM email_logs';
        const queryParams = [];
        const whereClauses = [];

        if (user_email) {
            queryParams.push(user_email);
            whereClauses.push(`user_email = $${queryParams.length}`);
        }

        if (status) {
            queryParams.push(status);
            whereClauses.push(`status = $${queryParams.length}`);
        }

        if (provider) {
            queryParams.push(provider);
            whereClauses.push(`provider = $${queryParams.length}`);
        }

        if (whereClauses.length > 0) {
            queryText += ' WHERE ' + whereClauses.join(' AND ');
        }

        // Count total matching rows (before LIMIT/OFFSET)
        let countText = 'SELECT COUNT(*) FROM email_logs';
        if (whereClauses.length > 0) {
            countText += ' WHERE ' + whereClauses.join(' AND ');
        }
        const countResult = await query(countText, queryParams.slice());
        const totalCount = parseInt(countResult.rows[0].count, 10);

        queryText += ' ORDER BY sent_at DESC';
        
        queryParams.push(limit, offset);
        queryText += ` LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;

        const result = await query(queryText, queryParams);
        res.json({ 
            success: true, 
            data: result.rows, 
            count: totalCount,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        next(error);
    }
});

// GET email log by ID
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query(
            'SELECT id, user_email, to_email, message_index, status, provider, error_message, sent_at FROM email_logs WHERE id = $1',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Email log not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// GET email log statistics
router.get('/stats/summary', async (req, res, next) => {
    try {
        const result = await query(`
            SELECT 
                COUNT(*) as total_emails,
                COUNT(CASE WHEN status = 'sent' THEN 1 END) as successful_emails,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_emails,
                COUNT(CASE WHEN provider = 'gmail_api' THEN 1 END) as gmail_api_emails,
                COUNT(CASE WHEN provider = 'smtp' THEN 1 END) as smtp_emails
            FROM email_logs
        `);
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
