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
// If link_type is 'unsub', redirect to the offer's CURRENT unsub_url and record unsubscribe
router.get('/c/:trackId', async (req, res) => {
    try {
        const { trackId } = req.params;

        const result = await query(
            `UPDATE click_tracking
             SET clicked = TRUE, clicked_at = COALESCE(clicked_at, NOW())
             WHERE track_id = $1
             RETURNING id, original_url, offer_id, job_id, to_email, link_type`,
            [trackId]
        );

        if (result.rows.length === 0) {
            return res.status(404).send('Link not found');
        }

        const { id: trackingId, original_url, offer_id, job_id, to_email, link_type } = result.rows[0];

        // Determine redirect URL: if linked to an offer, use the offer's current URL
        let redirectUrl = original_url;
        let campaignId = null;
        let geo = null;

        if (offer_id) {
            const offerResult = await query(
                'SELECT click_url, unsub_url FROM offers WHERE id = $1',
                [offer_id]
            );
            if (offerResult.rows.length > 0) {
                // For unsub links, redirect to unsub_url; for click links, redirect to click_url
                if (link_type === 'unsub' && offerResult.rows[0].unsub_url) {
                    redirectUrl = offerResult.rows[0].unsub_url;
                } else {
                    redirectUrl = offerResult.rows[0].click_url;
                }
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

        // Fire-and-forget: update email_data to mark as clicker
        if (to_email) {
            query(
                'UPDATE email_data SET is_clicker = true WHERE to_email = $1',
                [to_email]
            ).catch(err => console.error('Failed to update is_clicker flag:', err.message));
        }

        // Fire-and-forget: insert into offer_clickers if this is an offer link
        if (offer_id) {
            query(
                `INSERT INTO offer_clickers (offer_id, campaign_id, job_id, to_email, geo, ip_address, user_agent, device, browser, os)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [offer_id, campaignId, job_id, to_email, geo, ip, userAgent, device, browser, os]
            ).catch(err => console.error('Failed to log offer clicker:', err.message));
        }

        // Fire-and-forget: if this is an unsub link, record the unsubscribe and update flags
        if (link_type === 'unsub' && to_email) {
            query(
                `INSERT INTO unsubscribes (email, reason, campaign_id, offer_id, affiliate_network_id, data_list_id, ip_address, user_agent, geo)
                 VALUES ($1, $2, $3, $4, 
                         (SELECT affiliate_network_id FROM campaigns WHERE id = $3),
                         (SELECT data_list_id FROM email_data WHERE to_email = $1 LIMIT 1),
                         $5, $6, $7)
                 ON CONFLICT (email) DO NOTHING`,
                [to_email, 'unsubscribed via tracking link', campaignId, offer_id, ip, userAgent, geo]
            ).catch(err => console.error('Failed to log unsubscribe:', err.message));
            
            // Update email_data to mark as unsubbed
            query(
                'UPDATE email_data SET is_unsub = true WHERE to_email = $1',
                [to_email]
            ).catch(err => console.error('Failed to update is_unsub flag:', err.message));
            
            // If offer has suppression, also add to suppression_emails
            if (offer_id) {
                query(
                    'INSERT INTO suppression_emails (offer_id, email) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [offer_id, to_email]
                ).catch(err => console.error('Failed to add to suppression_emails:', err.message));
            }
        }
        
        // Fire-and-forget: update campaign stats
        if (campaignId) {
            if (link_type === 'unsub') {
                query('UPDATE campaigns SET total_unsubs = total_unsubs + 1 WHERE id = $1', [campaignId])
                    .catch(err => console.error('Failed to update campaign unsub stats:', err.message));
            } else {
                query('UPDATE campaigns SET total_clicked = total_clicked + 1 WHERE id = $1', [campaignId])
                    .catch(err => console.error('Failed to update campaign click stats:', err.message));
            }
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
            
            // Get to_email from open_tracking to update email_data flags
            query(
                'SELECT to_email, job_id FROM open_tracking WHERE id = $1',
                [trackingId]
            ).then(otResult => {
                if (otResult.rows.length > 0 && otResult.rows[0].to_email) {
                    const to_email = otResult.rows[0].to_email;
                    const job_id = otResult.rows[0].job_id;
                    
                    // Update email_data to mark as opener
                    query(
                        'UPDATE email_data SET is_opener = true WHERE to_email = $1',
                        [to_email]
                    ).catch(err => console.error('Failed to update is_opener flag:', err.message));
                    
                    // Update campaign stats
                    if (job_id) {
                        query(
                            'SELECT id FROM campaigns WHERE job_id = $1',
                            [job_id]
                        ).then(campResult => {
                            if (campResult.rows.length > 0) {
                                const campaign_id = campResult.rows[0].id;
                                query(
                                    'UPDATE campaigns SET total_opened = total_opened + 1 WHERE id = $1',
                                    [campaign_id]
                                ).catch(err => console.error('Failed to update campaign open stats:', err.message));
                            }
                        }).catch(err => console.error('Failed to lookup campaign:', err.message));
                    }
                }
            }).catch(err => console.error('Failed to lookup open tracking:', err.message));
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
