# API Design & Sponsor Integration

## Overview

This document describes the API endpoints for the email delivery platform, focusing on:
1. Admin management API
2. Sponsor integration API
3. Campaign management API
4. Analytics and reporting API

## Security Model

### Authentication

**JWT-based Authentication**:
```javascript
// Generate token
const jwt = require('jsonwebtoken');

function generateToken(userId, role) {
    return jwt.sign(
        { userId, role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
}

// Middleware to verify token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Role-based authorization
function requireRole(role) {
    return (req, res, next) => {
        if (req.user.role !== role && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
}
```

**API Key Authentication** (for sponsors):
```javascript
function authenticateApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
        return res.status(401).json({ error: 'API key required' });
    }
    
    // Validate API key against database
    db.query('SELECT id, name, permissions FROM api_keys WHERE key = $1 AND active = true', [apiKey])
        .then(result => {
            if (result.rows.length === 0) {
                return res.status(403).json({ error: 'Invalid API key' });
            }
            req.apiClient = result.rows[0];
            next();
        })
        .catch(err => {
            res.status(500).json({ error: 'Internal server error' });
        });
}
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
});

const sponsorLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // Max 60 requests per minute
    keyGenerator: (req) => req.apiClient.id,
    message: 'Rate limit exceeded'
});
```

## 1. Admin Management API

### POST /api/admin/login

Authenticate admin user.

**Request**:
```json
{
    "email": "admin@yourdomain.com",
    "password": "secure_password"
}
```

**Response**:
```json
{
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 1,
        "email": "admin@yourdomain.com",
        "role": "admin"
    }
}
```

### GET /api/admin/accounts

List all sender accounts.

**Headers**:
```
Authorization: Bearer <token>
```

**Query Parameters**:
- `status` (optional): Filter by status (active, paused, suspended, warming_up)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)

