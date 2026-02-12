const express = require('express');
const router = express.Router();
const { query } = require('../db');

// ── GET /api/campaigns ─────────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const { status, limit, offset } = req.query;
        let sql = `
            SELECT c.*, 
                   j.status as job_status, 
                   j.progress, 
                   j.processed_items, 
                   j.total_items,
                   j.started_at,
                   j.completed_at
            FROM campaigns c
            LEFT JOIN jobs j ON c.job_id = j.id
            WHERE 1=1
        `;
        const params = [];
        
        if (status) {
            params.push(status);
            sql += ` AND j.status = $${params.length}`;
        }
        
        sql += ` ORDER BY c.created_at DESC`;
        
        if (limit) {
            params.push(parseInt(limit, 10));
            sql += ` LIMIT $${params.length}`;
        }
        
        if (offset) {
            params.push(parseInt(offset, 10));
            sql += ` OFFSET $${params.length}`;
        }
        
        const result = await query(sql, params);
        res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/campaigns/:id ─────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
    try {
        const result = await query(
            `SELECT c.*, 
                    j.status as job_status, 
                    j.progress, 
                    j.processed_items, 
                    j.total_items,
                    j.started_at,
                    j.completed_at,
                    j.error_message
             FROM campaigns c
             LEFT JOIN jobs j ON c.job_id = j.id
             WHERE c.id = $1`,
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Campaign not found' });
        }
        
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/campaigns ────────────────────────────────────────────
router.post('/', async (req, res, next) => {
    try {
        const {
            name,
            description,
            from_name,
            subject,
            html_content,
            provider,
            batch_size,
            geo,
            list_name,
            recipient_offset,
            recipient_limit,
            user_ids,
            scheduled_at,
            offer_id
        } = req.body;
        
        if (!name || !from_name || !subject || !html_content || !provider) {
            return res.status(400).json({
                success: false,
                error: 'name, from_name, subject, html_content, and provider are required'
            });
        }
        
        if (!['gmail_api', 'smtp'].includes(provider)) {
            return res.status(400).json({
                success: false,
                error: 'provider must be gmail_api or smtp'
            });
        }
        
        const result = await query(
            `INSERT INTO campaigns (
                name, description, from_name, subject, html_content, 
                provider, batch_size, geo, list_name, 
                recipient_offset, recipient_limit, user_ids, scheduled_at, offer_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *`,
            [
                name,
                description || null,
                from_name,
                subject,
                html_content,
                provider,
                batch_size || 300,
                geo || null,
                list_name || null,
                recipient_offset || null,
                recipient_limit || null,
                user_ids || null,
                scheduled_at || null,
                offer_id || null
            ]
        );
        
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── PUT /api/campaigns/:id ─────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
    try {
        const {
            name,
            description,
            from_name,
            subject,
            html_content,
            provider,
            batch_size,
            geo,
            list_name,
            recipient_offset,
            recipient_limit,
            user_ids,
            scheduled_at,
            offer_id
        } = req.body;
        
        const result = await query(
            `UPDATE campaigns SET
                name = COALESCE($1, name),
                description = COALESCE($2, description),
                from_name = COALESCE($3, from_name),
                subject = COALESCE($4, subject),
                html_content = COALESCE($5, html_content),
                provider = COALESCE($6, provider),
                batch_size = COALESCE($7, batch_size),
                geo = $8,
                list_name = $9,
                recipient_offset = $10,
                recipient_limit = $11,
                user_ids = $12,
                scheduled_at = $13,
                offer_id = $14,
                updated_at = NOW()
            WHERE id = $15
            RETURNING *`,
            [
                name,
                description,
                from_name,
                subject,
                html_content,
                provider,
                batch_size,
                geo,
                list_name,
                recipient_offset,
                recipient_limit,
                user_ids,
                scheduled_at,
                offer_id,
                req.params.id
            ]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Campaign not found' });
        }
        
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── DELETE /api/campaigns/:id ──────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
    try {
        const result = await query('DELETE FROM campaigns WHERE id = $1 RETURNING id', [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Campaign not found' });
        }
        
        res.json({ success: true, message: 'Campaign deleted' });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/campaigns/:id/clone ──────────────────────────────────
router.post('/:id/clone', async (req, res, next) => {
    try {
        const original = await query('SELECT * FROM campaigns WHERE id = $1', [req.params.id]);
        
        if (original.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Campaign not found' });
        }
        
        const campaign = original.rows[0];
        const result = await query(
            `INSERT INTO campaigns (
                name, description, from_name, subject, html_content, 
                provider, batch_size, geo, list_name, 
                recipient_offset, recipient_limit, user_ids
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *`,
            [
                `${campaign.name} (Copy)`,
                campaign.description,
                campaign.from_name,
                campaign.subject,
                campaign.html_content,
                campaign.provider,
                campaign.batch_size,
                campaign.geo,
                campaign.list_name,
                campaign.recipient_offset,
                campaign.recipient_limit,
                campaign.user_ids
            ]
        );
        
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/campaigns/:id/stats ───────────────────────────────────
router.get('/:id/stats', async (req, res, next) => {
    try {
        let campaign = await query('SELECT job_id FROM campaigns WHERE id = $1', [req.params.id]);
        // Fallback: look up by job_id (frontend may pass job ID instead of campaign ID)
        if (campaign.rows.length === 0) {
            campaign = await query('SELECT job_id FROM campaigns WHERE job_id = $1', [req.params.id]);
        }
        
        if (campaign.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Campaign not found' });
        }
        
        const jobId = campaign.rows[0].job_id;
        
        if (!jobId) {
            return res.json({
                success: true,
                data: {
                    campaign_id: parseInt(req.params.id, 10),
                    sent: 0,
                    failed: 0,
                    total_clicks: 0,
                    unique_clickers: 0,
                    total_opens: 0,
                    unique_openers: 0,
                    ctr: 0,
                    open_rate: 0
                }
            });
        }
        
        // Email log counts
        const logResult = await query(
            `SELECT
                COUNT(*) FILTER (WHERE status = 'sent') AS sent,
                COUNT(*) FILTER (WHERE status = 'failed') AS failed,
                COUNT(*) AS total
             FROM email_logs
             WHERE job_id = $1`,
            [jobId]
        );
        
        // Click tracking counts
        const clickResult = await query(
            `SELECT
                COUNT(*) AS total_links,
                COUNT(*) FILTER (WHERE clicked = TRUE) AS total_clicks,
                COUNT(DISTINCT to_email) FILTER (WHERE clicked = TRUE) AS unique_clickers
             FROM click_tracking
             WHERE job_id = $1`,
            [jobId]
        );

        // Open tracking counts
        const openResult = await query(
            `SELECT
                COUNT(*) FILTER (WHERE opened = TRUE) AS total_opens,
                COUNT(DISTINCT to_email) FILTER (WHERE opened = TRUE) AS unique_openers
             FROM open_tracking
             WHERE job_id = $1`,
            [jobId]
        );
        
        const logStats = logResult.rows[0] || { sent: '0', failed: '0', total: '0' };
        const clickStats = clickResult.rows[0] || { total_links: '0', total_clicks: '0', unique_clickers: '0' };
        const openStats = openResult.rows[0] || { total_opens: '0', unique_openers: '0' };
        
        const sent = parseInt(logStats.sent, 10);
        const failed = parseInt(logStats.failed, 10);
        const totalClicks = parseInt(clickStats.total_clicks, 10);
        const uniqueClickers = parseInt(clickStats.unique_clickers, 10);
        const totalOpens = parseInt(openStats.total_opens, 10);
        const uniqueOpeners = parseInt(openStats.unique_openers, 10);
        const ctr = sent > 0 ? Math.round((uniqueClickers / sent) * 10000) / 100 : 0;
        const openRate = sent > 0 ? Math.round((uniqueOpeners / sent) * 10000) / 100 : 0;
        
        res.json({
            success: true,
            data: {
                campaign_id: parseInt(req.params.id, 10),
                sent,
                failed,
                total_clicks: totalClicks,
                unique_clickers: uniqueClickers,
                total_opens: totalOpens,
                unique_openers: uniqueOpeners,
                ctr,
                open_rate: openRate
            }
        });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/campaigns/:id/openers ─────────────────────────────────
// Returns list of recipients who opened the email (ephemeral, per-campaign)
router.get('/:id/openers', async (req, res, next) => {
    try {
        let campaign = await query('SELECT job_id FROM campaigns WHERE id = $1', [req.params.id]);
        // Fallback: look up by job_id (frontend may pass job ID instead of campaign ID)
        if (campaign.rows.length === 0) {
            campaign = await query('SELECT job_id FROM campaigns WHERE job_id = $1', [req.params.id]);
        }
        if (campaign.rows.length === 0) return res.status(404).json({ success: false, error: 'Campaign not found' });
        const jobId = campaign.rows[0].job_id;
        if (!jobId) return res.json({ success: true, data: [], count: 0, total: 0 });

        const { limit = 100, offset = 0 } = req.query;

        const result = await query(
            `SELECT ot.to_email, ot.opened, ot.opened_at,
                    COUNT(oe.id) AS open_count,
                    MAX(oe.opened_at) AS last_opened,
                    ARRAY_AGG(DISTINCT oe.device) FILTER (WHERE oe.device IS NOT NULL) AS devices,
                    ARRAY_AGG(DISTINCT oe.browser) FILTER (WHERE oe.browser IS NOT NULL) AS browsers
             FROM open_tracking ot
             LEFT JOIN open_events oe ON oe.tracking_id = ot.id
             WHERE ot.job_id = $1 AND ot.opened = TRUE
             GROUP BY ot.id, ot.to_email, ot.opened, ot.opened_at
             ORDER BY ot.opened_at DESC
             LIMIT $2 OFFSET $3`,
            [jobId, parseInt(limit), parseInt(offset)]
        );

        const countResult = await query(
            `SELECT COUNT(*) AS total FROM open_tracking WHERE job_id = $1 AND opened = TRUE`,
            [jobId]
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

// ── GET /api/campaigns/:id/clickers ────────────────────────────────
// Returns list of recipients who clicked at least one link (ephemeral, per-campaign)
router.get('/:id/clickers', async (req, res, next) => {
    try {
        let campaign = await query('SELECT job_id FROM campaigns WHERE id = $1', [req.params.id]);
        // Fallback: look up by job_id (frontend may pass job ID instead of campaign ID)
        if (campaign.rows.length === 0) {
            campaign = await query('SELECT job_id FROM campaigns WHERE job_id = $1', [req.params.id]);
        }
        if (campaign.rows.length === 0) return res.status(404).json({ success: false, error: 'Campaign not found' });
        const jobId = campaign.rows[0].job_id;
        if (!jobId) return res.json({ success: true, data: [], count: 0, total: 0 });

        const { limit = 100, offset = 0 } = req.query;

        const result = await query(
            `SELECT ct.to_email,
                    COUNT(DISTINCT ct.id) FILTER (WHERE ct.clicked = TRUE) AS links_clicked,
                    COUNT(ce.id) AS total_clicks,
                    MIN(ct.clicked_at) AS first_click,
                    MAX(ce.clicked_at) AS last_click,
                    ARRAY_AGG(DISTINCT ce.device) FILTER (WHERE ce.device IS NOT NULL) AS devices,
                    ARRAY_AGG(DISTINCT ce.browser) FILTER (WHERE ce.browser IS NOT NULL) AS browsers
             FROM click_tracking ct
             LEFT JOIN click_events ce ON ce.tracking_id = ct.id
             WHERE ct.job_id = $1 AND ct.clicked = TRUE
             GROUP BY ct.to_email
             ORDER BY total_clicks DESC
             LIMIT $2 OFFSET $3`,
            [jobId, parseInt(limit), parseInt(offset)]
        );

        const countResult = await query(
            `SELECT COUNT(DISTINCT to_email) AS total FROM click_tracking WHERE job_id = $1 AND clicked = TRUE`,
            [jobId]
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

// ── GET /api/campaigns/:id/links ───────────────────────────────────
// Returns aggregated link stats per unique URL in the campaign (ephemeral, per-campaign)
router.get('/:id/links', async (req, res, next) => {
    try {
        let campaign = await query('SELECT job_id FROM campaigns WHERE id = $1', [req.params.id]);
        // Fallback: look up by job_id (frontend may pass job ID instead of campaign ID)
        if (campaign.rows.length === 0) {
            campaign = await query('SELECT job_id FROM campaigns WHERE job_id = $1', [req.params.id]);
        }
        if (campaign.rows.length === 0) return res.status(404).json({ success: false, error: 'Campaign not found' });
        const jobId = campaign.rows[0].job_id;
        if (!jobId) return res.json({ success: true, data: [] });

        const result = await query(
            `SELECT ct.original_url,
                    COUNT(*) AS total_sent,
                    COUNT(*) FILTER (WHERE ct.clicked = TRUE) AS total_clicks,
                    COUNT(DISTINCT ct.to_email) FILTER (WHERE ct.clicked = TRUE) AS unique_clickers,
                    MIN(ct.clicked_at) AS first_click,
                    MAX(ct.clicked_at) AS last_click
             FROM click_tracking ct
             WHERE ct.job_id = $1
             GROUP BY ct.original_url
             ORDER BY total_clicks DESC`,
            [jobId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/campaigns/:id/recipients ──────────────────────────────
// Returns paginated list of email_logs for this campaign with status and tracking events
router.get('/:id/recipients', async (req, res, next) => {
    try {
        const { limit = 100, offset = 0 } = req.query;
        
        const campaign = await query('SELECT job_id, id FROM campaigns WHERE id = $1', [req.params.id]);
        
        if (campaign.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Campaign not found' });
        }
        
        const jobId = campaign.rows[0].job_id;
        const campaignId = campaign.rows[0].id;
        
        if (!jobId) {
            return res.json({ success: true, data: [], count: 0, total: 0 });
        }
        
        const result = await query(
            `SELECT 
                el.to_email,
                el.status,
                el.sent_at,
                el.error_message,
                EXISTS(SELECT 1 FROM open_tracking WHERE job_id = $1 AND to_email = el.to_email AND opened = TRUE) as has_opened,
                EXISTS(SELECT 1 FROM click_tracking WHERE job_id = $1 AND to_email = el.to_email AND clicked = TRUE) as has_clicked,
                (SELECT COUNT(*) FROM click_tracking WHERE job_id = $1 AND to_email = el.to_email AND clicked = TRUE) as click_count
             FROM email_logs el
             WHERE el.job_id = $1
             ORDER BY el.sent_at DESC
             LIMIT $2 OFFSET $3`,
            [jobId, parseInt(limit), parseInt(offset)]
        );
        
        const countResult = await query(
            'SELECT COUNT(*) as total FROM email_logs WHERE job_id = $1',
            [jobId]
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

// ── GET /api/campaigns/:id/clicks ──────────────────────────────────
// Returns click_tracking records for this campaign with device/geo breakdown
router.get('/:id/clicks', async (req, res, next) => {
    try {
        const { limit = 100, offset = 0 } = req.query;
        
        const campaign = await query('SELECT job_id FROM campaigns WHERE id = $1', [req.params.id]);
        
        if (campaign.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Campaign not found' });
        }
        
        const jobId = campaign.rows[0].job_id;
        
        if (!jobId) {
            return res.json({ success: true, data: [], count: 0, total: 0 });
        }
        
        const result = await query(
            `SELECT 
                ct.to_email,
                ct.original_url,
                ct.clicked,
                ct.clicked_at,
                ce.device,
                ce.browser,
                ce.os,
                ce.ip_address,
                ce.country as geo
             FROM click_tracking ct
             LEFT JOIN click_events ce ON ce.tracking_id = ct.id
             WHERE ct.job_id = $1 AND ct.clicked = TRUE
             ORDER BY ct.clicked_at DESC
             LIMIT $2 OFFSET $3`,
            [jobId, parseInt(limit), parseInt(offset)]
        );
        
        const countResult = await query(
            'SELECT COUNT(*) as total FROM click_tracking WHERE job_id = $1 AND clicked = TRUE',
            [jobId]
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

// ── GET /api/campaigns/:id/opens ───────────────────────────────────
// Returns open_tracking records for this campaign
router.get('/:id/opens', async (req, res, next) => {
    try {
        const { limit = 100, offset = 0 } = req.query;
        
        const campaign = await query('SELECT job_id FROM campaigns WHERE id = $1', [req.params.id]);
        
        if (campaign.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Campaign not found' });
        }
        
        const jobId = campaign.rows[0].job_id;
        
        if (!jobId) {
            return res.json({ success: true, data: [], count: 0, total: 0 });
        }
        
        const result = await query(
            `SELECT 
                ot.to_email,
                ot.opened,
                ot.opened_at,
                oe.device,
                oe.browser,
                oe.os,
                oe.ip_address
             FROM open_tracking ot
             LEFT JOIN open_events oe ON oe.tracking_id = ot.id
             WHERE ot.job_id = $1 AND ot.opened = TRUE
             ORDER BY ot.opened_at DESC
             LIMIT $2 OFFSET $3`,
            [jobId, parseInt(limit), parseInt(offset)]
        );
        
        const countResult = await query(
            'SELECT COUNT(*) as total FROM open_tracking WHERE job_id = $1 AND opened = TRUE',
            [jobId]
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

// ── GET /api/campaigns/:id/leads ───────────────────────────────────
// Returns leads for this campaign with payout totals
router.get('/:id/leads', async (req, res, next) => {
    try {
        const { limit = 100, offset = 0 } = req.query;
        
        const result = await query(
            `SELECT 
                l.id,
                l.to_email,
                l.payout,
                l.geo,
                l.device,
                l.browser,
                l.os,
                l.created_at,
                o.name as offer_name,
                an.name as network_name
             FROM leads l
             LEFT JOIN offers o ON o.id = l.offer_id
             LEFT JOIN affiliate_networks an ON an.id = l.affiliate_network_id
             WHERE l.campaign_id = $1
             ORDER BY l.created_at DESC
             LIMIT $2 OFFSET $3`,
            [req.params.id, parseInt(limit), parseInt(offset)]
        );
        
        const statsResult = await query(
            `SELECT 
                COUNT(*) as total_leads,
                SUM(payout) as total_payout
             FROM leads
             WHERE campaign_id = $1`,
            [req.params.id]
        );
        
        const stats = statsResult.rows[0] || { total_leads: 0, total_payout: 0 };
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length,
            total_leads: parseInt(stats.total_leads),
            total_payout: parseFloat(stats.total_payout) || 0
        });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/campaigns/compare ─────────────────────────────────────
// Returns side-by-side stats for multiple campaigns (A/B testing comparison)
router.get('/compare', async (req, res, next) => {
    try {
        const { campaign_ids } = req.query;
        
        if (!campaign_ids) {
            return res.status(400).json({ success: false, error: 'campaign_ids query parameter is required' });
        }
        
        // Parse campaign_ids (could be comma-separated string or array)
        const ids = Array.isArray(campaign_ids) 
            ? campaign_ids 
            : campaign_ids.split(',').map(id => parseInt(id.trim(), 10));
        
        const comparisons = await Promise.all(ids.map(async (campaign_id) => {
            const campaign = await query('SELECT * FROM campaigns WHERE id = $1', [campaign_id]);
            
            if (campaign.rows.length === 0) {
                return { campaign_id, error: 'Not found' };
            }
            
            const c = campaign.rows[0];
            const jobId = c.job_id;
            
            if (!jobId) {
                return {
                    campaign_id,
                    name: c.name,
                    sent: 0,
                    failed: 0,
                    opened: 0,
                    clicked: 0,
                    leads: 0
                };
            }
            
            // Get stats
            const logResult = await query(
                `SELECT
                    COUNT(*) FILTER (WHERE status = 'sent') AS sent,
                    COUNT(*) FILTER (WHERE status = 'failed') AS failed
                 FROM email_logs WHERE job_id = $1`,
                [jobId]
            );
            
            const clickResult = await query(
                'SELECT COUNT(DISTINCT to_email) as unique_clickers FROM click_tracking WHERE job_id = $1 AND clicked = TRUE',
                [jobId]
            );
            
            const openResult = await query(
                'SELECT COUNT(DISTINCT to_email) as unique_openers FROM open_tracking WHERE job_id = $1 AND opened = TRUE',
                [jobId]
            );
            
            const leadResult = await query(
                'SELECT COUNT(*) as total_leads, SUM(payout) as total_payout FROM leads WHERE campaign_id = $1',
                [campaign_id]
            );
            
            const sent = parseInt(logResult.rows[0].sent || 0);
            const failed = parseInt(logResult.rows[0].failed || 0);
            const unique_openers = parseInt(openResult.rows[0].unique_openers || 0);
            const unique_clickers = parseInt(clickResult.rows[0].unique_clickers || 0);
            const total_leads = parseInt(leadResult.rows[0].total_leads || 0);
            const total_payout = parseFloat(leadResult.rows[0].total_payout || 0);
            
            return {
                campaign_id,
                name: c.name,
                sent,
                failed,
                opened: unique_openers,
                open_rate: sent > 0 ? Math.round((unique_openers / sent) * 10000) / 100 : 0,
                clicked: unique_clickers,
                click_rate: sent > 0 ? Math.round((unique_clickers / sent) * 10000) / 100 : 0,
                leads: total_leads,
                conversion_rate: sent > 0 ? Math.round((total_leads / sent) * 10000) / 100 : 0,
                total_payout
            };
        }));
        
        res.json({
            success: true,
            data: comparisons
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
