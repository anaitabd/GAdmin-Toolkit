const express = require('express');
const router = express.Router();
const { getTrackingLinkByShortCode, recordClick } = require('../db/queries');

// ── GET /t/:shortCode ──────────────────────────────────────────────
router.get('/:shortCode', async (req, res, next) => {
    try {
        const { shortCode } = req.params;
        const link = await getTrackingLinkByShortCode(shortCode);

        if (!link) {
            return res.status(404).send('Tracking link not found');
        }

        // Extract client info
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent') || null;
        const referer = req.get('referer') || req.get('referrer') || null;

        // Record the click asynchronously
        recordClick(link.id, ipAddress, userAgent, referer).catch((err) => {
            console.error('Failed to record click:', err);
        });

        // Redirect to offer URL
        res.redirect(link.offer_url);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