**Response**:
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "email": "sender1@yourdomain.com",
            "auth_type": "gmail",
            "status": "active",
            "daily_limit": 2000,
            "daily_sent": 543,
            "daily_bounces": 12,
            "daily_errors": 3,
            "last_used_at": "2026-02-03T18:30:00Z",
            "warmup_stage": 0
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 45,
        "totalPages": 3
    }
}
```

### POST /api/admin/accounts

Create a new sender account.

**Request**:
```json
{
    "email": "newsender@yourdomain.com",
    "display_name": "Marketing Team",
    "auth_type": "gmail",
    "gmail_subject_email": "newsender@yourdomain.com",
    "daily_limit": 2000,
    "batch_size": 50,
    "send_delay_ms": 100,
    "warmup": true
}
```

**Response**:
```json
{
    "success": true,
    "data": {
        "id": 46,
        "email": "newsender@yourdomain.com",
        "status": "warming_up",
        "message": "Account created and warm-up started"
    }
}
```

### PATCH /api/admin/accounts/:id

Update sender account settings.

**Request**:
```json
{
    "status": "paused",
    "daily_limit": 1500,
    "notes": "Temporarily paused for investigation"
}
```

**Response**:
```json
{
    "success": true,
    "message": "Account updated successfully"
}
```

### DELETE /api/admin/accounts/:id

Delete (archive) a sender account.

**Response**:
```json
{
    "success": true,
    "message": "Account archived successfully"
}
```

### GET /api/admin/stats

Get system-wide statistics.

**Response**:
```json
{
    "success": true,
    "data": {
        "totalAccounts": 45,
        "activeAccounts": 38,
        "pausedAccounts": 5,
        "suspendedAccounts": 2,
        "queueDepth": 2543,
        "sentToday": 45678,
        "sentThisWeek": 312456,
        "sentThisMonth": 1234567,
        "avgBounceRate": 2.3,
        "avgOpenRate": 18.5,
        "avgClickRate": 4.2
    }
}
```

## 2. Campaign Management API

### POST /api/campaigns

Create a new email campaign.

**Request**:
```json
{
    "name": "Summer Sale 2026",
    "subject": "🌞 50% Off All Products This Week",
    "html_body": "<html>...</html>",
    "text_body": "Plain text version...",
    "recipients": [
        {"email": "user1@example.com", "name": "John Doe"},
        {"email": "user2@example.com", "name": "Jane Smith"}
    ],
    "schedule": "immediate",
    "tracking": {
        "opens": true,
        "clicks": true
    }
}
```

**Response**:
```json
{
    "success": true,
    "data": {
        "campaignId": "summer-sale-2026",
        "status": "queued",
        "totalRecipients": 2,
        "suppressed": 0,
        "queued": 2,
        "estimatedSendTime": "2026-02-03T20:00:00Z"
    }
}
```

### GET /api/campaigns/:id

Get campaign details and stats.

**Response**:
```json
{
    "success": true,
    "data": {
        "id": "summer-sale-2026",
        "name": "Summer Sale 2026",
        "status": "sending",
        "created_at": "2026-02-03T19:00:00Z",
        "stats": {
            "totalRecipients": 10000,
            "sent": 5432,
            "pending": 4568,
            "failed": 0,
            "opens": 987,
            "clicks": 234,
            "bounces": 12,
            "unsubscribes": 3,
            "openRate": 18.2,
            "clickRate": 4.3,
            "bounceRate": 0.2
        }
    }
}
```

### GET /api/campaigns

List all campaigns.

**Query Parameters**:
- `status` (optional): Filter by status
- `page` (optional): Page number
- `limit` (optional): Results per page

**Response**:
```json
{
    "success": true,
    "data": [
        {
            "id": "summer-sale-2026",
            "name": "Summer Sale 2026",
            "status": "completed",
            "created_at": "2026-02-03T19:00:00Z",
            "totalRecipients": 10000,
            "sent": 10000,
            "openRate": 18.2,
            "clickRate": 4.3
        }
    ],
    "pagination": { /* ... */ }
}
```

## 3. Sponsor Integration API

Sponsors are external partners who provide offers. They should NOT have access to the sending system, only to offer management and lead tracking.

### GET /api/sponsors/offers

Get list of available offers.

**Headers**:
```
X-API-Key: sponsor_api_key_here
```

**Response**:
```json
{
    "success": true,
    "data": [
        {
            "id": "offer-123",
            "name": "Web Hosting Discount",
            "description": "50% off first year",
            "landingUrl": "https://sponsor.com/offer/123",
            "payout": 25.00,
            "active": true,
            "expiresAt": "2026-12-31T23:59:59Z"
        }
    ]
}
```

### POST /api/sponsors/offers

Create a new offer (sponsor-specific).

**Request**:
```json
{
    "name": "VPN Service - 3 Months Free",
    "description": "Premium VPN service, 3 months free trial",
    "landingUrl": "https://sponsor.com/vpn-offer",
    "payout": 15.00,
    "expiresAt": "2026-06-30T23:59:59Z"
}
```

**Response**:
```json
{
    "success": true,
    "data": {
        "id": "offer-456",
        "trackingUrl": "https://yourdomain.com/track/click/SPONSOR456TOKEN"
    }
}
```

### POST /api/sponsors/leads

Submit a lead captured from email campaign.

**Request**:
```json
{
    "offerId": "offer-123",
    "email": "customer@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "metadata": {
        "campaignId": "summer-sale-2026",
        "clickedAt": "2026-02-03T20:15:00Z"
    }
}
```

**Response**:
```json
{
    "success": true,
    "data": {
        "leadId": "lead-789",
        "status": "accepted",
        "payout": 25.00
    }
}
```

### GET /api/sponsors/leads

Get leads for sponsor.

**Query Parameters**:
- `offerId` (optional): Filter by offer
- `status` (optional): Filter by status (pending, accepted, rejected)
- `from` (optional): Date range start
- `to` (optional): Date range end

**Response**:
```json
{
    "success": true,
    "data": [
        {
            "id": "lead-789",
            "offerId": "offer-123",
            "email": "customer@example.com",
            "status": "accepted",
            "payout": 25.00,
            "createdAt": "2026-02-03T20:15:00Z"
        }
    ],
    "totalPayout": 1250.00
}
```

## 4. Analytics API

### GET /api/analytics/overview

Get high-level analytics.

**Query Parameters**:
- `period`: `today`, `week`, `month`, `year`, or custom range
- `from` (optional): Custom range start
- `to` (optional): Custom range end

**Response**:
```json
{
    "success": true,
    "data": {
        "period": "week",
        "sent": 312456,
        "delivered": 310123,
        "bounced": 2333,
        "opens": 57834,
        "uniqueOpens": 45234,
        "clicks": 12456,
        "uniqueClicks": 9876,
        "unsubscribes": 234,
        "deliveryRate": 99.3,
        "openRate": 18.5,
        "clickRate": 4.2,
        "bounceRate": 0.7,
        "unsubscribeRate": 0.1
    }
}
```

### GET /api/analytics/campaigns/:id/timeline

Get campaign performance over time.

**Response**:
```json
{
    "success": true,
    "data": {
        "timeline": [
            {
                "timestamp": "2026-02-03T00:00:00Z",
                "sent": 1234,
                "opens": 187,
                "clicks": 42
            },
            {
                "timestamp": "2026-02-03T01:00:00Z",
                "sent": 1456,
                "opens": 223,
                "clicks": 51
            }
        ]
    }
}
```

### GET /api/analytics/accounts/:id

Get analytics for specific sender account.

**Response**:
```json
{
    "success": true,
    "data": {
        "accountEmail": "sender1@yourdomain.com",
        "sentThisWeek": 12345,
        "avgBounceRate": 1.2,
        "avgOpenRate": 19.3,
        "avgClickRate": 4.8,
        "performance": [
            {"date": "2026-02-03", "sent": 2000, "bounces": 23, "opens": 387, "clicks": 94}
        ]
    }
}
```

## 5. Queue Management API

### GET /api/queue/status

Get current queue status.

**Response**:
```json
{
    "success": true,
    "data": {
        "pending": 2543,
        "assigned": 123,
        "sending": 45,
        "failed": 12,
        "oldestPending": "2026-02-03T18:30:00Z",
        "estimatedCompletion": "2026-02-03T22:00:00Z"
    }
}
```

### POST /api/queue/clear

Clear failed emails from queue (admin only).

**Request**:
```json
{
    "status": "failed",
    "olderThan": "24h"
}
```

**Response**:
```json
{
    "success": true,
    "deleted": 234
}
```

## API Client Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const apiClient = axios.create({
    baseURL: 'https://yourdomain.com/api',
    headers: {
        'Authorization': `Bearer ${process.env.API_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

// Create campaign
async function createCampaign(campaignData) {
    try {
        const response = await apiClient.post('/campaigns', campaignData);
        console.log('Campaign created:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error:', error.response.data);
        throw error;
    }
}

// Get stats
async function getStats() {
    const response = await apiClient.get('/admin/stats');
    return response.data.data;
}
```

### Python

```python
import requests

class EmailPlatformClient:
    def __init__(self, base_url, api_token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {api_token}',
            'Content-Type': 'application/json'
        }
    
    def create_campaign(self, campaign_data):
        response = requests.post(
            f'{self.base_url}/campaigns',
            json=campaign_data,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def get_campaign_stats(self, campaign_id):
        response = requests.get(
            f'{self.base_url}/campaigns/{campaign_id}',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

# Usage
client = EmailPlatformClient('https://yourdomain.com/api', 'your_token')
stats = client.get_campaign_stats('summer-sale-2026')
print(f"Open rate: {stats['data']['stats']['openRate']}%")
```

### cURL

```bash
# Login
curl -X POST https://yourdomain.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"secure_password"}'

# Create campaign
curl -X POST https://yourdomain.com/api/campaigns \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @campaign.json

# Get stats
curl https://yourdomain.com/api/admin/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Error Handling

All errors follow this format:

```json
{
    "success": false,
    "error": "Error message here",
    "code": "ERROR_CODE",
    "details": { /* optional additional info */ }
}
```

**Common Error Codes**:
- `AUTHENTICATION_REQUIRED`: Missing or invalid token
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `INVALID_INPUT`: Validation failed
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

**HTTP Status Codes**:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

## Webhooks (Optional)

Send real-time notifications to external systems.

### Configuration

```json
{
    "webhooks": [
        {
            "url": "https://yourapp.com/webhook",
            "events": ["email.sent", "email.bounced", "email.opened", "email.clicked"],
            "secret": "webhook_secret_key"
        }
    ]
}
```

### Payload Example

```json
{
    "event": "email.opened",
    "timestamp": "2026-02-03T20:30:00Z",
    "data": {
        "campaignId": "summer-sale-2026",
        "recipientEmail": "user@example.com",
        "trackingToken": "ABC123TOKEN"
    },
    "signature": "sha256=..." // HMAC signature for verification
}
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-03  
**Author**: Principal Backend Architect
