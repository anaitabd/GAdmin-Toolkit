# Worker Design Document

## Overview

This document describes the design of send workers - the core components responsible for actually sending emails. Each worker is an independent Node.js process that manages exactly one sender account.

## Core Principle: 1 Worker = 1 Account

**Why this design**:
- **Account isolation**: Ban on one account doesn't affect others
- **Independent rate limiting**: Each worker enforces its own limits
- **Simplified auth**: Worker maintains single session
- **Failure isolation**: Crashed worker only impacts one account
- **Horizontal scaling**: Add workers = add capacity

**What this means**:
- Worker NEVER sends from multiple accounts
- Worker NEVER runs multiple batches concurrently
- Worker is strictly sequential: fetch → send → log → repeat
- Multiple workers run in parallel (managed by orchestrator)

## Worker Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    Worker Start                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Load Configuration                                      │
│     • Read account from database                            │
│     • Load daily_limit, batch_size, send_delay             │
│     • Check status (must be 'active')                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Authenticate                                            │
│     • Gmail API: JWT with domain-wide delegation            │
│     • SMTP: Login with username/password                   │
│     • If auth fails: Mark account 'suspended' and exit      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Check Daily Limit                                       │
│     • Query: daily_sent < daily_limit?                      │
│     • If limit reached: Update status and exit              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Fetch Batch from Queue                                  │
│     • SELECT ... FOR UPDATE SKIP LOCKED                     │
│     • Batch size: min(batch_size, daily_limit - daily_sent) │
│     • Mark as 'assigned' to this account                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Send Emails (Sequential Loop)                           │
│     • For each email in batch:                              │
│       - Send email via Gmail API or SMTP                    │
│       - Wait send_delay_ms milliseconds                     │
│       - Log result to send_logs                             │
│       - Increment daily_sent counter                        │
│       - Handle errors with retry logic                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  6. Post-Batch Actions                                      │
│     • Check bounce rate: daily_bounces / daily_sent         │
│     • If bounce_rate > 5%: Pause account                    │
│     • Update sender_accounts table                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
                  ┌──┴──┐
                  │ More│
                  │work?│
                  └──┬──┘
                     │
          ┌──────────┴──────────┐
          │                     │
         Yes                   No
          │                     │
          │                     ▼
          │            ┌────────────────┐
          │            │  Exit Worker   │
          │            └────────────────┘
          │
          └─────────────► (Back to step 3)
```

## Pseudocode: sendWorker.js

```javascript
// Import dependencies
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const db = require('../db/connection');
const config = require('../config');

// Worker entry point
async function main(accountId) {
    console.log(`[Worker ${accountId}] Starting...`);
    
    // 1. Load account configuration
    const account = await loadAccount(accountId);
    if (!account || account.status !== 'active') {
        console.log(`[Worker ${accountId}] Account not active, exiting`);
        return;
    }
    
    // 2. Authenticate
    let client;
    try {
        client = await authenticate(account);
    } catch (error) {
        console.error(`[Worker ${accountId}] Auth failed:`, error);
        await markAccountSuspended(accountId, error.message);
        return;
    }
    
    // 3. Main work loop
    while (true) {
        // Check daily limit
        const currentStats = await getAccountStats(accountId);
        if (currentStats.daily_sent >= account.daily_limit) {
            console.log(`[Worker ${accountId}] Daily limit reached`);
            await updateAccountStatus(accountId, 'paused_limit_reached');
            break;
        }
        
        // Fetch batch
        const remainingQuota = account.daily_limit - currentStats.daily_sent;
        const batchSize = Math.min(account.batch_size, remainingQuota);
        
        const batch = await fetchBatch(accountId, batchSize);
        if (batch.length === 0) {
            console.log(`[Worker ${accountId}] No more work, exiting`);
            break;
        }
        
        console.log(`[Worker ${accountId}] Processing batch of ${batch.length} emails`);
        
        // Send emails sequentially
        let successCount = 0;
        let failCount = 0;
        let bounceCount = 0;
        
        for (const email of batch) {
            try {
                const result = await sendEmail(client, account, email);
                
                if (result.success) {
                    successCount++;
                    await logSuccess(accountId, email, result);
                    await markEmailSent(email.id);
                } else if (result.bounce) {
                    bounceCount++;
                    await logBounce(accountId, email, result);
                    await addToBounceList(email.recipient_email, result.reason);
                } else {
                    failCount++;
                    await logFailure(accountId, email, result);
                    await scheduleRetry(email.id, result.error);
                }
                
                // Increment counter
                await incrementDailySent(accountId);
                
                // Rate limiting: wait before next send
                await sleep(account.send_delay_ms);
                
            } catch (error) {
                console.error(`[Worker ${accountId}] Error sending email:`, error);
                failCount++;
                await logFailure(accountId, email, { error: error.message });
                await scheduleRetry(email.id, error.message);
            }
        }
        
        console.log(`[Worker ${accountId}] Batch complete: ${successCount} sent, ${failCount} failed, ${bounceCount} bounced`);
        
        // Check bounce rate
        const stats = await getAccountStats(accountId);
        const bounceRate = stats.daily_sent > 0 ? stats.daily_bounces / stats.daily_sent : 0;
        
        if (bounceRate > 0.05) { // 5% threshold
            console.warn(`[Worker ${accountId}] High bounce rate (${(bounceRate * 100).toFixed(2)}%), pausing account`);
            await updateAccountStatus(accountId, 'paused');
            break;
        }
        
        // Update last_used_at
        await updateLastUsed(accountId);
    }
    
    console.log(`[Worker ${accountId}] Exiting`);
}

