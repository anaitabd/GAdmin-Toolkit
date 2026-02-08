/**
 * Tracking Links API - Create and manage standalone tracking links
 * Mounted at /api/tracking-links in server.js
 */
const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * GET /api/tracking-links
 * Get all tracking links (excluding campaign-related ones unless specified)
 */
router.get('/', async (req, res) => {
    try {
        const { includeJobLinks, search, tag, limit = 50, offset = 0 } = req.query;
        
        let sql = 'SELECT id, track_id, original_url, name, description, tags, clicked, clicked_at, created_at FROM click_tracking';
        const params = [];
        const conditions = [];

        // By default, only show standalone links (without job_id)
        if (includeJobLinks !== 'true') {
            conditions.push('job_id IS NULL');
        }

        // Search by name or description
        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`);
        }

        // Filter by tag
        if (tag) {
            params.push(tag);
            conditions.push(`$${params.length} = ANY(tags)`);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY created_at DESC';

        // Add limit and offset
        if (limit) {
            params.push(parseInt(limit));
            sql += ` LIMIT $${params.length}`;
        }
        if (offset) {
            params.push(parseInt(offset));
            sql += ` OFFSET $${params.length}`;
        }

        const result = await query(sql, params);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (err) {
        console.error('Error fetching tracking links:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * GET /api/tracking-links/:id
 * Get a specific tracking link by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            'SELECT * FROM click_tracking WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Tracking link not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error fetching tracking link:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * POST /api/tracking-links
 * Create a new standalone tracking link
 * Body: { original_url, name?, description?, tags? }
 */
router.post('/', async (req, res) => {
    try {
        const { original_url, name, description, tags } = req.body;

        if (!original_url) {
            return res.status(400).json({
                success: false,
                error: 'original_url is required'
            });
        }

        // Validate URL format
        try {
            new URL(original_url);
        } catch (e) {
            return res.status(400).json({
                success: false,
                error: 'Invalid URL format'
            });
        }

        const result = await query(
            `INSERT INTO click_tracking (original_url, name, description, tags)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [original_url, name || null, description || null, tags || null]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error creating tracking link:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * POST /api/tracking-links/batch
 * Create multiple tracking links at once
 * Body: { links: [{ original_url, name?, description?, tags? }] }
 */
router.post('/batch', async (req, res) => {
    try {
        const { links } = req.body;

        if (!links || !Array.isArray(links) || links.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'links array is required'
            });
        }

        // Validate all URLs
        for (const link of links) {
            if (!link.original_url) {
                return res.status(400).json({
                    success: false,
                    error: 'original_url is required for all links'
                });
            }
            try {
                new URL(link.original_url);
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid URL format: ${link.original_url}`
                });
            }
        }

        // Build batch insert
        const params = [];
        const rows = [];
        for (let i = 0; i < links.length; i++) {
            const offset = i * 4;
            rows.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`);
            params.push(
                links[i].original_url,
                links[i].name || null,
                links[i].description || null,
                links[i].tags || null
            );
        }

        const result = await query(
            `INSERT INTO click_tracking (original_url, name, description, tags)
             VALUES ${rows.join(', ')}
             RETURNING *`,
            params
        );

        res.status(201).json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (err) {
        console.error('Error creating batch tracking links:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * PUT /api/tracking-links/:id
 * Update a tracking link
 * Body: { name?, description?, tags?, original_url? }
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, tags, original_url } = req.body;

        // Check if tracking link exists and is standalone
        const checkResult = await query(
            'SELECT id, job_id FROM click_tracking WHERE id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Tracking link not found'
            });
        }

        // Don't allow editing campaign-related tracking links
        if (checkResult.rows[0].job_id !== null) {
            return res.status(403).json({
                success: false,
                error: 'Cannot edit tracking links associated with campaigns'
            });
        }

        // Validate URL if provided
        if (original_url) {
            try {
                new URL(original_url);
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid URL format'
                });
            }
        }

        // Build dynamic update query
        const updates = [];
        const params = [];
        let paramIndex = 1;

        if (name !== undefined) {
            updates.push(`name = $${paramIndex++}`);
            params.push(name);
        }
        if (description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            params.push(description);
        }
        if (tags !== undefined) {
            updates.push(`tags = $${paramIndex++}`);
            params.push(tags);
        }
        if (original_url !== undefined) {
            updates.push(`original_url = $${paramIndex++}`);
            params.push(original_url);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No fields to update'
            });
        }

        params.push(id);
        const result = await query(
            `UPDATE click_tracking SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            params
        );

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error updating tracking link:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * DELETE /api/tracking-links/:id
 * Delete a tracking link
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if tracking link exists and is standalone
        const checkResult = await query(
            'SELECT id, job_id FROM click_tracking WHERE id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Tracking link not found'
            });
        }

        // Don't allow deleting campaign-related tracking links
        if (checkResult.rows[0].job_id !== null) {
            return res.status(403).json({
                success: false,
                error: 'Cannot delete tracking links associated with campaigns'
            });
        }

        await query('DELETE FROM click_tracking WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Tracking link deleted'
        });
    } catch (err) {
        console.error('Error deleting tracking link:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * GET /api/tracking-links/:id/html
 * Get HTML snippet for a tracking link
 * Query params: linkText, target (_blank, _self, etc.)
 */
router.get('/:id/html', async (req, res) => {
    try {
        const { id } = req.params;
        const { linkText = 'Click here', target = '_blank', style } = req.query;

        const result = await query(
            'SELECT track_id, original_url, name FROM click_tracking WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Tracking link not found'
            });
        }

        const { track_id, original_url, name } = result.rows[0];
        
        // Get base URL from environment or use a default
        const baseUrl = process.env.BASE_URL || process.env.PUBLIC_URL || 'http://localhost:3000';
        const trackingUrl = `${baseUrl}/t/c/${track_id}`;

        // Generate HTML snippet
        const styleAttr = style ? ` style="${style}"` : '';
        const html = `<a href="${trackingUrl}" target="${target}"${styleAttr}>${linkText}</a>`;

        res.json({
            success: true,
            data: {
                tracking_url: trackingUrl,
                original_url: original_url,
                name: name,
                html: html,
                html_escaped: html.replace(/"/g, '&quot;')
            }
        });
    } catch (err) {
        console.error('Error generating HTML for tracking link:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * GET /api/tracking-links/:id/stats
 * Get statistics for a tracking link
 */
router.get('/:id/stats', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT 
                id, track_id, original_url, name, description,
                clicked, clicked_at, created_at,
                CASE WHEN clicked THEN 1 ELSE 0 END as click_count
             FROM click_tracking 
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Tracking link not found'
            });
        }

        const link = result.rows[0];
        res.json({
            success: true,
            data: {
                ...link,
                stats: {
                    total_clicks: link.click_count,
                    last_clicked: link.clicked_at,
                    created: link.created_at,
                    days_active: Math.floor((new Date() - new Date(link.created_at)) / (1000 * 60 * 60 * 24))
                }
            }
        });
    } catch (err) {
        console.error('Error fetching tracking link stats:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

module.exports = router;
