# Production-Grade Email Delivery Platform Architecture

## Overview

This document describes the architecture of a horizontally scalable, production-grade email delivery platform built on top of the existing GAdmin-Toolkit. The system is designed to send high volumes of emails safely while protecting sender accounts from bans and maintaining excellent deliverability.

## Core Principles

1. **Horizontal Scaling**: Scale by adding sender accounts, not by increasing per-account volume
2. **1 Worker = 1 Account**: Each worker process manages exactly one Gmail/SMTP account
3. **Account Protection**: Strict per-account limits with automatic enforcement
4. **No Monolithic Scripts**: Distributed architecture with independent workers
5. **Dynamic Configuration**: All limits and settings configurable at runtime
6. **Interchangeable Backends**: Support both Gmail API and generic SMTP

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Load Balancer                          │
│                     (Optional: nginx/ALB)                       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────────┐
│                     Main Application Server                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Express.js API Layer                       │   │
│  │  • Admin Dashboard API                                  │   │
│  │  • Sponsor Integration API                              │   │
│  │  • Tracking Endpoints (pixel, clicks, unsubscribe)      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Worker Orchestrator                        │   │
│  │  • Manages worker lifecycle                             │   │
│  │  • Monitors worker health                               │   │
│  │  • Enforces account limits                              │   │
│  │  • Handles worker failures                              │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
┌───────────▼───┐  ┌────────▼───────┐  ┌──▼──────────────┐
│ Send Worker 1 │  │ Send Worker 2  │  │ Send Worker N   │
│ (Account 1)   │  │ (Account 2)    │  │ (Account N)     │
│               │  │                │  │                 │
│ • Fetch batch │  │ • Fetch batch  │  │ • Fetch batch   │
│ • Send emails │  │ • Send emails  │  │ • Send emails   │
│ • Log results │  │ • Log results  │  │ • Log results   │
│ • Enforce     │  │ • Enforce      │  │ • Enforce       │
│   limits      │  │   limits       │  │   limits        │
│ • Handle      │  │ • Handle       │  │ • Handle        │
│   retries     │  │   retries      │  │   retries       │
└───────┬───────┘  └────────┬───────┘  └──┬──────────────┘
        │                   │              │
        └───────────────────┼──────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                    PostgreSQL Database                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ sender_accounts  │  │   email_queue    │  │  send_logs   │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │  bounce_list     │  │ unsubscribe_list │  │ open_events  │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│  ┌──────────────────┐                                          │
│  │  click_events    │                                          │
│  └──────────────────┘                                          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              External Services                                   │
│  • Gmail API                                                    │
│  • SMTP Servers                                                 │
│  • Sponsor APIs                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Descriptions

### 1. Main Application Server

**Purpose**: Central orchestrator and API gateway

**Responsibilities**:
- Host Express.js REST API
- Manage worker lifecycle (spawn, monitor, restart)
- Handle tracking requests (opens, clicks, unsubscribes)
- Provide admin dashboard
- Integrate with sponsor APIs
- Enforce global rate limits

**Technologies**:
- Node.js + Express.js
- PM2 for process management
- JWT for authentication

### 2. Send Workers

**Purpose**: Independent email sending units, one per sender account

**Responsibilities**:
- Fetch assigned batch from queue
- Authenticate with Gmail API or SMTP
- Send emails with rate limiting
- Log all send attempts
- Handle retries with exponential backoff
- Update daily counters
- Auto-pause on errors/limits

**Key Characteristics**:
- Each worker is an isolated process
- Maintains own session/auth for one account
- Never sends from multiple accounts
- Exits when batch complete or limit reached
- Can run on same or different machines

**Technologies**:
- Node.js worker processes
- Google APIs (for Gmail)
- Nodemailer (for SMTP)

### 3. Worker Orchestrator

**Purpose**: Manage the lifecycle of send workers

**Responsibilities**:
- Read sender_accounts table
- Spawn one worker per active account
- Monitor worker health and status
- Restart failed workers
- Enforce daily limits before spawning
- Distribute email batches across workers
- Collect and aggregate worker logs

**Key Logic**:
```
FOR EACH account IN sender_accounts WHERE status = 'active':
  IF account.daily_sent < account.daily_limit:
    IF no worker running for account:
      Spawn worker with account credentials
  ELSE:
    Mark account as 'paused_limit_reached'
    
Monitor workers every 30 seconds
Restart crashed workers (max 3 retries)
```