// Load account from database
async function loadAccount(accountId) {
    const result = await db.query(
        'SELECT * FROM sender_accounts WHERE id = $1',
        [accountId]
    );
    return result.rows[0];
}

// Authenticate with Gmail API or SMTP
async function authenticate(account) {
    if (account.auth_type === 'gmail') {
        // Gmail API authentication
        const privateKey = require(config.GMAIL_SERVICE_ACCOUNT_PATH);
        const jwtClient = new google.auth.JWT(
            privateKey.client_email,
            null,
            privateKey.private_key,
            ['https://mail.google.com/'],
            account.gmail_subject_email || account.email
        );
        
        await jwtClient.authorize();
        return { type: 'gmail', client: jwtClient };
        
    } else if (account.auth_type === 'smtp') {
        // SMTP authentication
        const transporter = nodemailer.createTransport({
            host: account.smtp_host,
            port: account.smtp_port,
            secure: account.smtp_use_tls,
            auth: {
                user: account.smtp_username,
                pass: decryptPassword(account.smtp_password_encrypted)
            },
            pool: false // No connection pooling per worker
        });
        
        await transporter.verify();
        return { type: 'smtp', client: transporter };
        
    } else {
        throw new Error(`Unknown auth_type: ${account.auth_type}`);
    }
}

// Fetch batch from queue (atomic operation)
async function fetchBatch(accountId, batchSize) {
    const result = await db.query(`
        WITH batch AS (
            SELECT id
            FROM email_queue
            WHERE status = 'pending'
              AND (next_retry_at IS NULL OR next_retry_at <= NOW())
              AND recipient_email NOT IN (SELECT email FROM bounce_list WHERE bounce_type = 'hard')
              AND recipient_email NOT IN (SELECT email FROM unsubscribe_list)
            ORDER BY created_at ASC
            LIMIT $1
            FOR UPDATE SKIP LOCKED
        )
        UPDATE email_queue
        SET status = 'assigned',
            assigned_to = $2,
            assigned_at = NOW()
        WHERE id IN (SELECT id FROM batch)
        RETURNING *
    `, [batchSize, accountId]);
    
    return result.rows;
}

// Send email via Gmail API
async function sendEmailGmail(jwtClient, account, email) {
    const raw = createMimeMessage(account.email, email);
    
    const url = 'https://www.googleapis.com/gmail/v1/users/me/messages/send';
    const response = await axios.post(url, { raw }, {
        headers: {
            'Authorization': `Bearer ${(await jwtClient.getAccessToken()).token}`,
            'Content-Type': 'application/json'
        }
    });
    
    return {
        success: true,
        messageId: response.data.id
    };
}

