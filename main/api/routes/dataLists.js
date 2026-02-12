/**
 * Data Lists API — CRUD for data_lists
 * Mounted at /api/data-lists in server.js
 */
const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { logAudit, getActionBy } = require('../middleware/auditLog');

// ── GET /api/data-lists ────────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const { data_provider_id, status, search, limit = 50, offset = 0 } = req.query;
        let sql = 'SELECT * FROM data_lists';
        const params = [];
        const conditions = [];

        if (data_provider_id) {
            params.push(parseInt(data_provider_id));
            conditions.push(`data_provider_id = $${params.length}`);
        }
        if (status) {
            params.push(status);
            conditions.push(`status = $${params.length}`);
        }
        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`);
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

// ── GET /api/data-lists/stats ──────────────────────────────────────
router.get('/stats', async (req, res, next) => {
    try {
        const result = await query(
            `SELECT data_provider_id, COUNT(*) as count
             FROM data_lists
             GROUP BY data_provider_id
             ORDER BY count DESC`
        );
        res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/data-lists/:id ────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
    try {
        const result = await query('SELECT * FROM data_lists WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Data list not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/data-lists ───────────────────────────────────────────
router.post('/', async (req, res, next) => {
    try {
        const { name, description, data_provider_id, status = 'active', total_count = 0 } = req.body;

        if (!name || !data_provider_id) {
            return res.status(400).json({
                success: false,
                error: 'name and data_provider_id are required'
            });
        }

        const result = await query(
            `INSERT INTO data_lists (name, description, data_provider_id, status, total_count)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [name, description || null, parseInt(data_provider_id), status, parseInt(total_count)]
        );

        await logAudit(
            getActionBy(req),
            result.rows[0].id,
            name,
            'data_list',
            'insert',
            { name, data_provider_id, status }
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── PUT /api/data-lists/:id ────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
    try {
        const { name, description, data_provider_id, status, total_count } = req.body;

        const result = await query(
            `UPDATE data_lists SET
                name = COALESCE($1, name),
                description = COALESCE($2, description),
                data_provider_id = COALESCE($3, data_provider_id),
                status = COALESCE($4, status),
                total_count = COALESCE($5, total_count),
                updated_at = NOW()
             WHERE id = $6
             RETURNING *`,
            [name, description, data_provider_id ? parseInt(data_provider_id) : null, status, total_count ? parseInt(total_count) : null, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Data list not found' });
        }

        await logAudit(
            getActionBy(req),
            result.rows[0].id,
            result.rows[0].name,
            'data_list',
            'update',
            { name, data_provider_id, status }
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── DELETE /api/data-lists/:id ─────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
    try {
        const listResult = await query('SELECT name FROM data_lists WHERE id = $1', [req.params.id]);
        if (listResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Data list not found' });
        }

        const result = await query('DELETE FROM data_lists WHERE id = $1 RETURNING id', [req.params.id]);

        await logAudit(
            getActionBy(req),
            req.params.id,
            listResult.rows[0].name,
            'data_list',
            'delete'
        );

        res.json({ success: true, message: 'Data list deleted' });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/data-lists/:id/recount ───────────────────────────────
router.post('/:id/recount', async (req, res, next) => {
    try {
        const result = await query(
            `UPDATE data_lists
             SET total_count = (SELECT COUNT(*) FROM email_data WHERE data_list_id = $1)
             WHERE id = $1
             RETURNING *`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Data list not found' });
        }

        await logAudit(
            getActionBy(req),
            result.rows[0].id,
            result.rows[0].name,
            'data_list',
            'update',
            { action: 'recount', total_count: result.rows[0].total_count }
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
