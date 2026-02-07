const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET all email templates
router.get('/', async (req, res, next) => {
    try {
        const result = await query(
            'SELECT id, name, html_content, active, created_at FROM email_templates ORDER BY created_at DESC'
        );
        res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error) {
        next(error);
    }
});

// GET active email template
router.get('/active', async (req, res, next) => {
    try {
        const result = await query(
            'SELECT id, name, html_content, active, created_at FROM email_templates WHERE active = true ORDER BY created_at DESC LIMIT 1'
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'No active email template found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// GET email template by ID
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query(
            'SELECT id, name, html_content, active, created_at FROM email_templates WHERE id = $1',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Email template not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// POST create new email template
router.post('/', async (req, res, next) => {
    try {
        const { name, html_content, active = true } = req.body;
        
        if (!name || !html_content) {
            return res.status(400).json({ 
                success: false, 
                error: 'name and html_content are required' 
            });
        }

        const result = await query(
            'INSERT INTO email_templates (name, html_content, active) VALUES ($1, $2, $3) RETURNING *',
            [name, html_content, active]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// PUT update email template
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, html_content, active } = req.body;

        // Check if record exists
        const checkResult = await query('SELECT id FROM email_templates WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Email template not found' });
        }

        const result = await query(
            'UPDATE email_templates SET name = COALESCE($1, name), html_content = COALESCE($2, html_content), active = COALESCE($3, active) WHERE id = $4 RETURNING *',
            [name || null, html_content || null, active !== undefined ? active : null, id]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// DELETE email template
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM email_templates WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Email template not found' });
        }
        res.json({ success: true, message: 'Email template deleted', data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