### 4. Database (PostgreSQL)

**Purpose**: Central data store for all email operations

**Why PostgreSQL**:
- ACID compliance for transactional integrity
- Excellent indexing for millions of rows
- Supports JSON fields for flexibility
- Mature, battle-tested, open-source
- Good performance with proper indexes

**Key Tables** (see DATABASE_SCHEMA.md for full details):
- `sender_accounts`: Email accounts and their limits
- `email_queue`: Pending emails to send
- `send_logs`: Complete send history
- `bounce_list`, `unsubscribe_list`: Suppression lists
- `open_events`, `click_events`: Engagement tracking

### 5. Tracking System

**Purpose**: Monitor email engagement and handle user actions

**Components**:

#### Open Tracking
- Embeds 1x1 transparent pixel in emails
- URL format: `https://yourdomain.com/track/open/{unique_token}`
- Logs timestamp, recipient, campaign on pixel load
- Returns 1x1 GIF immediately

#### Click Tracking
- Rewrites all links in email body
- URL format: `https://yourdomain.com/track/click/{unique_token}`
- Logs click event then redirects to real URL
- Protects against malicious redirects

#### Unsubscribe
- One-click unsubscribe link (RFC 8058 compliant)
- URL format: `https://yourdomain.com/unsubscribe/{unique_token}`
- Immediately adds to unsubscribe_list
- Shows confirmation page

#### Bounce Processing
- Workers poll Gmail API for bounce messages
- Parse bounce notifications
- Add to bounce_list with reason
- Auto-pause accounts with high bounce rate

### 6. Sponsor Integration

**Security Model**: Sponsors are isolated from the sending infrastructure

**API Endpoints**:
- `GET /api/sponsors/offers` - Fetch available offers
- `POST /api/sponsors/leads` - Submit captured leads
- Authentication via API keys

**Lead Submission Flow**:
```
1. User clicks tracked link in email
2. Redirects to landing page
3. User fills form
4. Form posts to /api/sponsors/leads
5. System validates and forwards to sponsor
6. Returns success/error to user
```

## Scaling Strategy

### Horizontal Scaling

**Adding More Capacity**:
1. Create new Gmail/SMTP accounts via Admin SDK
2. Add accounts to `sender_accounts` table with `status='active'`
3. Orchestrator automatically spawns workers for new accounts
4. Each new account = +X emails/day (X = daily_limit)

**Example**:
- 10 accounts @ 2,000/day = 20,000 emails/day
- 100 accounts @ 2,000/day = 200,000 emails/day
- 1,000 accounts @ 2,000/day = 2,000,000 emails/day

### Vertical Scaling (Same Machine)

**PM2 Cluster Mode**:
- Run multiple instances of main application
- Load balance API requests
- Workers distributed across CPU cores
- Database connection pooling

**Limits**:
- One EC2 instance can handle ~100-200 workers efficiently
- Beyond that, use multiple EC2 instances

### Multi-Machine Scaling

**Architecture**:
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   EC2 Instance 1│     │  EC2 Instance 2 │     │  EC2 Instance 3 │
│  (50 workers)   │────▶│   (50 workers)  │────▶│  (50 workers)   │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                     ┌───────────▼────────────┐
                     │  PostgreSQL Database   │
                     │  (RDS or self-hosted)  │
                     └────────────────────────┘
