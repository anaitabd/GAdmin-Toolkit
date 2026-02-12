/**
 * Offers API — CRUD for offers + clickers by offer/geo/campaign
 * Mounted at /api/offers in server.js
 */
const express = require('express');
const router = express.Router();
const { query } = require('../db');

// ── GET /api/offers ────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const { active, search, limit = 50, offset = 0 } = req.query;
        let sql = 'SELECT * FROM offers';
        const params = [];
        const conditions = [];

        if (active !== undefined) {
            params.push(active === 'true');
            conditions.push(`active = $${params.length}`);
        }
        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(name ILIKE $${params.length} OR subject ILIKE $${params.length})`);
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

// ── GET /api/offers/:id ────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
    try {
        const result = await query('SELECT * FROM offers WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Offer not found' });
        }

        const offer = result.rows[0];

        // Get counts for related entities
        const [creativesCount, linksCount, fromNamesCount, subjectsCount] = await Promise.all([
            query('SELECT COUNT(*) FROM creatives WHERE offer_id = $1', [req.params.id]),
            query('SELECT COUNT(*) FROM offer_links WHERE offer_id = $1', [req.params.id]),
            query('SELECT COUNT(*) FROM from_names WHERE offer_id = $1', [req.params.id]),
            query('SELECT COUNT(*) FROM subjects WHERE offer_id = $1', [req.params.id])
        ]);

        offer.creatives_count = parseInt(creativesCount.rows[0].count);
        offer.links_count = parseInt(linksCount.rows[0].count);
        offer.from_names_count = parseInt(fromNamesCount.rows[0].count);
        offer.subjects_count = parseInt(subjectsCount.rows[0].count);

        res.json({ success: true, data: offer });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/offers ───────────────────────────────────────────────
router.post('/', async (req, res, next) => {
    try {
        const {
            name, subject, from_name, html_content, click_url, unsub_url,
            affiliate_network_id, vertical_id, production_id, description,
            rules, payout, status = 'active'
        } = req.body;

        if (!name || !subject || !from_name || !html_content || !click_url) {
            return res.status(400).json({
                success: false,
                error: 'name, subject, from_name, html_content, and click_url are required'
            });
        }

        const result = await query(
            `INSERT INTO offers (name, subject, from_name, html_content, click_url, unsub_url,
                                 affiliate_network_id, vertical_id, production_id, description,
                                 rules, payout, status, active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             RETURNING *`,
            [name, subject, from_name, html_content, click_url, unsub_url || null,
             affiliate_network_id || null, vertical_id || null, production_id || null,
             description || null, rules || null, payout || null, status, status === 'active']
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── PUT /api/offers/:id ────────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
    try {
        const {
            name, subject, from_name, html_content, click_url, unsub_url, active,
            affiliate_network_id, vertical_id, production_id, description,
            rules, payout, status
        } = req.body;

        const result = await query(
            `UPDATE offers SET
                name = COALESCE($1, name),
                subject = COALESCE($2, subject),
                from_name = COALESCE($3, from_name),
                html_content = COALESCE($4, html_content),
                click_url = COALESCE($5, click_url),
                unsub_url = COALESCE($6, unsub_url),
                active = COALESCE($7, active),
                affiliate_network_id = COALESCE($8, affiliate_network_id),
                vertical_id = COALESCE($9, vertical_id),
                production_id = COALESCE($10, production_id),
                description = COALESCE($11, description),
                rules = COALESCE($12, rules),
                payout = COALESCE($13, payout),
                status = COALESCE($14, status),
                updated_at = NOW()
             WHERE id = $15
             RETURNING *`,
            [name, subject, from_name, html_content, click_url, unsub_url, active,
             affiliate_network_id, vertical_id, production_id, description, rules,
             payout, status, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Offer not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── DELETE /api/offers/:id ─────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
    try {
        const result = await query('DELETE FROM offers WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Offer not found' });
        }
        res.json({ success: true, message: 'Offer deleted' });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/offers/:id/stats ──────────────────────────────────────
// Aggregated stats: total clickers, by geo, by campaign
router.get('/:id/stats', async (req, res, next) => {
    try {
        const offer = await query('SELECT id, name FROM offers WHERE id = $1', [req.params.id]);
        if (offer.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Offer not found' });
        }

        // Total clickers
        const totalResult = await query(
            `SELECT COUNT(*) AS total_clicks,
                    COUNT(DISTINCT to_email) AS unique_clickers
             FROM offer_clickers WHERE offer_id = $1`,
            [req.params.id]
        );

        // By geo
        const geoResult = await query(
            `SELECT geo, COUNT(*) AS clicks, COUNT(DISTINCT to_email) AS unique_clickers
             FROM offer_clickers WHERE offer_id = $1 AND geo IS NOT NULL
             GROUP BY geo ORDER BY clicks DESC`,
            [req.params.id]
        );

        // By campaign
        const campaignResult = await query(
            `SELECT oc.campaign_id, c.name AS campaign_name,
                    COUNT(*) AS clicks, COUNT(DISTINCT oc.to_email) AS unique_clickers
             FROM offer_clickers oc
             LEFT JOIN campaigns c ON c.id = oc.campaign_id
             WHERE oc.offer_id = $1
             GROUP BY oc.campaign_id, c.name
             ORDER BY clicks DESC`,
            [req.params.id]
        );

        // Unsubscribes for this offer
        const unsubResult = await query(
            'SELECT COUNT(*) AS total FROM unsubscribes WHERE offer_id = $1',
            [req.params.id]
        );

        const t = totalResult.rows[0];
        res.json({
            success: true,
            data: {
                offer_id: parseInt(req.params.id),
                total_clicks: parseInt(t.total_clicks),
                unique_clickers: parseInt(t.unique_clickers),
                unsubscribes: parseInt(unsubResult.rows[0].total),
                by_geo: geoResult.rows.map(r => ({
                    geo: r.geo,
                    clicks: parseInt(r.clicks),
                    unique_clickers: parseInt(r.unique_clickers)
                })),
                by_campaign: campaignResult.rows.map(r => ({
                    campaign_id: r.campaign_id,
                    campaign_name: r.campaign_name,
                    clicks: parseInt(r.clicks),
                    unique_clickers: parseInt(r.unique_clickers)
                }))
            }
        });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/offers/:id/clickers ───────────────────────────────────
// List all clickers for an offer, filterable by geo and campaign_id
router.get('/:id/clickers', async (req, res, next) => {
    try {
        const { geo, campaign_id, limit = 100, offset = 0 } = req.query;

        let sql = `SELECT oc.*, c.name AS campaign_name
                    FROM offer_clickers oc
                    LEFT JOIN campaigns c ON c.id = oc.campaign_id
                    WHERE oc.offer_id = $1`;
        const params = [req.params.id];

        if (geo) {
            params.push(geo);
            sql += ` AND oc.geo = $${params.length}`;
        }
        if (campaign_id) {
            params.push(parseInt(campaign_id));
            sql += ` AND oc.campaign_id = $${params.length}`;
        }

        sql += ' ORDER BY oc.clicked_at DESC';
        params.push(parseInt(limit));
        sql += ` LIMIT $${params.length}`;
        params.push(parseInt(offset));
        sql += ` OFFSET $${params.length}`;

        const result = await query(sql, params);

        // Count
        let countSql = 'SELECT COUNT(*) AS total FROM offer_clickers WHERE offer_id = $1';
        const countParams = [req.params.id];
        if (geo) {
            countParams.push(geo);
            countSql += ` AND geo = $${countParams.length}`;
        }
        if (campaign_id) {
            countParams.push(parseInt(campaign_id));
            countSql += ` AND campaign_id = $${countParams.length}`;
        }
        const countResult = await query(countSql, countParams);

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
