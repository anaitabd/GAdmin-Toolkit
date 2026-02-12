/**
 * Leads API — CRUD for leads tracking
 * Mounted at /api/leads in server.js
 */
const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { logAudit, getActionBy } = require('../middleware/auditLog');

// ── GET /api/leads ─────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const { offer_id, campaign_id, date_from, date_to, limit = 50, offset = 0 } = req.query;
        let sql = 'SELECT * FROM leads';
        const params = [];
        const conditions = [];

        if (offer_id) {
            params.push(parseInt(offer_id));
            conditions.push(`offer_id = $${params.length}`);
        }
        if (campaign_id) {
            params.push(parseInt(campaign_id));
            conditions.push(`campaign_id = $${params.length}`);
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
        res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/leads/stats ───────────────────────────────────────────
router.get('/stats', async (req, res, next) => {
    try {
        const result = await query(
            `SELECT
                offer_id,
                campaign_id,
                affiliate_network_id,
                COUNT(*) as count,
                SUM(payout) as total_payout
             FROM leads
             GROUP BY offer_id, campaign_id, affiliate_network_id
             ORDER BY count DESC`
        );

        res.json({
            success: true,
            data: result.rows.map(r => ({
                offer_id: r.offer_id,
                campaign_id: r.campaign_id,
                affiliate_network_id: r.affiliate_network_id,
                count: parseInt(r.count),
                total_payout: parseFloat(r.total_payout) || 0
            })),
            count: result.rows.length
        });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/leads/:id ─────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
    try {
        const result = await query('SELECT * FROM leads WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Lead not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/leads ────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
    try {
        const { offer_id, campaign_id, affiliate_network_id, to_email, payout } = req.body;

        if (!offer_id) {
            return res.status(400).json({
                success: false,
                error: 'offer_id is required'
            });
        }

        if (!to_email) {
            return res.status(400).json({
                success: false,
                error: 'to_email is required'
            });
        }

        const result = await query(
            `INSERT INTO leads (offer_id, campaign_id, affiliate_network_id, to_email, payout)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                parseInt(offer_id),
                campaign_id ? parseInt(campaign_id) : null,
                affiliate_network_id ? parseInt(affiliate_network_id) : null,
                to_email,
                payout || null
            ]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── PUT /api/leads/:id ─────────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
    try {
        const { payout, ip_address } = req.body;

        const checkResult = await query('SELECT * FROM leads WHERE id = $1', [req.params.id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Lead not found' });
        }

        const updates = [];
        const params = [];
        let paramCount = 1;

        if (payout !== undefined) {
            params.push(payout);
            updates.push(`payout = $${paramCount++}`);
        }
        if (ip_address !== undefined) {
            params.push(ip_address);
            updates.push(`ip_address = $${paramCount++}`);
        }

        if (updates.length === 0) {
            return res.json({ success: true, data: checkResult.rows[0] });
        }

        params.push(req.params.id);
        const result = await query(
            `UPDATE leads SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            params
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── DELETE /api/leads/:id ──────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
    try {
        const leadResult = await query('SELECT * FROM leads WHERE id = $1', [req.params.id]);
        if (leadResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Lead not found' });
        }

        const result = await query('DELETE FROM leads WHERE id = $1 RETURNING id', [req.params.id]);

        await logAudit(
            getActionBy(req),
            req.params.id,
            `Lead ${req.params.id}`,
            'lead',
            'delete',
            { offer_id: leadResult.rows[0].offer_id }
        );

        res.json({ success: true, message: 'Lead deleted' });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/leads/by-offer/:offerId ───────────────────────────────
router.get('/by-offer/:offerId', async (req, res, next) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const result = await query(
            `SELECT * FROM leads
             WHERE offer_id = $1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
            [req.params.offerId, parseInt(limit), parseInt(offset)]
        );

        const countResult = await query(
            'SELECT COUNT(*) as total FROM leads WHERE offer_id = $1',
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

// ── GET /api/leads/by-campaign/:campaignId ─────────────────────────
router.get('/by-campaign/:campaignId', async (req, res, next) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const result = await query(
            `SELECT * FROM leads
             WHERE campaign_id = $1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
            [req.params.campaignId, parseInt(limit), parseInt(offset)]
        );

        const countResult = await query(
            'SELECT COUNT(*) as total FROM leads WHERE campaign_id = $1',
            [req.params.campaignId]
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

module.exports = router;
