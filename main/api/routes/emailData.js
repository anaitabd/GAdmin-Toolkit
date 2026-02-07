const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET all email data (with optional pagination & search)
router.get('/', async (req, res, next) => {
    try {
        const { search, limit, offset = 0 } = req.query;

        let countText = 'SELECT COUNT(*) FROM email_data';
        let dataText = 'SELECT id, to_email, created_at FROM email_data';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            const where = ` WHERE to_email ILIKE $${params.length}`;
            countText += where;
            dataText += where;
        }

        const countResult = await query(countText, params.slice());
        const totalCount = parseInt(countResult.rows[0].count, 10);

        dataText += ' ORDER BY id DESC';

        if (limit) {
            params.push(parseInt(limit), parseInt(offset));
            dataText += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
        }

        const result = await query(dataText, params);
        res.json({
            success: true,
            data: result.rows,
            count: totalCount,
            ...(limit && { limit: parseInt(limit), offset: parseInt(offset) }),
        });
    } catch (error) {
        next(error);
    }
});

// GET email data by ID
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query(
            'SELECT id, to_email, created_at FROM email_data WHERE id = $1',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Email data not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// POST create new email data
router.post('/', async (req, res, next) => {
    try {
        const { to_email } = req.body;
        
        if (!to_email) {
            return res.status(400).json({ success: false, error: 'to_email is required' });
        }

        const result = await query(
            'INSERT INTO email_data (to_email) VALUES ($1) RETURNING *',
            [to_email]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// PUT update email data
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { to_email } = req.body;

        if (!to_email) {
            return res.status(400).json({ success: false, error: 'to_email is required' });
        }

        // Check if record exists
        const checkResult = await query('SELECT id FROM email_data WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Email data not found' });
        }

        const result = await query(
            'UPDATE email_data SET to_email = $1 WHERE id = $2 RETURNING *',
            [to_email, id]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// DELETE email data
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM email_data WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Email data not found' });
        }
        res.json({ success: true, message: 'Email data deleted', data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
