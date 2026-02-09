/**
 * Tracking routes — click tracking via redirect
 * Mounted at /t in server.js
 */
const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * Parse user-agent string into device/browser/os
 */
function parseUserAgent(ua) {
    if (!ua) return { device: 'unknown', browser: 'unknown', os: 'unknown' };

    // Device
    let device = 'Desktop';
    if (/Mobile|Android.*Mobile|iPhone|iPod/i.test(ua)) device = 'Mobile';
    else if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) device = 'Tablet';
    else if (/Bot|Crawler|Spider|Slurp|Googlebot/i.test(ua)) device = 'Bot';

    // Browser
    let browser = 'Other';
    if (/Edg\//i.test(ua)) browser = 'Edge';
    else if (/OPR\//i.test(ua)) browser = 'Opera';
    else if (/Chrome\//i.test(ua)) browser = 'Chrome';
    else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
    else if (/Firefox\//i.test(ua)) browser = 'Firefox';
    else if (/MSIE|Trident/i.test(ua)) browser = 'IE';

    // OS
    let os = 'Other';
    if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/Windows/i.test(ua)) os = 'Windows';
    else if (/Macintosh|Mac OS/i.test(ua)) os = 'macOS';
    else if (/Linux/i.test(ua)) os = 'Linux';

    return { device, browser, os };
}

/**
 * Get client IP from request (handles proxies)
 */
function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.headers['x-real-ip']
        || req.socket?.remoteAddress
        || null;
}

// GET /t/c/:trackId — records a click with full data and redirects
// If the click_tracking row has an offer_id, redirect to the offer's CURRENT click_url (dynamic)
router.get('/c/:trackId', async (req, res) => {
    try {
        const { trackId } = req.params;

        const result = await query(
            `UPDATE click_tracking
             SET clicked = TRUE, clicked_at = COALESCE(clicked_at, NOW())
             WHERE track_id = $1
             RETURNING id, original_url, offer_id, job_id, to_email`,
            [trackId]
        );

        if (result.rows.length === 0) {
            return res.status(404).send('Link not found');
        }

        const { id: trackingId, original_url, offer_id, job_id, to_email } = result.rows[0];

        // Determine redirect URL: if linked to an offer, use the offer's current click_url
        let redirectUrl = original_url;
        let campaignId = null;
        let geo = null;

        if (offer_id) {
            const offerResult = await query(
                'SELECT click_url FROM offers WHERE id = $1',
                [offer_id]
            );
            if (offerResult.rows.length > 0) {
                redirectUrl = offerResult.rows[0].click_url;
            }

            // Look up campaign and geo for offer_clickers
            if (job_id) {
                const campResult = await query(
                    'SELECT id, geo FROM campaigns WHERE job_id = $1',
                    [job_id]
                );
                if (campResult.rows.length > 0) {
                    campaignId = campResult.rows[0].id;
                    geo = campResult.rows[0].geo;
                }
                // Also try to get geo from email_data if not on campaign
                if (!geo && to_email) {
                    const edResult = await query(
                        'SELECT geo FROM email_data WHERE to_email = $1 LIMIT 1',
                        [to_email]
                    );
                    if (edResult.rows.length > 0) geo = edResult.rows[0].geo;
                }
            }
        }

        // Log click event asynchronously (don't delay redirect)
        const ip = getClientIp(req);
        const userAgent = req.headers['user-agent'] || null;
        const referer = req.headers['referer'] || req.headers['referrer'] || null;
        const { device, browser, os } = parseUserAgent(userAgent);

        // Fire-and-forget: insert click event
        query(
            `INSERT INTO click_events (tracking_id, ip_address, user_agent, referer, device, browser, os)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [trackingId, ip, userAgent, referer, device, browser, os]
        ).catch(err => console.error('Failed to log click event:', err.message));

        // Fire-and-forget: insert into offer_clickers if this is an offer link
        if (offer_id) {
            query(
                `INSERT INTO offer_clickers (offer_id, campaign_id, job_id, to_email, geo, ip_address, user_agent, device, browser, os)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [offer_id, campaignId, job_id, to_email, geo, ip, userAgent, device, browser, os]
            ).catch(err => console.error('Failed to log offer clicker:', err.message));
        }

        res.redirect(302, redirectUrl);
    } catch (err) {
        console.error('Click tracking error:', err.message);
        res.status(500).send('Tracking error');
    }
});

// 1x1 transparent GIF pixel
const PIXEL_GIF = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
);

// GET /t/o/:trackId — records an open and returns a 1x1 pixel
router.get('/o/:trackId', async (req, res) => {
    try {
        const { trackId } = req.params;

        const result = await query(
            `UPDATE open_tracking
             SET opened = TRUE, opened_at = COALESCE(opened_at, NOW())
             WHERE track_id = $1
             RETURNING id`,
            [trackId]
        );

        if (result.rows.length > 0) {
            const trackingId = result.rows[0].id;
            const ip = getClientIp(req);
            const userAgent = req.headers['user-agent'] || null;
            const { device, browser, os } = parseUserAgent(userAgent);

            // Fire-and-forget: insert open event
            query(
                `INSERT INTO open_events (tracking_id, ip_address, user_agent, device, browser, os)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [trackingId, ip, userAgent, device, browser, os]
            ).catch(err => console.error('Failed to log open event:', err.message));
        }

        // Always return the pixel regardless of tracking success
        res.set({
            'Content-Type': 'image/gif',
            'Content-Length': PIXEL_GIF.length,
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        });
        res.end(PIXEL_GIF);
    } catch (err) {
        console.error('Open tracking error:', err.message);
        // Still return the pixel to avoid broken images
        res.set({ 'Content-Type': 'image/gif', 'Content-Length': PIXEL_GIF.length });
        res.end(PIXEL_GIF);
    }
});

module.exports = router;
