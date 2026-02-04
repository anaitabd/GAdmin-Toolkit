# Database Schema Design

## Overview

This document describes the PostgreSQL database schema for the production-grade email delivery platform. The schema is designed for:
- **High write throughput**: Millions of send logs per day
- **Fast reads**: Indexed queries for dashboards and reports
- **Data integrity**: Foreign keys and constraints
- **Scalability**: Partitioning strategy for large tables

## Database Selection: PostgreSQL

**Why PostgreSQL**:
- ACID transactions prevent duplicate sends
- Row-level locking with `FOR UPDATE SKIP LOCKED` for queue management
- Excellent indexing (B-tree, GIN, GIST)
- JSON support for flexible metadata
- Mature replication and backup tools
- Open source and cost-effective

## Tables

### 1. sender_accounts

Stores email accounts used for sending, their credentials, limits, and current status.

```sql
CREATE TABLE sender_accounts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    auth_type VARCHAR(20) NOT NULL CHECK (auth_type IN ('gmail', 'smtp')),
    
    -- Gmail API specific
    gmail_subject_email VARCHAR(255), -- User to impersonate
    
    -- SMTP specific
    smtp_host VARCHAR(255),
    smtp_port INTEGER,
    smtp_username VARCHAR(255),
    smtp_password_encrypted TEXT, -- Encrypted with KMS
    smtp_use_tls BOOLEAN DEFAULT true,
    
    -- Limits and configuration
    daily_limit INTEGER NOT NULL DEFAULT 2000,
    batch_size INTEGER NOT NULL DEFAULT 50,
    send_delay_ms INTEGER NOT NULL DEFAULT 100, -- Delay between emails
    
    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'paused', 'suspended', 'warming_up', 'paused_limit_reached')),
    daily_sent INTEGER NOT NULL DEFAULT 0,
    daily_bounces INTEGER NOT NULL DEFAULT 0,
    daily_errors INTEGER NOT NULL DEFAULT 0,
    last_reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Warm-up schedule
    warmup_stage INTEGER DEFAULT 0, -- 0 = no warmup, 1-5 = stages
    warmup_current_limit INTEGER,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    notes TEXT
);

-- Indexes
CREATE INDEX idx_sender_accounts_status ON sender_accounts(status);
CREATE INDEX idx_sender_accounts_auth_type ON sender_accounts(auth_type);
CREATE INDEX idx_sender_accounts_daily_limit ON sender_accounts(status, daily_sent, daily_limit);
```

**Key Fields Explained**:

- `auth_type`: `'gmail'` for Gmail API, `'smtp'` for generic SMTP
- `daily_limit`: Maximum emails this account can send per day
- `batch_size`: How many emails to send before checking for bounces/errors
- `send_delay_ms`: Milliseconds to wait between sends (rate limiting)
- `status`:
  - `active`: Ready to send
  - `paused`: Manually paused by admin
  - `suspended`: Auth failed or account banned
  - `warming_up`: In warm-up phase
  - `paused_limit_reached`: Hit daily limit, will auto-resume tomorrow
- `daily_sent`, `daily_bounces`, `daily_errors`: Counters reset at midnight UTC
- `warmup_stage`: Tracks warm-up progress (0 = done, 1-5 = stages)

**Why One Table for Both Gmail and SMTP**:
- Unified worker interface
- Easy to switch between providers
- Simplified orchestrator logic
- NULL columns for unused fields are fine (low overhead)

### 2. email_queue

Pending emails waiting to be sent. Workers fetch batches atomically.

