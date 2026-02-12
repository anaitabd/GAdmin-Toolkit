/**
 * Suppression Emails API — CRUD for suppression_emails
 * Mounted at /api/suppression-emails in server.js
 */
const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { logAudit, getActionBy } = require('../middleware/auditLog');

// ── GET /api/suppression-emails ────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const { offer_id, limit = 100, offset = 0 } = req.query;
        let sql = 'SELECT * FROM suppression_emails';
        const params = [];

        if (offer_id) {
            params.push(parseInt(offer_id));
            sql += ` WHERE offer_id = $${params.length}`;
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

// ── GET /api/suppression-emails/by-offer/:offerId ──────────────────
router.get('/by-offer/:offerId', async (req, res, next) => {
    try {
        const { limit = 100, offset = 0 } = req.query;

        const result = await query(
            `SELECT * FROM suppression_emails
             WHERE offer_id = $1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
            [req.params.offerId, parseInt(limit), parseInt(offset)]
        );

        const countResult = await query(
            'SELECT COUNT(*) as total FROM suppression_emails WHERE offer_id = $1',
            [req.params.offerId]
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

// ── POST /api/suppression-emails/bulk ──────────────────────────────
router.post('/bulk', async (req, res, next) => {
    try {
        const { offer_id, emails } = req.body;

        if (!offer_id || !emails || !Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'offer_id and emails array are required'
            });
        }

        const values = emails.map((email, idx) => {
            const offset = idx * 2;
            return `($${offset + 1}, $${offset + 2})`;
        }).join(', ');

        const params = emails.flatMap(email => [parseInt(offer_id), email.toLowerCase()]);

        const result = await query(
            `INSERT INTO suppression_emails (offer_id, email)
             VALUES ${values}
             ON CONFLICT (offer_id, email) DO NOTHING
             RETURNING *`,
            params
        );

        await logAudit(
            getActionBy(req),
            offer_id,
            `Offer ${offer_id}`,
            'suppression_email',
            'insert',
            { action: 'bulk_add', count: result.rows.length }
        );

        res.status(201).json({
            success: true,
            data: result.rows,
            count: result.rows.length,
            message: `Added ${result.rows.length} suppression emails`
        });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/suppression-emails/check ─────────────────────────────
router.post('/check', async (req, res, next) => {
    try {
        const { offer_id, email } = req.body;

        if (!offer_id || !email) {
            return res.status(400).json({
                success: false,
                error: 'offer_id and email are required'
            });
        }

        const result = await query(
            `SELECT * FROM suppression_emails
             WHERE offer_id = $1 AND email = $2`,
            [parseInt(offer_id), email.toLowerCase()]
        );

        res.json({
            success: true,
            suppressed: result.rows.length > 0,
            data: result.rows[0] || null
        });
    } catch (error) {
        next(error);
    }
});

// ── DELETE /api/suppression-emails/:id ─────────────────────────────
router.delete('/:id', async (req, res, next) => {
    try {
        const result = await query(
            'DELETE FROM suppression_emails WHERE id = $1 RETURNING *',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Suppression email not found' });
        }

        await logAudit(
            getActionBy(req),
            result.rows[0].offer_id,
            `Offer ${result.rows[0].offer_id}`,
            'suppression_email',
            'delete',
            { email: result.rows[0].email }
        );

        res.json({ success: true, message: 'Suppression email deleted' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
