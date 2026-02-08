const express = require('express');
const router = express.Router();
const { query } = require('../db');

// ── GET /api/campaign-templates ────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const result = await query(
            'SELECT * FROM campaign_templates ORDER BY created_at DESC'
        );
        res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/campaign-templates/active ─────────────────────────────
router.get('/active', async (req, res, next) => {
    try {
        const result = await query(
            'SELECT * FROM campaign_templates WHERE active = TRUE ORDER BY created_at DESC'
        );
        res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/campaign-templates/:id ────────────────────────────────
router.get('/:id', async (req, res, next) => {
    try {
        const result = await query(
            'SELECT * FROM campaign_templates WHERE id = $1',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Campaign template not found' });
        }
        
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/campaign-templates ───────────────────────────────────
router.post('/', async (req, res, next) => {
    try {
        const {
            name,
            description,
            from_name,
            subject,
            html_content,
            provider,
            batch_size,
            active
        } = req.body;
        
        if (!name || !from_name || !subject || !html_content || !provider) {
            return res.status(400).json({
                success: false,
                error: 'name, from_name, subject, html_content, and provider are required'
            });
        }
        
        if (!['gmail_api', 'smtp'].includes(provider)) {
            return res.status(400).json({
                success: false,
                error: 'provider must be gmail_api or smtp'
            });
        }
        
        const result = await query(
            `INSERT INTO campaign_templates (
                name, description, from_name, subject, html_content, 
                provider, batch_size, active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                name,
                description || null,
                from_name,
                subject,
                html_content,
                provider,
                batch_size || 300,
                active !== undefined ? active : true
            ]
        );
        
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── PUT /api/campaign-templates/:id ────────────────────────────────
router.put('/:id', async (req, res, next) => {
    try {
        const {
            name,
            description,
            from_name,
            subject,
            html_content,
            provider,
            batch_size,
            active
        } = req.body;
        
        const result = await query(
            `UPDATE campaign_templates SET
                name = COALESCE($1, name),
                description = COALESCE($2, description),
                from_name = COALESCE($3, from_name),
                subject = COALESCE($4, subject),
                html_content = COALESCE($5, html_content),
                provider = COALESCE($6, provider),
                batch_size = COALESCE($7, batch_size),
                active = COALESCE($8, active),
                updated_at = NOW()
            WHERE id = $9
            RETURNING *`,
            [
                name,
                description,
                from_name,
                subject,
                html_content,
                provider,
                batch_size,
                active,
                req.params.id
            ]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Campaign template not found' });
        }
        
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── DELETE /api/campaign-templates/:id ─────────────────────────────
router.delete('/:id', async (req, res, next) => {
    try {
        const result = await query(
            'DELETE FROM campaign_templates WHERE id = $1 RETURNING id',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Campaign template not found' });
        }
        
        res.json({ success: true, message: 'Campaign template deleted' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
