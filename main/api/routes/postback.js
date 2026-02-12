/**
 * Lead Postback Endpoint
 * This is the URL given to affiliate networks as the postback URL
 * When a conversion happens, the network calls this URL
 */
const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * Parse user-agent string into device/browser/os
 */
function parseUserAgent(ua) {
    if (!ua) return { device: 'unknown', browser: 'unknown', os: 'unknown' };
    
    const device = /mobile/i.test(ua) ? 'mobile' : /tablet/i.test(ua) ? 'tablet' : 'desktop';
    let browser = 'unknown';
    let os = 'unknown';
    
    if (/chrome/i.test(ua)) browser = 'chrome';
    else if (/firefox/i.test(ua)) browser = 'firefox';
    else if (/safari/i.test(ua)) browser = 'safari';
    else if (/edge/i.test(ua)) browser = 'edge';
    
    if (/windows/i.test(ua)) os = 'windows';
    else if (/mac/i.test(ua)) os = 'macos';
    else if (/linux/i.test(ua)) os = 'linux';
    else if (/android/i.test(ua)) os = 'android';
    else if (/ios|iphone|ipad/i.test(ua)) os = 'ios';
    
    return { device, browser, os };
}

/**
 * Get client IP from request (handles proxies)
 */
function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
           req.headers['x-real-ip'] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           '';
}

/**
 * GET /postback
 * Query params: ?offer_id=X&email=Y&payout=Z&transaction_id=T
 * 
 * This is called by affiliate networks when a conversion happens
 */
router.get('/', async (req, res) => {
    try {
        const { offer_id, email, payout, transaction_id, affiliate_network_id } = req.query;
        
        // Validate required parameters
        if (!offer_id || !email) {
            return res.status(400).send('Missing required parameters: offer_id and email');
        }
        
        // Verify offer exists and is active
        const offerResult = await query(
            'SELECT * FROM offers WHERE id = $1 AND status = $2',
            [offer_id, 'active']
        );
        
        if (offerResult.rows.length === 0) {
            return res.status(404).send('Offer not found or inactive');
        }
        
        const offer = offerResult.rows[0];
        
        // Find the email in email_data
        const emailResult = await query(
            'SELECT * FROM email_data WHERE to_email = $1',
            [email]
        );
        
        if (emailResult.rows.length === 0) {
            // Email not in our database, but still record the lead
            console.log(`Lead postback for unknown email: ${email}`);
        }
        
        const emailData = emailResult.rows[0] || {};
        
        // Try to find the campaign this email was part of
        let campaign_id = null;
        let job_id = null;
        
        const logResult = await query(
            `SELECT campaign_id, job_id FROM email_logs
             WHERE to_email = $1 AND offer_id = $2
             ORDER BY sent_at DESC LIMIT 1`,
            [email, offer_id]
        );
        
        if (logResult.rows.length > 0) {
            campaign_id = logResult.rows[0].campaign_id;
            job_id = logResult.rows[0].job_id;
        }
        
        // Get IP and user agent
        const ip_address = getClientIp(req);
        const user_agent = req.headers['user-agent'] || '';
        const { device, browser, os } = parseUserAgent(user_agent);
        
        // Determine geo from email_data or use a default
        const geo = emailData.geo || null;
        
        // Insert lead record
        const leadResult = await query(
            `INSERT INTO leads (
                job_id, campaign_id, offer_id, affiliate_network_id,
                data_list_id, to_email, payout,
                ip_address, user_agent, geo, device, browser, os
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             RETURNING id`,
            [
                job_id,
                campaign_id,
                offer_id,
                affiliate_network_id || offer.affiliate_network_id,
                emailData.data_list_id || null,
                email,
                payout ? parseFloat(payout) : null,
                ip_address,
                user_agent,
                geo,
                device,
                browser,
                os
            ]
        );
        
        // Update email_data to mark as leader
        if (emailResult.rows.length > 0) {
            await query(
                'UPDATE email_data SET is_leader = true WHERE to_email = $1',
                [email]
            );
        }
        
        // Update campaign stats
        if (campaign_id) {
            await query(
                `UPDATE campaigns 
                 SET total_leads = total_leads + 1
                 WHERE id = $1`,
                [campaign_id]
            );
        }
        
        console.log(`Lead recorded: offer_id=${offer_id}, email=${email}, payout=${payout}, lead_id=${leadResult.rows[0].id}`);
        
        // Return 1x1 transparent GIF pixel
        const PIXEL_GIF = Buffer.from(
            'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            'base64'
        );
        
        res.writeHead(200, {
            'Content-Type': 'image/gif',
            'Content-Length': PIXEL_GIF.length,
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        res.end(PIXEL_GIF);
    } catch (error) {
        console.error('Postback error:', error.message);
        res.status(500).send('Internal server error');
    }
});

/**
 * POST /postback
 * Alternative endpoint for POST-based postbacks
 */
router.post('/', async (req, res) => {
    try {
        const { offer_id, email, payout, transaction_id, affiliate_network_id } = req.body;
        
        // Reuse the GET handler logic
        req.query = { offer_id, email, payout, transaction_id, affiliate_network_id };
        return router.handle({ ...req, method: 'GET' }, res);
    } catch (error) {
        console.error('Postback error:', error.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
