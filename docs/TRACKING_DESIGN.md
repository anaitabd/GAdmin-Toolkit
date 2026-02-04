# Tracking and Monitoring Design

## Overview

This document describes how the platform tracks email engagement (opens, clicks) and handles user actions (unsubscribes, bounces). All tracking is done through the platform's domain, not directly through third parties.

## Tracking Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Email Sent                                │
│  • Contains tracking pixel (opens)                           │
│  • Links rewritten with tracking (clicks)                    │
│  • Unsubscribe link with unique token                        │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│              Recipient Receives Email                        │
└────┬────────────────┬────────────────┬──────────────────────┘
     │                │                │
     │ Opens Email    │ Clicks Link    │ Unsubscribes
     │                │                │
     ▼                ▼                ▼
┌─────────┐    ┌──────────┐    ┌────────────────┐
│ Pixel   │    │ Redirect │    │  Unsubscribe   │
│ Request │    │ Handler  │    │    Handler     │
└────┬────┘    └─────┬────┘    └───────┬────────┘
     │               │                  │
     ▼               ▼                  ▼
┌──────────────────────────────────────────────────────────────┐
│              Tracking API Server                             │
│  • Validate token                                            │
│  • Log event to database                                     │
│  • Return appropriate response                               │
└──────────────────────────────────────────────────────────────┘
```

## 1. Open Tracking

### How It Works

When composing an email, we embed a 1x1 transparent tracking pixel:

```html
<img src="https://yourdomain.com/track/open/ABC123TOKEN" 
     width="1" height="1" 
     style="display:block" 
     alt="" />
```

When the recipient opens the email in an email client that loads images, the browser requests this image, and we log the open event.

### Token Generation

```javascript
function generateTrackingToken(emailQueueId, recipientEmail) {
    const crypto = require('crypto');
    
    // Create token from emailQueueId + secret salt
    const hash = crypto.createHmac('sha256', process.env.TRACKING_SECRET)
        .update(`${emailQueueId}:${recipientEmail}`)
        .digest('hex');
    
    // Take first 16 characters for shorter URL
    const token = hash.substring(0, 16);
    
    // Store mapping in database
    await db.query(
        'UPDATE email_queue SET tracking_token = $1 WHERE id = $2',
        [token, emailQueueId]
    );
    
    return token;
}
```

### API Endpoint: GET /track/open/:token

```javascript
// src/api/tracking.js
router.get('/track/open/:token', async (req, res) => {
    const { token } = req.params;
    
    try {
        // Look up email by token
        const email = await db.query(
            'SELECT id, recipient_email, campaign_id FROM email_queue WHERE tracking_token = $1',
            [token]
        );
        
        if (email.rows.length === 0) {
            console.warn(`Invalid tracking token: ${token}`);
            return sendPixel(res);
        }
        
        const emailData = email.rows[0];
        
        // Log open event
        await db.query(`
            INSERT INTO open_events 
            (email_queue_id, tracking_token, campaign_id, recipient_email, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [
            emailData.id,
            token,
            emailData.campaign_id,
            emailData.recipient_email,
            req.ip,
            req.get('user-agent')
        ]);
        
        console.log(`Open tracked: ${emailData.recipient_email}`);
        
    } catch (error) {
        console.error('Error tracking open:', error);
    }
    
    // Always return pixel, even on error
    sendPixel(res);
});

function sendPixel(res) {
    // 1x1 transparent GIF
    const pixel = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
    );
    
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Content-Length', pixel.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(pixel);
}
```

### Privacy Considerations

**Email Clients that Block Tracking**:
- Apple Mail (iOS 15+): Prefetches images via proxy
- Gmail: Caches images on their servers
- Outlook: May block external images

**Our Approach**:
- Track opens when possible
- Don't rely solely on opens for deliverability
- Use clicks as more reliable engagement metric
- Document limitations in analytics

**User Privacy**:
- No PII in URLs (use opaque tokens)
- Don't track location (optional)
- Provide clear opt-out mechanism

## 2. Click Tracking

### How It Works

Replace all links in email HTML with tracking URLs:

**Original**:
```html
<a href="https://example.com/offer">Click here</a>
```

**Tracked**:
```html
<a href="https://yourdomain.com/track/click/DEF456TOKEN">Click here</a>
```

When user clicks, we log the event and redirect to the original URL.

### Link Rewriting

```javascript
function rewriteLinksInHTML(htmlBody, trackingToken) {
    const cheerio = require('cheerio');
    const $ = cheerio.load(htmlBody);
    
    $('a').each((index, element) => {
        const originalUrl = $(element).attr('href');
        
        // Skip if already tracked or if mailto/tel
        if (!originalUrl || 
            originalUrl.startsWith('mailto:') || 
            originalUrl.startsWith('tel:') ||
            originalUrl.includes('/track/click/')) {
            return;
        }
        
        // Create tracking URL
        const trackingUrl = `${process.env.BASE_URL}/track/click/${trackingToken}?url=${encodeURIComponent(originalUrl)}`;
        
        $(element).attr('href', trackingUrl);
    });
    
    return $.html();
}
```

### API Endpoint: GET /track/click/:token

```javascript
router.get('/track/click/:token', async (req, res) => {
    const { token } = req.params;
    const originalUrl = req.query.url;
    
    try {
        // Validate token
        const email = await db.query(
            'SELECT id, recipient_email, campaign_id FROM email_queue WHERE tracking_token = $1',
            [token]
        );
        
        if (email.rows.length === 0) {
            console.warn(`Invalid click token: ${token}`);
            return res.status(404).send('Invalid link');
        }
        
        const emailData = email.rows[0];
        
        // Validate redirect URL (prevent open redirect attacks)
        if (!isAllowedRedirect(originalUrl)) {
            console.warn(`Blocked redirect to: ${originalUrl}`);
            return res.status(403).send('Invalid redirect URL');
        }
        
        // Log click event
        await db.query(`
            INSERT INTO click_events 
            (email_queue_id, tracking_token, campaign_id, recipient_email, link_url, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
            emailData.id,
            token,
            emailData.campaign_id,
            emailData.recipient_email,
            originalUrl,
            req.ip,
            req.get('user-agent')
        ]);
        
        console.log(`Click tracked: ${emailData.recipient_email} -> ${originalUrl}`);
        
        // Redirect to original URL
        res.redirect(302, originalUrl);
        
    } catch (error) {
        console.error('Error tracking click:', error);
        res.status(500).send('Error processing link');
    }
});