// Send email via SMTP
async function sendEmailSMTP(transporter, account, email) {
    const mailOptions = {
        from: `"${account.display_name}" <${account.email}>`,
        to: email.recipient_email,
        subject: email.subject,
        html: email.html_body,
        text: email.text_body
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    return {
        success: true,
        messageId: info.messageId
    };
}

// Main send function with error handling
async function sendEmail(client, account, email) {
    const startTime = Date.now();
    
    try {
        let result;
        
        if (client.type === 'gmail') {
            result = await sendEmailGmail(client.client, account, email);
        } else if (client.type === 'smtp') {
            result = await sendEmailSMTP(client.client, account, email);
        }
        
        result.responseTimeMs = Date.now() - startTime;
        return result;
        
    } catch (error) {
        // Classify error
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('mailbox not found') || 
            errorMessage.includes('user unknown') ||
            errorMessage.includes('550')) {
            // Hard bounce
            return {
                success: false,
                bounce: true,
                bounceType: 'hard',
                reason: error.message
            };
        }
        
        if (errorMessage.includes('mailbox full') ||
            errorMessage.includes('421') ||
            errorMessage.includes('temporarily unavailable')) {
            // Soft bounce
            return {
                success: false,
                bounce: true,
                bounceType: 'soft',
                reason: error.message
            };
        }
        
        // Other error (retry later)
        return {
            success: false,
            bounce: false,
            error: error.message
        };
    }
}

// Helper functions for database operations
async function incrementDailySent(accountId) {
    await db.query(
        'UPDATE sender_accounts SET daily_sent = daily_sent + 1, updated_at = NOW() WHERE id = $1',
        [accountId]
    );
}

async function getAccountStats(accountId) {
    const result = await db.query(
        'SELECT daily_sent, daily_bounces, daily_errors, daily_limit FROM sender_accounts WHERE id = $1',
        [accountId]
    );
    return result.rows[0];
}

async function markEmailSent(emailId) {
    await db.query(
        'UPDATE email_queue SET status = $1, sent_at = NOW() WHERE id = $2',
        ['sent', emailId]
    );
}

async function scheduleRetry(emailId, errorMessage) {
    await db.query(`
        UPDATE email_queue
        SET status = 'pending',
            retry_count = retry_count + 1,
            next_retry_at = CASE
                WHEN retry_count = 0 THEN NOW() + INTERVAL '1 minute'
                WHEN retry_count = 1 THEN NOW() + INTERVAL '5 minutes'
                WHEN retry_count = 2 THEN NOW() + INTERVAL '15 minutes'
                ELSE NOW() + INTERVAL '1 hour'
            END,
            last_error = $1
        WHERE id = $2
          AND retry_count < max_retries
    `, [errorMessage, emailId]);
}

// Entry point
if (require.main === module) {
    const accountId = parseInt(process.argv[2]);
    if (!accountId) {
        console.error('Usage: node sendWorker.js <accountId>');
        process.exit(1);
    }
    
    main(accountId)
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Worker crashed:', error);
            process.exit(1);
        });
}

module.exports = { main };
```

## Retry Logic and Backoff Strategy

### When to Retry

**Retryable Errors**:
- Temporary network failures
- SMTP server temporarily unavailable (421, 450, 451 codes)
- Rate limit exceeded (should not happen with proper pacing)
- Soft bounces (mailbox full)

**Non-Retryable Errors**:
- Hard bounces (invalid email, no such user, 550 codes)
- Auth failures (credential issues)
- Permanent SMTP errors (550, 551, 552, 553, 554)
- Unsubscribed recipients

### Exponential Backoff

```
Attempt 1: Send immediately
Attempt 2: Retry after 1 minute
Attempt 3: Retry after 5 minutes
Attempt 4: Retry after 15 minutes
Max: 3 retries, then mark as 'failed'
```

**Why this schedule**:
- Quick recovery from transient failures
- Doesn't overwhelm recipient's server
- Total retry window: ~21 minutes
- After 3 failures, likely permanent issue

### Error Classification

```javascript
function classifyError(error) {
    const message = error.message.toLowerCase();
    
    // Hard bounces - never retry
    if (message.includes('550') || 
        message.includes('user unknown') ||
        message.includes('mailbox not found')) {
        return { type: 'hard_bounce', retry: false };
    }
    
    // Soft bounces - retry with backoff
    if (message.includes('421') ||
        message.includes('mailbox full') ||
        message.includes('temporarily unavailable')) {
        return { type: 'soft_bounce', retry: true };
    }
    
    // Auth errors - don't retry, suspend account
    if (message.includes('authentication failed') ||
        message.includes('invalid credentials')) {
        return { type: 'auth_error', retry: false, suspend: true };
    }
    
    // Rate limit - retry but warn
    if (message.includes('rate limit') ||
        message.includes('quota exceeded')) {
        return { type: 'rate_limit', retry: true, warn: true };
    }
    
    // Unknown - retry to be safe
    return { type: 'unknown', retry: true };
}
```

## Rate Limiting Per Account

### Two-Level Rate Limiting

**Level 1: Per-Send Delay**
- Controlled by `send_delay_ms` in sender_accounts
- Worker waits this many milliseconds between emails
- Example: 100ms = max 600 emails/minute = 36,000/hour
- Prevents sudden bursts that trigger anti-spam

**Level 2: Daily Limit**
- Controlled by `daily_limit` in sender_accounts
- Worker stops when `daily_sent >= daily_limit`
- Enforced before each batch fetch
- Reset at midnight UTC by cron job

### Gmail API Specific Limits

**Google's Limits**:
- Gmail API: 250 quota units per user per second
- Sending one email: 100 quota units
- Therefore: Max ~2.5 emails/second per user
- Daily limit (free): 500 emails/day
- Daily limit (Workspace): 2,000 emails/day

**Our Implementation**:
- Set `send_delay_ms = 400` (2.5 emails/sec)
- Set `daily_limit = 2000` (Workspace) or `500` (free)
- Workers automatically enforce both

### SMTP Specific Limits

**Varies by Provider**:
- Gmail SMTP: 500/day (free), 2,000/day (Workspace)
- SendGrid: Depends on plan
- Amazon SES: Depends on reputation

**Our Implementation**:
- Configurable per account
- Start conservative: `send_delay_ms = 200` (5/sec)
- Increase gradually during warm-up

## Parallelism Model

### ✅ Correct Parallelism

**Multiple workers in parallel**:
```
Worker 1 (Account A) → Sends sequentially
Worker 2 (Account B) → Sends sequentially  } Run in parallel
Worker 3 (Account C) → Sends sequentially
```

Total throughput: 3× single worker throughput

### ❌ Incorrect Parallelism

**Do NOT do this**:
```
Worker 1 (Account A):
  - Email 1 → Send in parallel
  - Email 2 → Send in parallel  } WRONG!
  - Email 3 → Send in parallel
