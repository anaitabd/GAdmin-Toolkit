/**
 * Data Providers API — CRUD for data providers
 * Mounted at /api/data-providers in server.js
 */
const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { logAudit, getActionBy } = require('../middleware/auditLog');

// ── GET /api/data-providers ────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const { status, search, limit = 50, offset = 0 } = req.query;
        let sql = 'SELECT * FROM data_providers';
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

// ── GET /api/data-providers/:id ────────────────────────────────────
router.get('/:id', async (req, res, next) => {
    try {
        const result = await query('SELECT * FROM data_providers WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Data provider not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/data-providers ───────────────────────────────────────
router.post('/', async (req, res, next) => {
    try {
        const { name, status = 'active', created_by } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'name is required'
            });
        }

        const result = await query(
            `INSERT INTO data_providers (name, status, created_by)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [name, status, created_by || getActionBy(req)]
        );

        await logAudit(
            getActionBy(req),
            result.rows[0].id,
            name,
            'data_provider',
            'insert',
            { name, status }
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── PUT /api/data-providers/:id ────────────────────────────────────
router.put('/:id', async (req, res, next) => {
    try {
        const { name, status } = req.body;

        const result = await query(
            `UPDATE data_providers SET
                name = COALESCE($1, name),
                status = COALESCE($2, status),
                updated_at = NOW()
             WHERE id = $3
             RETURNING *`,
            [name, status, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Data provider not found' });
        }

        await logAudit(
            getActionBy(req),
            result.rows[0].id,
            result.rows[0].name,
            'data_provider',
            'update',
            { name, status }
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── DELETE /api/data-providers/:id ─────────────────────────────────
router.delete('/:id', async (req, res, next) => {
    try {
        const providerResult = await query('SELECT name FROM data_providers WHERE id = $1', [req.params.id]);
        if (providerResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Data provider not found' });
        }

        const result = await query('DELETE FROM data_providers WHERE id = $1 RETURNING id', [req.params.id]);

        await logAudit(
            getActionBy(req),
            req.params.id,
            providerResult.rows[0].name,
            'data_provider',
            'delete'
        );

        res.json({ success: true, message: 'Data provider deleted' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