// Whitelist allowed redirect domains
function isAllowedRedirect(url) {
    try {
        const parsed = new URL(url);
        
        // Allow your own domain
        if (parsed.hostname === process.env.DOMAIN) {
            return true;
        }
        
        // Allow sponsor domains (load from database)
        const allowedDomains = [
            'example.com',
            'sponsor1.com',
            'sponsor2.com'
        ];
        
        return allowedDomains.some(domain => 
            parsed.hostname === domain || 
            parsed.hostname.endsWith(`.${domain}`)
        );
        
    } catch (error) {
        // Invalid URL
        return false;
    }
}
```

### Security: Preventing Open Redirects

**Problem**: Attackers could abuse click tracking to redirect users to malicious sites.

**Solution**: Whitelist allowed redirect domains.

```javascript
// Only allow redirects to:
// 1. Your own domain
// 2. Explicitly whitelisted sponsor domains
// 3. HTTPS only (reject HTTP for security)

function isAllowedRedirect(url) {
    const parsed = new URL(url);
    
    // Must be HTTPS
    if (parsed.protocol !== 'https:') {
        return false;
    }
    
    // Check whitelist
    const allowed = getWhitelistedDomains(); // From DB or config
    return allowed.includes(parsed.hostname);
}
```

## 3. Unsubscribe Handling

### One-Click Unsubscribe (RFC 8058)

**Standards Compliant**:
- RFC 8058: One-click unsubscribe
- CAN-SPAM Act: Clear opt-out mechanism
- GDPR: Right to object to processing

### Email Header

```javascript
// In email composition
headers = {
    'List-Unsubscribe': `<https://yourdomain.com/unsubscribe/${token}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
};
```

### Unsubscribe Link in Email

```html
<div style="text-align: center; font-size: 12px; color: #999; margin-top: 20px;">
    If you no longer wish to receive these emails, 
    <a href="https://yourdomain.com/unsubscribe/GHI789TOKEN">click here to unsubscribe</a>.
</div>
```

### API Endpoint: GET /unsubscribe/:token

```javascript
router.get('/unsubscribe/:token', async (req, res) => {
    const { token } = req.params;
    
    try {
        // Look up email by token
        const email = await db.query(
            'SELECT recipient_email, campaign_id FROM email_queue WHERE tracking_token = $1',
            [token]
        );
        
        if (email.rows.length === 0) {
            return res.status(404).send('Invalid unsubscribe link');
        }
        
        const { recipient_email, campaign_id } = email.rows[0];
        
        // Add to unsubscribe list (idempotent)
        await db.query(`
            INSERT INTO unsubscribe_list (email, campaign_id, user_agent, ip_address)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (email) DO NOTHING
        `, [recipient_email, campaign_id, req.get('user-agent'), req.ip]);
        
        console.log(`Unsubscribed: ${recipient_email}`);
        
        // Remove from future queues
        await db.query(
            'DELETE FROM email_queue WHERE recipient_email = $1 AND status = $2',
            [recipient_email, 'pending']
        );
        
        // Show confirmation page
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Unsubscribed</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    h1 { color: #4CAF50; }
                </style>
            </head>
            <body>
                <h1>✓ You've been unsubscribed</h1>
                <p>You will no longer receive emails from us.</p>
                <p>This may take up to 24 hours to take effect.</p>
            </body>
            </html>
        `);
        
    } catch (error) {
        console.error('Error processing unsubscribe:', error);
        res.status(500).send('Error processing your request');
    }
});
```

### Suppression List Integration

Before enqueueing emails, check suppression lists:

```javascript
async function enqueueEmail(recipientEmail, subject, body, campaignId) {
    // Check if unsubscribed
    const unsubscribed = await db.query(
        'SELECT 1 FROM unsubscribe_list WHERE email = $1',
        [recipientEmail]
    );
    
    if (unsubscribed.rows.length > 0) {
        console.log(`Skipping unsubscribed email: ${recipientEmail}`);
        return { status: 'suppressed', reason: 'unsubscribed' };
    }
    
    // Check if hard bounced
    const bounced = await db.query(
        'SELECT 1 FROM bounce_list WHERE email = $1 AND bounce_type = $2',
        [recipientEmail, 'hard']
    );
    
    if (bounced.rows.length > 0) {
        console.log(`Skipping bounced email: ${recipientEmail}`);
        return { status: 'suppressed', reason: 'hard_bounce' };
    }
    
    // OK to enqueue
    await db.query(`
        INSERT INTO email_queue (recipient_email, subject, html_body, campaign_id, tracking_token)
        VALUES ($1, $2, $3, $4, $5)
    `, [recipientEmail, subject, body, campaignId, generateTrackingToken()]);
    
    return { status: 'queued' };
}
```

## 4. Bounce Processing

### Types of Bounces

**Hard Bounce**: Permanent failure
- Invalid email address
- Domain doesn't exist
- Mailbox doesn't exist
- Reject by spam filter

**Soft Bounce**: Temporary failure
- Mailbox full
- Server temporarily unavailable
- Message too large

**Complaint**: Recipient marked as spam
- Gmail "Report Spam" button
- ISP feedback loops

### Detecting Bounces (Gmail API)

```javascript
// src/tracking/bounceProcessor.js
async function processBounces(accountEmail) {
    const jwtClient = authenticateGmail(accountEmail);
    const gmail = google.gmail({ version: 'v1', auth: jwtClient });
    
    // Search for bounce notifications
    const response = await gmail.users.messages.list({
        userId: 'me',
        q: 'from:"Mail Delivery Subsystem" OR from:"postmaster" is:unread'
    });
    
    if (!response.data.messages) {
        return;
    }
    
    for (const message of response.data.messages) {
        // Get full message
        const fullMessage = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full'
        });
        
        // Parse bounce notification
        const bounce = parseBounceMessage(fullMessage.data);
        
        if (bounce) {
            console.log(`Bounce detected: ${bounce.email} (${bounce.type})`);
            
            // Add to bounce list
            await db.query(`
                INSERT INTO bounce_list 
                (email, bounce_type, bounce_reason, bounce_code, sender_account_id)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (email) 
                DO UPDATE SET 
                    last_bounced_at = NOW(),
                    bounce_count = bounce_list.bounce_count + 1
            `, [bounce.email, bounce.type, bounce.reason, bounce.code, accountId]);
            
            // Mark message as read
            await gmail.users.messages.modify({
                userId: 'me',
                id: message.id,
                requestBody: {
                    removeLabelIds: ['UNREAD']
                }
            });
        }
    }
}

