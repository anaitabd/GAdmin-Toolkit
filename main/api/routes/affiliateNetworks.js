/**
 * Affiliate Networks API — CRUD for affiliate_networks
 * Mounted at /api/affiliate-networks in server.js
 */
const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { logAudit, getActionBy } = require('../middleware/auditLog');

// ── GET /api/affiliate-networks ────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const { status, search, limit = 50, offset = 0 } = req.query;
        let sql = 'SELECT * FROM affiliate_networks';
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

// ── GET /api/affiliate-networks/:id ────────────────────────────────
router.get('/:id', async (req, res, next) => {
    try {
        const result = await query('SELECT * FROM affiliate_networks WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Affiliate network not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/affiliate-networks ───────────────────────────────────
router.post('/', async (req, res, next) => {
    try {
        const { name, api_url, api_key, status = 'active' } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'name is required'
            });
        }

        const result = await query(
            `INSERT INTO affiliate_networks (name, api_url, api_key, status)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [name, api_url || null, api_key || null, status]
        );

        await logAudit(
            getActionBy(req),
            result.rows[0].id,
            name,
            'affiliate_network',
            'insert',
            { name, status }
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── PUT /api/affiliate-networks/:id ────────────────────────────────
router.put('/:id', async (req, res, next) => {
    try {
        const { name, api_url, api_key, status } = req.body;

        const result = await query(
            `UPDATE affiliate_networks SET
                name = COALESCE($1, name),
                api_url = COALESCE($2, api_url),
                api_key = COALESCE($3, api_key),
                status = COALESCE($4, status),
                updated_at = NOW()
             WHERE id = $5
             RETURNING *`,
            [name, api_url, api_key, status, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Affiliate network not found' });
        }

        await logAudit(
            getActionBy(req),
            result.rows[0].id,
            result.rows[0].name,
            'affiliate_network',
            'update',
            { name, status }
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── DELETE /api/affiliate-networks/:id ─────────────────────────────
router.delete('/:id', async (req, res, next) => {
    try {
        const networkResult = await query('SELECT name FROM affiliate_networks WHERE id = $1', [req.params.id]);
        if (networkResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Affiliate network not found' });
        }

        const result = await query('DELETE FROM affiliate_networks WHERE id = $1 RETURNING id', [req.params.id]);

        await logAudit(
            getActionBy(req),
            req.params.id,
            networkResult.rows[0].name,
            'affiliate_network',
            'delete'
        );

        res.json({ success: true, message: 'Affiliate network deleted' });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/affiliate-networks/:id/offers ─────────────────────────
router.get('/:id/offers', async (req, res, next) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const result = await query(
            `SELECT * FROM offers
             WHERE affiliate_network_id = $1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
            [req.params.id, parseInt(limit), parseInt(offset)]
        );

        const countResult = await query(
            'SELECT COUNT(*) as total FROM offers WHERE affiliate_network_id = $1',
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

// ── POST /api/affiliate-networks/:id/fetch-offers ──────────────────
router.post('/:id/fetch-offers', async (req, res, next) => {
    try {
        const networkCheck = await query('SELECT * FROM affiliate_networks WHERE id = $1', [req.params.id]);
        if (networkCheck.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Affiliate network not found' });
        }

        const affiliateApi = require('../services/affiliateApi');
        const result = await affiliateApi.fetchOffersFromNetwork(req.params.id);

        await logAudit(
            getActionBy(req),
            req.params.id,
            networkCheck.rows[0].name,
            'affiliate_network',
            'update',
            { action: 'fetch_offers', count: result.count || 0 }
        );

        res.json({
            success: true,
            data: result.offers || [],
            count: result.count || 0,
            message: result.message || 'Offers fetched successfully'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
