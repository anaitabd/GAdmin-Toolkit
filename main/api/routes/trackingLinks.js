/**
 * Tracking Links API
 * Generate standalone tracking links that redirect to offer/target URLs
 */
const express = require('express');
const router = express.Router();
const { query } = require('../db');

// POST /api/tracking-links - Generate a tracking link
router.post('/', async (req, res, next) => {
    try {
        const { original_url, to_email, job_id, metadata } = req.body;

        if (!original_url || typeof original_url !== 'string' || !original_url.trim()) {
            return res.status(400).json({
                success: false,
                error: 'original_url is required and must be a valid URL string'
            });
        }

        // Validate URL format
        try {
            new URL(original_url);
        } catch (err) {
            return res.status(400).json({
                success: false,
                error: 'original_url must be a valid URL (e.g., https://example.com)'
            });
        }

        // Insert tracking link with optional job_id and to_email
        const result = await query(
            `INSERT INTO click_tracking (job_id, to_email, original_url)
             VALUES ($1, $2, $3)
             RETURNING id, track_id, original_url, to_email, clicked, created_at`,
            [job_id || null, to_email || null, original_url.trim()]
        );

        const trackingData = result.rows[0];
        const baseUrl = process.env.BASE_URL || req.get('host') ? `${req.protocol}://${req.get('host')}` : 'http://localhost:3000';
        const trackingUrl = `${baseUrl}/t/c/${trackingData.track_id}`;

        res.status(201).json({
            success: true,
            data: {
                id: trackingData.id,
                track_id: trackingData.track_id,
                original_url: trackingData.original_url,
                tracking_url: trackingUrl,
                to_email: trackingData.to_email,
                clicked: trackingData.clicked,
                created_at: trackingData.created_at
            }
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/tracking-links/bulk - Generate multiple tracking links at once
router.post('/bulk', async (req, res, next) => {
    try {
        const { links, job_id } = req.body;

        if (!links || !Array.isArray(links) || links.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'links array is required and must not be empty'
            });
        }

        if (links.length > 1000) {
            return res.status(400).json({
                success: false,
                error: 'Maximum 1000 links can be generated at once'
            });
        }

        const results = [];
        const baseUrl = process.env.BASE_URL || req.get('host') ? `${req.protocol}://${req.get('host')}` : 'http://localhost:3000';

        for (const link of links) {
            const { original_url, to_email } = typeof link === 'string' ? { original_url: link, to_email: null } : link;

            if (!original_url || typeof original_url !== 'string') {
                continue; // Skip invalid entries
            }

            try {
                new URL(original_url); // Validate URL

                const result = await query(
                    `INSERT INTO click_tracking (job_id, to_email, original_url)
                     VALUES ($1, $2, $3)
                     RETURNING id, track_id, original_url, to_email, clicked, created_at`,
                    [job_id || null, to_email || null, original_url.trim()]
                );

                const trackingData = result.rows[0];
                results.push({
                    id: trackingData.id,
                    track_id: trackingData.track_id,
                    original_url: trackingData.original_url,
                    tracking_url: `${baseUrl}/t/c/${trackingData.track_id}`,
                    to_email: trackingData.to_email,
                    clicked: trackingData.clicked,
                    created_at: trackingData.created_at
                });
            } catch (err) {
                // Skip invalid URLs
                continue;
            }
        }

        res.status(201).json({
            success: true,
            data: results,
            count: results.length
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/tracking-links/:trackId - Get tracking link details
router.get('/:trackId', async (req, res, next) => {
    try {
        const { trackId } = req.params;

        const result = await query(
            `SELECT id, track_id, original_url, to_email, job_id, clicked, clicked_at, created_at
             FROM click_tracking
             WHERE track_id = $1`,
            [trackId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Tracking link not found'
            });
        }

        const trackingData = result.rows[0];
        const baseUrl = process.env.BASE_URL || req.get('host') ? `${req.protocol}://${req.get('host')}` : 'http://localhost:3000';

        res.json({
            success: true,
            data: {
                ...trackingData,
                tracking_url: `${baseUrl}/t/c/${trackingData.track_id}`
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/tracking-links - Get all tracking links (with optional filters)
router.get('/', async (req, res, next) => {
    try {
        const { job_id, to_email, clicked, limit = 100, offset = 0 } = req.query;

        let sql = `SELECT id, track_id, original_url, to_email, job_id, clicked, clicked_at, created_at
                   FROM click_tracking`;
        const conditions = [];
        const params = [];

        if (job_id) {
            params.push(job_id);
            conditions.push(`job_id = $${params.length}`);
        }

        if (to_email) {
            params.push(to_email);
            conditions.push(`to_email = $${params.length}`);
        }

        if (clicked !== undefined) {
            params.push(clicked === 'true' || clicked === true);
            conditions.push(`clicked = $${params.length}`);
        }

        if (conditions.length > 0) {
            sql += ` WHERE ${conditions.join(' AND ')}`;
        }

        sql += ' ORDER BY created_at DESC';

        params.push(Math.min(Number(limit) || 100, 1000));
        sql += ` LIMIT $${params.length}`;

        params.push(Number(offset) || 0);
        sql += ` OFFSET $${params.length}`;

        const result = await query(sql, params);
        const baseUrl = process.env.BASE_URL || req.get('host') ? `${req.protocol}://${req.get('host')}` : 'http://localhost:3000';

        const data = result.rows.map(row => ({
            ...row,
            tracking_url: `${baseUrl}/t/c/${row.track_id}`
        }));

        res.json({
            success: true,
            data,
            count: data.length
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/tracking-links/:trackId - Delete a tracking link
router.delete('/:trackId', async (req, res, next) => {
    try {
        const { trackId } = req.params;

        const result = await query(
            'DELETE FROM click_tracking WHERE track_id = $1 RETURNING *',
            [trackId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Tracking link not found'
            });
        }

        res.json({
            success: true,
            message: 'Tracking link deleted',
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
