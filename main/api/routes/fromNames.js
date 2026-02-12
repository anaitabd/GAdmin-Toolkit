/**
 * From Names API — CRUD for from_names
 * Mounted at /api/from-names in server.js
 */
const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { logAudit, getActionBy } = require('../middleware/auditLog');

// ── GET /api/from-names ────────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const { offer_id, status, search, limit = 50, offset = 0 } = req.query;
        let sql = 'SELECT * FROM from_names';
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
            conditions.push(`value ILIKE $${params.length}`);
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

// ── GET /api/from-names/:id ────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
    try {
        const result = await query('SELECT * FROM from_names WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'From name not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/from-names ───────────────────────────────────────────
router.post('/', async (req, res, next) => {
    try {
        const { value, offer_id, status = 'active' } = req.body;

        if (!value || !offer_id) {
            return res.status(400).json({
                success: false,
                error: 'value and offer_id are required'
            });
        }

        const result = await query(
            `INSERT INTO from_names (value, offer_id, status)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [value, parseInt(offer_id), status]
        );

        await logAudit(
            getActionBy(req),
            result.rows[0].id,
            value,
            'from_name',
            'insert',
            { value, offer_id, status }
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── PUT /api/from-names/:id ────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
    try {
        const { value, offer_id, status } = req.body;

        const result = await query(
            `UPDATE from_names SET
                value = COALESCE($1, value),
                offer_id = COALESCE($2, offer_id),
                status = COALESCE($3, status),
                updated_at = NOW()
             WHERE id = $4
             RETURNING *`,
            [value, offer_id ? parseInt(offer_id) : null, status, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'From name not found' });
        }

        await logAudit(
            getActionBy(req),
            result.rows[0].id,
            result.rows[0].value,
            'from_name',
            'update',
            { value, offer_id, status }
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── DELETE /api/from-names/:id ─────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
    try {
        const nameResult = await query('SELECT value FROM from_names WHERE id = $1', [req.params.id]);
        if (nameResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'From name not found' });
        }

        const result = await query('DELETE FROM from_names WHERE id = $1 RETURNING id', [req.params.id]);

        await logAudit(
            getActionBy(req),
            req.params.id,
            nameResult.rows[0].value,
            'from_name',
            'delete'
        );

        res.json({ success: true, message: 'From name deleted' });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/from-names/by-offer/:offerId ──────────────────────────
router.get('/by-offer/:offerId', async (req, res, next) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const result = await query(
            `SELECT * FROM from_names
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

// ── GET /api/from-names/random/:offerId ────────────────────────────
router.get('/random/:offerId', async (req, res, next) => {
    try {
        const result = await query(
            `SELECT value FROM from_names
             WHERE offer_id = $1 AND status = 'active'
             ORDER BY RANDOM()
             LIMIT 1`,
            [req.params.offerId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'No active from names found for this offer' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