```sql
CREATE TABLE email_queue (
    id BIGSERIAL PRIMARY KEY,
    
    -- Recipient
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    
    -- Email content
    subject VARCHAR(500) NOT NULL,
    html_body TEXT NOT NULL,
    text_body TEXT, -- Plain text version
    
    -- Metadata
    campaign_id VARCHAR(100), -- Optional: group related emails
    tracking_token VARCHAR(100) UNIQUE, -- For opens/clicks
    custom_data JSONB, -- Flexible metadata (merge tags, etc.)
    
    -- Queue management
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'assigned', 'sent', 'failed', 'cancelled')),
    assigned_to INTEGER REFERENCES sender_accounts(id),
    assigned_at TIMESTAMP,
    
    -- Retry logic
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    next_retry_at TIMESTAMP,
    last_error TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP
);

-- Indexes for queue operations
CREATE INDEX idx_email_queue_status_next_retry 
    ON email_queue(status, next_retry_at) 
    WHERE status = 'pending';
    
CREATE INDEX idx_email_queue_assigned 
    ON email_queue(assigned_to, status);
    
CREATE INDEX idx_email_queue_campaign 
    ON email_queue(campaign_id);
    
CREATE INDEX idx_email_queue_tracking_token 
    ON email_queue(tracking_token);

-- Partial index for pending emails (most common query)
CREATE INDEX idx_email_queue_pending 
    ON email_queue(created_at) 
    WHERE status = 'pending' AND (next_retry_at IS NULL OR next_retry_at <= NOW());
```

**Atomic Batch Fetching**:

Workers use `SELECT ... FOR UPDATE SKIP LOCKED` to claim batches:

```sql
WITH batch AS (
    SELECT id
    FROM email_queue
    WHERE status = 'pending'
      AND (next_retry_at IS NULL OR next_retry_at <= NOW())
    ORDER BY created_at ASC
    LIMIT 50
    FOR UPDATE SKIP LOCKED
)
UPDATE email_queue
SET status = 'assigned',
    assigned_to = <worker_account_id>,
    assigned_at = NOW()
WHERE id IN (SELECT id FROM batch)
RETURNING *;
```

This prevents duplicate sends even with multiple workers.

### 3. send_logs

Complete history of all send attempts. Used for analytics and debugging.

```sql
CREATE TABLE send_logs (
    id BIGSERIAL PRIMARY KEY,
    
    -- References
    sender_account_id INTEGER REFERENCES sender_accounts(id),
    email_queue_id BIGINT REFERENCES email_queue(id),
    campaign_id VARCHAR(100),
    
    -- Recipient
    recipient_email VARCHAR(255) NOT NULL,
    
    -- Result
    status VARCHAR(20) NOT NULL 
        CHECK (status IN ('sent', 'failed', 'bounced', 'rejected')),
    message_id VARCHAR(255), -- From Gmail/SMTP response
    error_message TEXT,
    error_code VARCHAR(50),
    
    -- Timing
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    response_time_ms INTEGER, -- How long send took
    
    -- Metadata
    retry_attempt INTEGER DEFAULT 0,
    custom_data JSONB
);

-- Partition by month for scalability
CREATE TABLE send_logs_2026_02 PARTITION OF send_logs
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
    
-- Add partitions for future months via cron job

-- Indexes
CREATE INDEX idx_send_logs_sender_account 
    ON send_logs(sender_account_id, sent_at DESC);
    
CREATE INDEX idx_send_logs_campaign 
    ON send_logs(campaign_id, sent_at DESC);
    
CREATE INDEX idx_send_logs_recipient 
    ON send_logs(recipient_email);
    
CREATE INDEX idx_send_logs_status 
    ON send_logs(status, sent_at DESC);
```

**Partitioning Strategy**:

- Partition by month to keep table sizes manageable
- Old partitions can be archived to S3 after 90 days
- Queries with date filters hit only relevant partitions
- INSERT performance remains constant as table grows

### 4. bounce_list

Emails that bounced (hard or soft). Used for suppression.

```sql
CREATE TABLE bounce_list (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    
    -- Bounce details
    bounce_type VARCHAR(20) NOT NULL CHECK (bounce_type IN ('hard', 'soft', 'complaint')),
    bounce_reason TEXT,
    bounce_code VARCHAR(50),
    
    -- Source
    sender_account_id INTEGER REFERENCES sender_accounts(id),
    campaign_id VARCHAR(100),
    
    -- Timestamps
    first_bounced_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_bounced_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    bounce_count INTEGER NOT NULL DEFAULT 1
);

-- Indexes
CREATE UNIQUE INDEX idx_bounce_list_email ON bounce_list(email);
CREATE INDEX idx_bounce_list_type ON bounce_list(bounce_type);
```

