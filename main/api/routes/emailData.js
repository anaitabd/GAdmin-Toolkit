const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET all email data
router.get('/', async (req, res, next) => {
    try {
        const result = await query(
            'SELECT id, to_email, created_at FROM email_data ORDER BY id'
        );
        res.json({ success: true, data: result.rows, count: result.rows.length });
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