```

**How It Works**:
- All instances connect to same PostgreSQL database
- Email queue uses `SELECT ... FOR UPDATE SKIP LOCKED` to prevent duplicates
- Workers claim batches atomically
- No coordination needed between instances

## Failure Isolation

### Worker Failures

**Problem**: Worker crashes during sending

**Solution**:
1. Orchestrator detects crash via process monitoring
2. Marks incomplete emails in queue as `status='pending'`
3. Spawns new worker for the account
4. New worker picks up where old one left off
5. Max 3 restart attempts per account per hour

### Account Failures

**Problem**: Gmail/SMTP account banned or suspended

**Solution**:
1. Worker detects auth failure
2. Updates account status to `'suspended'`
3. Logs reason and timestamp
4. Orchestrator stops spawning workers for that account
5. Admin receives alert
6. System continues with remaining active accounts

### Database Failures

**Problem**: PostgreSQL connection lost

**Solution**:
1. Use connection pooling with retry logic
2. Workers queue operations in memory temporarily
3. Flush to DB when connection restored
4. Use write-ahead logging for durability
5. Automated backups every 6 hours

### Rate Limit Exceeded

**Problem**: Account hits daily limit

**Solution**:
1. Worker tracks sends in-memory and in DB
2. Before each send, checks: `daily_sent < daily_limit`
3. If limit reached, update status to `'paused_limit_reached'`
4. Worker exits gracefully
5. Cron job resets counters at midnight UTC
6. Orchestrator auto-resumes account next day

## Deployment Options

### AWS EC2

**Recommended Instance**: t3.medium or larger
- 2 vCPUs, 4 GB RAM minimum
- Ubuntu 20.04 LTS or Amazon Linux 2
- EBS storage with GP3 volumes
- Security group: Allow 443, 22, 5432

**Setup**:
1. Launch EC2 instance
2. Install Node.js 18+, PostgreSQL 14+
3. Clone repository
4. Set environment variables
5. Run database migrations
6. Start PM2: `pm2 start ecosystem.config.js`
7. Configure nginx as reverse proxy

### Azure VM

**Recommended SKU**: Standard_B2s or larger
- Similar specs to AWS t3.medium
- Ubuntu 20.04 LTS
- Managed PostgreSQL recommended

**Setup**: (Same as AWS EC2)

### Docker (Optional)

**Benefits**:
- Consistent environments
- Easy to replicate
- Portable across clouds

**Containers**:
1. `app-server`: Main application + orchestrator
2. `send-worker`: Worker template (scaled via PM2)
3. `postgres`: Database (or use managed service)

## Security Considerations

### Authentication

- Gmail API: Service account with domain-wide delegation
- SMTP: Encrypted credentials stored in database
- API: JWT tokens with short expiration
- Admin: OAuth 2.0 + MFA

### Encryption

- TLS 1.3 for all external communication
- Database credentials encrypted at rest (AWS KMS or similar)
- Environment variables for secrets (never commit to git)

### Network

- Private subnet for database
- Public subnet for application server
- Security groups/NSGs restricting access
- WAF for API endpoints (optional)

### Compliance

- GDPR: Honor unsubscribe immediately
- CAN-SPAM: Include physical address, unsubscribe link
- CCPA: Allow data deletion requests
- Logging: Retain for 90 days, then archive

## Monitoring & Alerting

### Metrics to Track

1. **Sending Metrics**:
   - Emails sent per hour/day
   - Bounce rate per account
   - Retry rate
   - Delivery rate

2. **Performance Metrics**:
   - API response times
   - Database query times
   - Worker uptime
   - Queue depth

3. **Health Metrics**:
   - Active accounts
   - Suspended accounts
   - Failed authentication attempts
   - Error rates

### Alerting Rules

- Alert if bounce rate > 5% for any account
- Alert if account suspended
- Alert if queue depth > 10,000
- Alert if database CPU > 80%
- Alert if any worker restarts > 3 times/hour

### Tools

- **Monitoring**: Prometheus + Grafana, or AWS CloudWatch
- **Logging**: Winston (Node.js) + ELK Stack or CloudWatch Logs
- **Alerting**: PagerDuty or SNS

## Configuration Management

All configuration is dynamic and loaded from database or environment variables:

**Environment Variables** (`.env`):
```
DATABASE_URL=postgresql://user:pass@localhost/emaildb
JWT_SECRET=your-secret-key
GMAIL_SERVICE_ACCOUNT_PATH=/path/to/cred.json
BASE_URL=https://yourdomain.com
SMTP_POOL_MAX=5
```

**Database Configuration** (per account):
```
sender_accounts:
  - daily_limit: 2000
  - batch_size: 50
  - send_delay_ms: 100
  - auth_type: 'gmail' or 'smtp'
```

**Global Configuration** (`config/default.json`):
```json
{
  "workers": {
    "maxRestarts": 3,
    "restartDelay": 5000,
    "healthCheckInterval": 30000
  },
  "queue": {
    "batchSize": 50,
    "retryAttempts": 3,
    "retryBackoff": [60000, 300000, 900000]
  },
  "tracking": {
    "openPixelEnabled": true,
    "clickTrackingEnabled": true
  }
}
```

## Next Steps

See the implementation plan in the PR description for detailed steps to build this system.

**Priority Order**:
1. Database schema and migrations
2. Core worker implementation
3. Orchestrator and worker management
4. Tracking endpoints
5. Admin API
6. Sponsor integration
7. Deployment and monitoring

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-03  
**Author**: Principal Backend Architect