**Bounce Types**:
- `hard`: Permanent failure (invalid email, domain doesn't exist)
- `soft`: Temporary failure (mailbox full, server down)
- `complaint`: Recipient marked as spam

**Suppression Logic**:
- Check this table before adding to queue
- Soft bounces: Retry after 24 hours (max 3 times)
- Hard bounces: Never retry
- Complaints: Never retry + notify admin

### 5. unsubscribe_list

Users who opted out. Must be honored immediately.

```sql
CREATE TABLE unsubscribe_list (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    
    -- Unsubscribe details
    unsubscribe_reason VARCHAR(100),
    campaign_id VARCHAR(100), -- Which campaign they unsubscribed from
    user_agent TEXT,
    ip_address INET,
    
    -- Timestamps
    unsubscribed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX idx_unsubscribe_list_email ON unsubscribe_list(email);
CREATE INDEX idx_unsubscribe_list_campaign ON unsubscribe_list(campaign_id);
```

**One-Click Unsubscribe**:
- RFC 8058 compliant
- Link format: `https://yourdomain.com/unsubscribe/{token}`
- No login required
- Immediate suppression (before showing confirmation page)

### 6. open_events

Tracks email opens via tracking pixel.

```sql
CREATE TABLE open_events (
    id BIGSERIAL PRIMARY KEY,
    
    -- References
    email_queue_id BIGINT REFERENCES email_queue(id),
    tracking_token VARCHAR(100) NOT NULL,
    campaign_id VARCHAR(100),
    recipient_email VARCHAR(255),
    
    -- Open details
    opened_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    
    -- Geolocation (optional)
    country VARCHAR(2),
    city VARCHAR(100)
);

-- Partition by month
CREATE TABLE open_events_2026_02 PARTITION OF open_events
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Indexes
CREATE INDEX idx_open_events_token ON open_events(tracking_token);
CREATE INDEX idx_open_events_campaign ON open_events(campaign_id, opened_at DESC);
CREATE INDEX idx_open_events_email ON open_events(recipient_email);
```

**Why Separate Table Instead of Boolean in send_logs**:
- Multiple opens per email (user opens email 3 times)
- Track when each open occurred
- Capture IP/user agent for each open
- Better analytics (open rate over time)
- Smaller primary table (send_logs)

### 7. click_events

Tracks link clicks in emails.

```sql
CREATE TABLE click_events (
    id BIGSERIAL PRIMARY KEY,
    
    -- References
    email_queue_id BIGINT REFERENCES email_queue(id),
    tracking_token VARCHAR(100) NOT NULL,
    campaign_id VARCHAR(100),
    recipient_email VARCHAR(255),
    
    -- Click details
    link_url TEXT NOT NULL, -- Original URL
    clicked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    
    -- Geolocation (optional)
    country VARCHAR(2),
    city VARCHAR(100)
);

-- Partition by month
CREATE TABLE click_events_2026_02 PARTITION OF click_events
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Indexes
CREATE INDEX idx_click_events_token ON click_events(tracking_token);
CREATE INDEX idx_click_events_campaign ON click_events(campaign_id, clicked_at DESC);
CREATE INDEX idx_click_events_email ON click_events(recipient_email);
CREATE INDEX idx_click_events_url ON click_events(link_url(100)); -- Prefix index for long URLs
```

**Click Tracking Flow**:
1. Replace `<a href="https://example.com">` with `<a href="https://yourdomain.com/track/click/{token}?url=https://example.com">`
2. User clicks link
3. Server logs click event
4. Server redirects to original URL
5. Protects against open redirects (whitelist domains)

## Indexing Strategy

### Why These Indexes?

1. **Queue Processing**: `idx_email_queue_pending` optimizes worker batch fetching
2. **Campaign Analytics**: `idx_send_logs_campaign`, `idx_open_events_campaign`, `idx_click_events_campaign`
3. **Suppression Checks**: Unique indexes on bounce_list and unsubscribe_list for O(1) lookups
4. **Account Monitoring**: `idx_sender_accounts_daily_limit` for limit enforcement
5. **Tracking**: Token indexes for fast pixel/click handling

### Partial Indexes

Used to index only relevant rows (e.g., `WHERE status = 'pending'`):
- Smaller index size
- Faster updates (unchanged rows don't update index)
- Better query planner decisions

### GIN Indexes for JSONB

If querying custom_data frequently:

```sql
CREATE INDEX idx_email_queue_custom_data ON email_queue USING GIN (custom_data);
```

Allows queries like:
```sql
SELECT * FROM email_queue WHERE custom_data @> '{"merge_tag": "value"}';
```

## Write Performance at Scale

### Challenges

With 1M+ emails/day:
- `send_logs`: ~1M inserts/day (11 inserts/sec)
- `open_events`: ~300K inserts/day (3 opens/sec)
- `click_events`: ~100K inserts/day (1 click/sec)

### Solutions

1. **Partitioning**: Monthly partitions keep tables small
2. **Batch Inserts**: Workers buffer logs and insert in batches of 100
3. **Async Logging**: Workers don't wait for log insert to complete
4. **Prepared Statements**: Reduce query parsing overhead
5. **Connection Pooling**: Reuse DB connections (pg-pool with 20 connections)
6. **UNLOGGED Tables** (optional): For non-critical logs, disable WAL

### Keeping Writes Fast

- Indexes are expensive on INSERT
- Only index columns used in WHERE/JOIN/ORDER BY
- Use partial indexes when possible
- Archive old data to reduce table size
- Monitor index bloat and REINDEX if needed

## Data Retention

### Policy

- `send_logs`: Keep 90 days, archive to S3, delete after 1 year
- `open_events`, `click_events`: Keep 90 days, delete after 1 year
- `email_queue`: Delete sent/failed emails after 7 days
- `bounce_list`, `unsubscribe_list`: Keep forever (compliance)
- `sender_accounts`: Keep forever

### Archival Script (Cron Job)

```sql
-- Archive old send_logs
COPY (
    SELECT * FROM send_logs 
    WHERE sent_at < NOW() - INTERVAL '90 days'
) TO '/backups/send_logs_archive_2026_01.csv' WITH CSV HEADER;

-- Delete archived data
DELETE FROM send_logs WHERE sent_at < NOW() - INTERVAL '90 days';

-- Vacuum to reclaim space
VACUUM FULL send_logs;
```

Run monthly via cron.

## Database Migrations

Use a migration tool like `node-pg-migrate` or Flyway:

```
migrations/
  001_create_sender_accounts.sql
  002_create_email_queue.sql
  003_create_send_logs.sql
  004_create_bounce_list.sql
  005_create_unsubscribe_list.sql
  006_create_open_events.sql
  007_create_click_events.sql
  008_add_partitions_feb_2026.sql
  009_add_warmup_fields.sql
```

Apply with:
```bash
npm run migrate
```

## Connection String

```
DATABASE_URL=postgresql://username:password@hostname:5432/emaildb?sslmode=require&pool_max=20
```

## Backup Strategy

1. **Automated Backups**: AWS RDS automated backups (point-in-time recovery)
2. **Manual Snapshots**: Before schema changes
3. **Logical Dumps**: Weekly `pg_dump` to S3
4. **Replication**: Read replica for analytics queries

## Security

- Encrypt `smtp_password_encrypted` with AWS KMS or similar
- Use IAM roles for RDS access (no hardcoded passwords)
- Restrict database access to application subnet only
- Enable SSL/TLS for all connections
- Audit log for sensitive operations

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-03  
**Author**: Principal Backend Architect
