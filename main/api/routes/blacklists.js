/**
 * Blacklists API — CRUD for blacklists and blacklist_emails
 * Mounted at /api/blacklists in server.js
 */
const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { logAudit, getActionBy } = require('../middleware/auditLog');

// ── GET /api/blacklists ────────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const { status, search, limit = 50, offset = 0 } = req.query;
        let sql = 'SELECT * FROM blacklists';
        const params = [];
        const conditions = [];

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

// ── GET /api/blacklists/:id ────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
    try {
        const result = await query('SELECT * FROM blacklists WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Blacklist not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/blacklists ───────────────────────────────────────────
router.post('/', async (req, res, next) => {
    try {
        const { name, description, status = 'active' } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'name is required'
            });
        }

        const result = await query(
            `INSERT INTO blacklists (name, description, status)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [name, description || null, status]
        );

        await logAudit(
            getActionBy(req),
            result.rows[0].id,
            name,
            'blacklist',
            'insert',
            { name, status }
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── PUT /api/blacklists/:id ────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
    try {
        const { name, description, status } = req.body;

        const result = await query(
            `UPDATE blacklists SET
                name = COALESCE($1, name),
                description = COALESCE($2, description),
                status = COALESCE($3, status),
                updated_at = NOW()
             WHERE id = $4
             RETURNING *`,
            [name, description, status, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Blacklist not found' });
        }

        await logAudit(
            getActionBy(req),
            result.rows[0].id,
            result.rows[0].name,
            'blacklist',
            'update',
            { name, status }
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── DELETE /api/blacklists/:id ─────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
    try {
        const blacklistResult = await query('SELECT name FROM blacklists WHERE id = $1', [req.params.id]);
        if (blacklistResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Blacklist not found' });
        }

        const result = await query('DELETE FROM blacklists WHERE id = $1 RETURNING id', [req.params.id]);

        await logAudit(
            getActionBy(req),
            req.params.id,
            blacklistResult.rows[0].name,
            'blacklist',
            'delete'
        );

        res.json({ success: true, message: 'Blacklist deleted' });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/blacklists/:id/emails ─────────────────────────────────
router.get('/:id/emails', async (req, res, next) => {
    try {
        const { limit = 100, offset = 0 } = req.query;
        
        const result = await query(
            `SELECT * FROM blacklist_emails
             WHERE blacklist_id = $1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
            [req.params.id, parseInt(limit), parseInt(offset)]
        );

        const countResult = await query(
            'SELECT COUNT(*) as total FROM blacklist_emails WHERE blacklist_id = $1',
            [req.params.id]
        );

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length,
            total: parseInt(countResult.rows[0].total)
        });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/blacklists/:id/emails/bulk ───────────────────────────
router.post('/:id/emails/bulk', async (req, res, next) => {
    try {
        const { emails } = req.body;

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'emails array is required'
            });
        }

        const blacklistCheck = await query('SELECT name FROM blacklists WHERE id = $1', [req.params.id]);
        if (blacklistCheck.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Blacklist not found' });
        }

        const values = emails.map((email, idx) => {
            const offset = idx * 2;
            return `($${offset + 1}, $${offset + 2})`;
        }).join(', ');

        const params = emails.flatMap(email => [req.params.id, email.toLowerCase()]);

        const result = await query(
            `INSERT INTO blacklist_emails (blacklist_id, email)
             VALUES ${values}
             ON CONFLICT (blacklist_id, email) DO NOTHING
             RETURNING *`,
            params
        );

        await logAudit(
            getActionBy(req),
            req.params.id,
            blacklistCheck.rows[0].name,
            'blacklist',
            'update',
            { action: 'bulk_add_emails', count: result.rows.length }
        );

        res.status(201).json({
            success: true,
            data: result.rows,
            count: result.rows.length,
            message: `Added ${result.rows.length} emails`
        });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/blacklists/:id/check ─────────────────────────────────
router.post('/:id/check', async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'email is required'
            });
        }

        const result = await query(
            `SELECT * FROM blacklist_emails
             WHERE blacklist_id = $1 AND email = $2`,
            [req.params.id, email.toLowerCase()]
        );

        res.json({
            success: true,
            blacklisted: result.rows.length > 0,
            data: result.rows[0] || null
        });
    } catch (error) {
        next(error);
    }
});

// ── DELETE /api/blacklists/:id/emails/:emailId ─────────────────────
router.delete('/:id/emails/:emailId', async (req, res, next) => {
    try {
        const result = await query(
            'DELETE FROM blacklist_emails WHERE blacklist_id = $1 AND id = $2 RETURNING *',
            [req.params.id, req.params.emailId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Email not found in blacklist' });
        }

        const blacklistCheck = await query('SELECT name FROM blacklists WHERE id = $1', [req.params.id]);

        await logAudit(
            getActionBy(req),
            req.params.id,
            blacklistCheck.rows[0]?.name || 'Unknown',
            'blacklist',
            'update',
            { action: 'remove_email', email: result.rows[0].email }
        );

        res.json({ success: true, message: 'Email removed from blacklist' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
