/**
 * Verticals API — CRUD for verticals (offer categories)
 * Mounted at /api/verticals in server.js
 */
const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { logAudit, getActionBy } = require('../middleware/auditLog');

// ── GET /api/verticals ─────────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const { status, search, limit = 100, offset = 0 } = req.query;
        let sql = 'SELECT * FROM verticals';
        const params = [];
        const conditions = [];

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
        sql += ' ORDER BY name ASC';
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

// ── GET /api/verticals/:id ─────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
    try {
        const result = await query('SELECT * FROM verticals WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Vertical not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/verticals ────────────────────────────────────────────
router.post('/', async (req, res, next) => {
    try {
        const { name, status = 'active' } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'name is required'
            });
        }

        const result = await query(
            `INSERT INTO verticals (name, status)
             VALUES ($1, $2)
             RETURNING *`,
            [name, status]
        );

        await logAudit(
            getActionBy(req),
            result.rows[0].id,
            name,
            'vertical',
            'insert',
            { name, status }
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') { // unique violation
            return res.status(400).json({ success: false, error: 'Vertical name already exists' });
        }
        next(error);
    }
});

// ── PUT /api/verticals/:id ─────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
    try {
        const { name, status } = req.body;

        const result = await query(
            `UPDATE verticals SET
                name = COALESCE($1, name),
                status = COALESCE($2, status),
                updated_at = NOW()
             WHERE id = $3
             RETURNING *`,
            [name, status, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Vertical not found' });
        }

        await logAudit(
            getActionBy(req),
            result.rows[0].id,
            result.rows[0].name,
            'vertical',
            'update',
            { name, status }
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') { // unique violation
            return res.status(400).json({ success: false, error: 'Vertical name already exists' });
        }
        next(error);
    }
});

// ── DELETE /api/verticals/:id ──────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
    try {
        const verticalResult = await query('SELECT name FROM verticals WHERE id = $1', [req.params.id]);
        if (verticalResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Vertical not found' });
        }

        const result = await query('DELETE FROM verticals WHERE id = $1 RETURNING id', [req.params.id]);

        await logAudit(
            getActionBy(req),
            req.params.id,
            verticalResult.rows[0].name,
            'vertical',
            'delete'
        );

        res.json({ success: true, message: 'Vertical deleted' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
