const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET all email info
router.get('/', async (req, res, next) => {
    try {
        const result = await query(
            'SELECT id, from_name, subject, active, created_at FROM email_info ORDER BY created_at DESC'
        );
        res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error) {
        next(error);
    }
});

// GET active email info
router.get('/active', async (req, res, next) => {
    try {
        const result = await query(
            'SELECT id, from_name, subject, active, created_at FROM email_info WHERE active = true ORDER BY created_at DESC LIMIT 1'
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'No active email info found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// GET email info by ID
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query(
            'SELECT id, from_name, subject, active, created_at FROM email_info WHERE id = $1',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Email info not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// POST create new email info
router.post('/', async (req, res, next) => {
    try {
        const { from_name, subject, active = true } = req.body;
        
        if (!from_name || !subject) {
            return res.status(400).json({ 
                success: false, 
                error: 'from_name and subject are required' 
            });
        }

        const result = await query(
            'INSERT INTO email_info (from_name, subject, active) VALUES ($1, $2, $3) RETURNING *',
            [from_name, subject, active]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// PUT update email info
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { from_name, subject, active } = req.body;

        // Check if record exists
        const checkResult = await query('SELECT id FROM email_info WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Email info not found' });
        }

        const result = await query(
            'UPDATE email_info SET from_name = COALESCE($1, from_name), subject = COALESCE($2, subject), active = COALESCE($3, active) WHERE id = $4 RETURNING *',
            [from_name || null, subject || null, active !== undefined ? active : null, id]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// DELETE email info
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM email_info WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Email info not found' });
        }
        res.json({ success: true, message: 'Email info deleted', data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