```

This violates rate limits and looks like spam.

### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
    apps: [
        // Main API server
        {
            name: 'api-server',
            script: './src/server.js',
            instances: 2, // Cluster mode for API
            exec_mode: 'cluster'
        },
        // Worker orchestrator
        {
            name: 'orchestrator',
            script: './src/workers/orchestrator.js',
            instances: 1, // Single instance
            exec_mode: 'fork'
        }
        // Workers spawned dynamically by orchestrator
    ]
};
```

Orchestrator spawns workers as needed:
```javascript
const workerProcess = spawn('node', ['./src/workers/sendWorker.js', accountId]);
```

## Worker Monitoring

### Health Checks

Orchestrator monitors workers via:
1. Process PID (is it running?)
2. Last heartbeat (worker updates every 30 sec)
3. Stuck detection (no progress in 5 min)

```javascript
// In worker
setInterval(() => {
    db.query(
        'UPDATE sender_accounts SET last_heartbeat = NOW() WHERE id = $1',
        [accountId]
    );
}, 30000);

// In orchestrator
setInterval(() => {
    const stuckWorkers = await db.query(`
        SELECT id, email FROM sender_accounts
        WHERE status = 'active'
          AND last_heartbeat < NOW() - INTERVAL '5 minutes'
    `);
    
    for (const account of stuckWorkers.rows) {
        console.warn(`Account ${account.email} worker stuck, restarting`);
        killWorker(account.id);
        spawnWorker(account.id);
    }
}, 60000);
```

### Automatic Restart

```javascript
workerProcess.on('exit', (code) => {
    if (code !== 0) {
        console.error(`Worker ${accountId} crashed with code ${code}`);
        
        const restarts = getRestartCount(accountId);
        if (restarts < MAX_RESTARTS) {
            console.log(`Restarting worker ${accountId} (attempt ${restarts + 1})`);
            setTimeout(() => spawnWorker(accountId), RESTART_DELAY);
            incrementRestartCount(accountId);
        } else {
            console.error(`Worker ${accountId} exceeded max restarts, marking account suspended`);
            markAccountSuspended(accountId, 'Too many worker crashes');
        }
    }
});
```

## Summary

**Key Takeaways**:
- One worker per account, strictly sequential sends
- Atomic batch fetching prevents duplicates
- Exponential backoff for retries
- Two-level rate limiting (per-send + daily)
- Automatic health monitoring and restarts
- Gmail API and SMTP handled transparently

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-03  
**Author**: Principal Backend Architect
