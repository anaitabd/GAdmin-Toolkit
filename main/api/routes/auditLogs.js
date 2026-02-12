/**
 * Audit Logs API — Read-only access to audit logs
 * Mounted at /api/audit-logs in server.js
 */
const express = require('express');
const router = express.Router();
const { query } = require('../db');

// ── GET /api/audit-logs ────────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const {
            record_type,
            action_type,
            action_by,
            date_from,
            date_to,
            limit = 100,
            offset = 0
        } = req.query;

        let sql = 'SELECT * FROM audit_logs';
        const params = [];
        const conditions = [];

        if (record_type) {
            params.push(record_type);
            conditions.push(`record_type = $${params.length}`);
        }
        if (action_type) {
            params.push(action_type);
            conditions.push(`action_type = $${params.length}`);
        }
        if (action_by) {
            params.push(`%${action_by}%`);
            conditions.push(`action_by ILIKE $${params.length}`);
        }
        if (date_from) {
            params.push(date_from);
            conditions.push(`created_at >= $${params.length}`);
        }
        if (date_to) {
            params.push(date_to);
            conditions.push(`created_at <= $${params.length}`);
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

        // Get total count for pagination
        let countSql = 'SELECT COUNT(*) FROM audit_logs';
        if (conditions.length > 0) {
            countSql += ' WHERE ' + conditions.join(' AND ');
        }
        const countResult = await query(countSql, params.slice(0, -2));

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length,
            total: parseInt(countResult.rows[0].count)
        });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/audit-logs/by-record/:recordType/:recordId ────────────
router.get('/by-record/:recordType/:recordId', async (req, res, next) => {
    try {
        const { recordType, recordId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const result = await query(
            `SELECT * FROM audit_logs
             WHERE record_type = $1 AND record_id = $2
             ORDER BY created_at DESC
             LIMIT $3 OFFSET $4`,
            [recordType, parseInt(recordId), parseInt(limit), parseInt(offset)]
        );

        const countResult = await query(
            `SELECT COUNT(*) FROM audit_logs
             WHERE record_type = $1 AND record_id = $2`,
            [recordType, parseInt(recordId)]
        );

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length,
            total: parseInt(countResult.rows[0].count)
        });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/audit-logs/:id ────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
    try {
        const result = await query('SELECT * FROM audit_logs WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Audit log not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