function parseBounceMessage(message) {
    const snippet = message.snippet.toLowerCase();
    const body = getMessageBody(message);
    
    // Extract email address
    const emailMatch = body.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
    if (!emailMatch) {
        return null;
    }
    
    const email = emailMatch[0];
    
    // Classify bounce type
    if (snippet.includes('address not found') ||
        snippet.includes('user unknown') ||
        snippet.includes('does not exist')) {
        return { email, type: 'hard', reason: 'Address not found', code: '550' };
    }
    
    if (snippet.includes('mailbox full') ||
        snippet.includes('quota exceeded')) {
        return { email, type: 'soft', reason: 'Mailbox full', code: '552' };
    }
    
    if (snippet.includes('spam') ||
        snippet.includes('blocked')) {
        return { email, type: 'complaint', reason: 'Marked as spam', code: '554' };
    }
    
    // Default to soft bounce if unclear
    return { email, type: 'soft', reason: snippet, code: 'unknown' };
}
```

### Bounce Rate Monitoring

```javascript
// Run every hour
async function monitorBounceRates() {
    const accounts = await db.query(`
        SELECT id, email, daily_sent, daily_bounces
        FROM sender_accounts
        WHERE status = 'active'
    `);
    
    for (const account of accounts.rows) {
        if (account.daily_sent === 0) continue;
        
        const bounceRate = account.daily_bounces / account.daily_sent;
        
        if (bounceRate > 0.05) { // 5% threshold
            console.warn(`High bounce rate for ${account.email}: ${(bounceRate * 100).toFixed(2)}%`);
            
            // Auto-pause account
            await db.query(
                'UPDATE sender_accounts SET status = $1 WHERE id = $2',
                ['paused', account.id]
            );
            
            // Alert admin
            await sendAdminAlert({
                subject: `Account ${account.email} auto-paused`,
                message: `Bounce rate: ${(bounceRate * 100).toFixed(2)}%. Please investigate.`
            });
        }
    }
}
```

## 5. Analytics and Reporting

### Campaign Metrics

```javascript
async function getCampaignStats(campaignId) {
    const stats = await db.query(`
        SELECT
            COUNT(DISTINCT sl.id) as total_sent,
            COUNT(DISTINCT oe.id) as total_opens,
            COUNT(DISTINCT ce.id) as total_clicks,
            COUNT(DISTINCT bl.email) as total_bounces,
            COUNT(DISTINCT ul.email) as total_unsubscribes
        FROM send_logs sl
        LEFT JOIN open_events oe ON oe.campaign_id = sl.campaign_id
        LEFT JOIN click_events ce ON ce.campaign_id = sl.campaign_id
        LEFT JOIN bounce_list bl ON bl.campaign_id = sl.campaign_id
        LEFT JOIN unsubscribe_list ul ON ul.campaign_id = sl.campaign_id
        WHERE sl.campaign_id = $1
    `, [campaignId]);
    
    const data = stats.rows[0];
    
    return {
        campaignId,
        totalSent: parseInt(data.total_sent),
        totalOpens: parseInt(data.total_opens),
        totalClicks: parseInt(data.total_clicks),
        totalBounces: parseInt(data.total_bounces),
        totalUnsubscribes: parseInt(data.total_unsubscribes),
        openRate: data.total_sent > 0 ? (data.total_opens / data.total_sent * 100).toFixed(2) : 0,
        clickRate: data.total_sent > 0 ? (data.total_clicks / data.total_sent * 100).toFixed(2) : 0,
        bounceRate: data.total_sent > 0 ? (data.total_bounces / data.total_sent * 100).toFixed(2) : 0
    };
}
```

### Real-Time Dashboard

```javascript
// WebSocket or Server-Sent Events for real-time updates
io.on('connection', (socket) => {
    console.log('Dashboard connected');
    
    // Send updates every 5 seconds
    const interval = setInterval(async () => {
        const metrics = await getCurrentMetrics();
        socket.emit('metrics', metrics);
    }, 5000);
    
    socket.on('disconnect', () => {
        clearInterval(interval);
    });
});

async function getCurrentMetrics() {
    return {
        queued: await getQueueDepth(),
        sending: await getActiveSenders(),
        sentToday: await getSentToday(),
        openRateToday: await getOpenRateToday(),
        clickRateToday: await getClickRateToday()
    };
}
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-03  
**Author**: Principal Backend Architect
