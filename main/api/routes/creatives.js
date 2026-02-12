/**
 * Creatives API — CRUD for creatives
 * Mounted at /api/creatives in server.js
 */
const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { logAudit, getActionBy } = require('../middleware/auditLog');

// ── GET /api/creatives ─────────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const { offer_id, status, search, limit = 50, offset = 0 } = req.query;
        let sql = 'SELECT * FROM creatives';
        const params = [];
        const conditions = [];

        if (offer_id) {
            params.push(parseInt(offer_id));
            conditions.push(`offer_id = $${params.length}`);
        }
        if (status) {
            params.push(status);
            conditions.push(`status = $${params.length}`);
        }
        if (search) {
            params.push(`%${search}%`);
            conditions.push(`name ILIKE $${params.length}`);
        }
        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        sql += ' ORDER BY created_at DESC';
        params.push(parseInt(limit));
        sql += ` LIMIT $${params.length}`;
        params.push(parseInt(offset));
        sql += ` OFFSET $${params.length}`;

        const result = await query(sql, params);
        res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/creatives/:id ─────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
    try {
        const result = await query('SELECT * FROM creatives WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Creative not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/creatives ────────────────────────────────────────────
router.post('/', async (req, res, next) => {
    try {
        const { name, offer_id, html_content, status = 'active' } = req.body;

        if (!name || !offer_id) {
            return res.status(400).json({
                success: false,
                error: 'name and offer_id are required'
            });
        }

        const result = await query(
            `INSERT INTO creatives (name, offer_id, html_content, status)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [name, parseInt(offer_id), html_content || null, status]
        );

        await logAudit(
            getActionBy(req),
            result.rows[0].id,
            name,
            'creative',
            'insert',
            { name, offer_id, status }
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── PUT /api/creatives/:id ─────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
    try {
        const { name, offer_id, html_content, status } = req.body;

        const result = await query(
            `UPDATE creatives SET
                name = COALESCE($1, name),
                offer_id = COALESCE($2, offer_id),
                html_content = COALESCE($3, html_content),
                status = COALESCE($4, status),
                updated_at = NOW()
             WHERE id = $5
             RETURNING *`,
            [name, offer_id ? parseInt(offer_id) : null, html_content, status, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Creative not found' });
        }

        await logAudit(
            getActionBy(req),
            result.rows[0].id,
            result.rows[0].name,
            'creative',
            'update',
            { name, offer_id, status }
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── DELETE /api/creatives/:id ──────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
    try {
        const creativeResult = await query('SELECT name FROM creatives WHERE id = $1', [req.params.id]);
        if (creativeResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Creative not found' });
        }

        const result = await query('DELETE FROM creatives WHERE id = $1 RETURNING id', [req.params.id]);

        await logAudit(
            getActionBy(req),
            req.params.id,
            creativeResult.rows[0].name,
            'creative',
            'delete'
        );

        res.json({ success: true, message: 'Creative deleted' });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/creatives/by-offer/:offerId ───────────────────────────
router.get('/by-offer/:offerId', async (req, res, next) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const result = await query(
            `SELECT * FROM creatives
             WHERE offer_id = $1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
            [req.params.offerId, parseInt(limit), parseInt(offset)]
        );

        res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
