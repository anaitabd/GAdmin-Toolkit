/**
 * Offer Links API — CRUD for offer_links
 * Mounted at /api/offer-links in server.js
 */
const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { logAudit, getActionBy } = require('../middleware/auditLog');

// ── GET /api/offer-links ───────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const { offer_id, creative_id, status, search, limit = 50, offset = 0 } = req.query;
        let sql = 'SELECT * FROM offer_links';
        const params = [];
        const conditions = [];

        if (offer_id) {
            params.push(parseInt(offer_id));
            conditions.push(`offer_id = $${params.length}`);
        }
        if (creative_id) {
            params.push(parseInt(creative_id));
            conditions.push(`creative_id = $${params.length}`);
        }
        if (status) {
            params.push(status);
            conditions.push(`status = $${params.length}`);
        }
        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(name ILIKE $${params.length} OR url ILIKE $${params.length})`);
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

// ── GET /api/offer-links/:id ───────────────────────────────────────
router.get('/:id', async (req, res, next) => {
    try {
        const result = await query('SELECT * FROM offer_links WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Offer link not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/offer-links ──────────────────────────────────────────
router.post('/', async (req, res, next) => {
    try {
        const { name, offer_id, creative_id, url, status = 'active' } = req.body;

        if (!name || !offer_id || !url) {
            return res.status(400).json({
                success: false,
                error: 'name, offer_id, and url are required'
            });
        }

        const result = await query(
            `INSERT INTO offer_links (name, offer_id, creative_id, url, status)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [name, parseInt(offer_id), creative_id ? parseInt(creative_id) : null, url, status]
        );

        await logAudit(
            getActionBy(req),
            result.rows[0].id,
            name,
            'offer_link',
            'insert',
            { name, offer_id, creative_id, status }
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── PUT /api/offer-links/:id ───────────────────────────────────────
router.put('/:id', async (req, res, next) => {
    try {
        const { name, offer_id, creative_id, url, status } = req.body;

        const result = await query(
            `UPDATE offer_links SET
                name = COALESCE($1, name),
                offer_id = COALESCE($2, offer_id),
                creative_id = COALESCE($3, creative_id),
                url = COALESCE($4, url),
                status = COALESCE($5, status),
                updated_at = NOW()
             WHERE id = $6
             RETURNING *`,
            [name, offer_id ? parseInt(offer_id) : null, creative_id ? parseInt(creative_id) : null, url, status, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Offer link not found' });
        }

        await logAudit(
            getActionBy(req),
            result.rows[0].id,
            result.rows[0].name,
            'offer_link',
            'update',
            { name, offer_id, creative_id, status }
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── DELETE /api/offer-links/:id ────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
    try {
        const linkResult = await query('SELECT name FROM offer_links WHERE id = $1', [req.params.id]);
        if (linkResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Offer link not found' });
        }

        const result = await query('DELETE FROM offer_links WHERE id = $1 RETURNING id', [req.params.id]);

        await logAudit(
            getActionBy(req),
            req.params.id,
            linkResult.rows[0].name,
            'offer_link',
            'delete'
        );

        res.json({ success: true, message: 'Offer link deleted' });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/offer-links/by-offer/:offerId ─────────────────────────
router.get('/by-offer/:offerId', async (req, res, next) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const result = await query(
            `SELECT * FROM offer_links
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

// ── GET /api/offer-links/by-creative/:creativeId ───────────────────
router.get('/by-creative/:creativeId', async (req, res, next) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const result = await query(
            `SELECT * FROM offer_links
             WHERE creative_id = $1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
            [req.params.creativeId, parseInt(limit), parseInt(offset)]
        );

        res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
