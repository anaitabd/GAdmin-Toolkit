/**
 * Suppression Processes API — Read suppression_processes
 * Mounted at /api/suppression-processes in server.js
 */
const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { logAudit, getActionBy } = require('../middleware/auditLog');

// ── GET /api/suppression-processes ─────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const { network_id, offer_id, status, limit = 50, offset = 0 } = req.query;
        let sql = 'SELECT * FROM suppression_processes';
        const params = [];
        const conditions = [];

        if (network_id) {
            params.push(parseInt(network_id));
            conditions.push(`network_id = $${params.length}`);
        }
        if (offer_id) {
            params.push(parseInt(offer_id));
            conditions.push(`offer_id = $${params.length}`);
        }
        if (status) {
            params.push(status);
            conditions.push(`status = $${params.length}`);
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

// ── GET /api/suppression-processes/:id ─────────────────────────────
router.get('/:id', async (req, res, next) => {
    try {
        const result = await query('SELECT * FROM suppression_processes WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Suppression process not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/suppression-processes/start ──────────────────────────
router.post('/start', async (req, res, next) => {
    try {
        const { network_id, offer_id, data_list_ids } = req.body;

        if (!network_id || !offer_id || !data_list_ids || !Array.isArray(data_list_ids)) {
            return res.status(400).json({
                success: false,
                error: 'network_id, offer_id, and data_list_ids array are required'
            });
        }

        const result = await query(
            `INSERT INTO suppression_processes (network_id, offer_id, data_list_ids, status)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [parseInt(network_id), parseInt(offer_id), JSON.stringify(data_list_ids), 'pending']
        );

        await logAudit(
            getActionBy(req),
            result.rows[0].id,
            `Process ${result.rows[0].id}`,
            'suppression_process',
            'insert',
            { network_id, offer_id, data_list_ids }
        );

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Suppression process started'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
