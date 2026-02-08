/**
 * Tracking routes — click tracking via redirect
 * Mounted at /t in server.js
 */
const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET /t/c/:trackId — records a click and redirects to the original URL
router.get('/c/:trackId', async (req, res) => {
    try {
        const { trackId } = req.params;

        const result = await query(
            `UPDATE click_tracking
             SET clicked = TRUE, clicked_at = COALESCE(clicked_at, NOW())
             WHERE track_id = $1
             RETURNING original_url`,
            [trackId]
        );

        if (result.rows.length === 0) {
            return res.status(404).send('Link not found');
        }

        res.redirect(302, result.rows[0].original_url);
    } catch (err) {
        console.error('Click tracking error:', err.message);
        res.status(500).send('Tracking error');
    }
});

module.exports = router;
