const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET all bounce logs with optional filtering
router.get('/', async (req, res, next) => {
    try {
        const { email, limit = 100, offset = 0 } = req.query;
        
        let queryText = 'SELECT id, email, reason, detected_at FROM bounce_logs';
        const queryParams = [];

        if (email) {
            queryParams.push(email);
            queryText += ` WHERE email = $${queryParams.length}`;
        }

        // Count total matching rows (before LIMIT/OFFSET)
        let countText = 'SELECT COUNT(*) FROM bounce_logs';
        if (queryParams.length > 0 && queryText.includes('WHERE')) {
            countText += ` WHERE email = $1`;
        }
        const countParams = queryParams.slice();
        const countResult = await query(countText, countParams);
        const totalCount = parseInt(countResult.rows[0].count, 10);

        queryText += ' ORDER BY detected_at DESC';
        
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

// GET bounce log by ID
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query(
            'SELECT id, email, reason, detected_at FROM bounce_logs WHERE id = $1',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Bounce log not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// GET bounce log statistics
router.get('/stats/summary', async (req, res, next) => {
    try {
        const result = await query(`
            SELECT 
                COUNT(*) as total_bounces,
                COUNT(DISTINCT email) as unique_bounced_emails
            FROM bounce_logs
        `);
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
