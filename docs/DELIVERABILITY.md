# Deliverability & Safety Rules

## Overview

This document describes strategies and rules to ensure high deliverability rates while protecting sender accounts from bans, suspensions, and reputation damage.

## The Deliverability Challenge

**Problem**: Email providers (Gmail, Outlook, Yahoo) use sophisticated algorithms to detect spam. Sending too many emails too fast from a new account triggers anti-spam systems.

**Our Solution**: Multi-layered approach combining:
1. Account warm-up schedules
2. Per-account send limits
3. Automatic pause on errors
4. Domain rotation
5. Content best practices
6. Monitoring and alerting

## 1. Account Warm-Up Schedule

### Why Warm-Up is Essential

**New Account = Zero Reputation**
- Email providers don't trust new senders
- Sudden high volume looks like spam
- Need to build reputation gradually

**Consequences of Skipping Warm-Up**:
- Emails land in spam folder
- Account suspended by provider
- Permanent damage to reputation
- Domain blacklisted

### Warm-Up Schedule (Conservative)

```
Week 1: Day 1-7
  Daily Limit: 50 emails/day
  Send Rate: 1 email/minute
  Batch Size: 10

Week 2: Day 8-14
  Daily Limit: 100 emails/day
  Send Rate: 2 emails/minute
  Batch Size: 20

Week 3: Day 15-21
  Daily Limit: 250 emails/day
  Send Rate: 5 emails/minute
  Batch Size: 30

Week 4: Day 22-28
  Daily Limit: 500 emails/day
  Send Rate: 8 emails/minute
  Batch Size: 40

Week 5: Day 29-35
  Daily Limit: 1,000 emails/day
  Send Rate: 10 emails/minute
  Batch Size: 50

Week 6+: Day 36+
  Daily Limit: 2,000 emails/day (Gmail Workspace max)
  Send Rate: 20 emails/minute
  Batch Size: 50
```

### Implementation

```javascript
// Database schema for warm-up
ALTER TABLE sender_accounts ADD COLUMN warmup_stage INTEGER DEFAULT 0;
ALTER TABLE sender_accounts ADD COLUMN warmup_started_at TIMESTAMP;
ALTER TABLE sender_accounts ADD COLUMN warmup_current_limit INTEGER;

// Warm-up configuration
const WARMUP_SCHEDULE = [
    { stage: 1, days: 7,  dailyLimit: 50,   sendDelayMs: 60000, batchSize: 10 },
    { stage: 2, days: 7,  dailyLimit: 100,  sendDelayMs: 30000, batchSize: 20 },
    { stage: 3, days: 7,  dailyLimit: 250,  sendDelayMs: 12000, batchSize: 30 },
    { stage: 4, days: 7,  dailyLimit: 500,  sendDelayMs: 7500,  batchSize: 40 },
    { stage: 5, days: 7,  dailyLimit: 1000, sendDelayMs: 6000,  batchSize: 50 },
    { stage: 6, days: 999, dailyLimit: 2000, sendDelayMs: 3000,  batchSize: 50 }
];

// Function to start warm-up for new account
async function startWarmup(accountId) {
    await db.query(`
        UPDATE sender_accounts
        SET status = 'warming_up',
            warmup_stage = 1,
            warmup_started_at = NOW(),
            warmup_current_limit = 50,
            daily_limit = 50,
            send_delay_ms = 60000,
            batch_size = 10
        WHERE id = $1
    `, [accountId]);
    
    console.log(`Started warm-up for account ${accountId}`);
}

// Cron job: Progress warm-up stages (runs daily)
async function progressWarmup() {
    const accounts = await db.query(`
        SELECT id, warmup_stage, warmup_started_at
        FROM sender_accounts
        WHERE status = 'warming_up'
    `);
    
    for (const account of accounts.rows) {
        const daysActive = Math.floor(
            (Date.now() - new Date(account.warmup_started_at)) / (1000 * 60 * 60 * 24)
        );
        
        const currentStage = WARMUP_SCHEDULE.find(s => s.stage === account.warmup_stage);
        if (!currentStage) continue;
        
        // Check if ready for next stage
        if (daysActive >= currentStage.days) {
            const nextStage = WARMUP_SCHEDULE.find(s => s.stage === account.warmup_stage + 1);
            
            if (nextStage) {
                console.log(`Advancing account ${account.id} to warm-up stage ${nextStage.stage}`);
                
                await db.query(`
                    UPDATE sender_accounts
                    SET warmup_stage = $1,
                        warmup_current_limit = $2,
                        daily_limit = $3,
                        send_delay_ms = $4,
                        batch_size = $5
                    WHERE id = $6
                `, [
                    nextStage.stage,
                    nextStage.dailyLimit,
                    nextStage.dailyLimit,
                    nextStage.sendDelayMs,
                    nextStage.batchSize,
                    account.id
                ]);
            } else {
                // Warm-up complete
                console.log(`Warm-up complete for account ${account.id}`);
                
                await db.query(`
                    UPDATE sender_accounts
                    SET status = 'active',
                        warmup_stage = 0
                    WHERE id = $1
                `, [account.id]);
            }
        }
    }
}
```

### Warm-Up Best Practices

1. **Start Small**: 50 emails/day for first week
2. **Consistent Volume**: Send similar amounts each day (don't skip days)
3. **Engaged Recipients**: Send to users likely to open/click (friends, colleagues, test accounts)
4. **Quality Content**: No spam triggers in subject/body
5. **Monitor Metrics**: Track opens, clicks, bounces daily
6. **Pause if Issues**: Stop immediately if bounce rate > 2%

## 2. Per-Account Send Limit Enforcement

### Daily Limits by Provider

```
Gmail (free):           500 emails/day
Gmail (Workspace):      2,000 emails/day
Outlook.com (free):     300 emails/day
Outlook 365 (Business): 10,000 emails/day
SendGrid (Free):        100 emails/day
SendGrid (Pro):         Unlimited (but rate-limited)
Amazon SES:             Depends on reputation (start at 200/day)
```

### Enforcement Strategy

**Database Counters**:
```sql
-- Tracked per account
daily_sent INTEGER NOT NULL DEFAULT 0,
daily_bounces INTEGER NOT NULL DEFAULT 0,
daily_errors INTEGER NOT NULL DEFAULT 0,
last_reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**Before Each Batch**:
```javascript
async function canSend(accountId) {
    const account = await db.query(
        'SELECT daily_sent, daily_limit, status FROM sender_accounts WHERE id = $1',
        [accountId]
    );
    
    const acc = account.rows[0];
    
    if (acc.status !== 'active' && acc.status !== 'warming_up') {
        return { allowed: false, reason: 'Account not active' };
    }
    
    if (acc.daily_sent >= acc.daily_limit) {
        return { allowed: false, reason: 'Daily limit reached' };
    }
    
    return { 
        allowed: true, 
        remainingQuota: acc.daily_limit - acc.daily_sent 
    };
}
```

**After Each Send**:
```javascript
async function incrementDailySent(accountId) {
    await db.query(
        'UPDATE sender_accounts SET daily_sent = daily_sent + 1 WHERE id = $1',
        [accountId]
    );
}
```

**Reset at Midnight UTC** (Cron Job):
```javascript
async function resetDailyCounters() {
    await db.query(`
        UPDATE sender_accounts
        SET daily_sent = 0,
            daily_bounces = 0,
            daily_errors = 0,
            last_reset_at = NOW(),
            status = CASE
                WHEN status = 'paused_limit_reached' THEN 'active'
                ELSE status
            END
    `);
    
    console.log('Daily counters reset');
}
```

## 3. Auto-Pause on Errors

### Error Thresholds

```javascript
const THRESHOLDS = {
    BOUNCE_RATE: 0.05,        // 5% bounces = pause
    ERROR_RATE: 0.10,          // 10% errors = pause
    CONSECUTIVE_ERRORS: 10,    // 10 errors in a row = pause
    AUTH_FAILURES: 1           // 1 auth failure = suspend
};
```

### Bounce Rate Check

```javascript
async function checkBounceRate(accountId) {
    const stats = await db.query(
        'SELECT daily_sent, daily_bounces FROM sender_accounts WHERE id = $1',
        [accountId]
    );
    
    const { daily_sent, daily_bounces } = stats.rows[0];
    
    if (daily_sent === 0) return;
    
    const bounceRate = daily_bounces / daily_sent;
    
    if (bounceRate > THRESHOLDS.BOUNCE_RATE) {
        console.warn(`Account ${accountId} exceeded bounce threshold: ${(bounceRate * 100).toFixed(2)}%`);
        
        await db.query(
            'UPDATE sender_accounts SET status = $1, notes = $2 WHERE id = $3',
            ['paused', `Auto-paused: High bounce rate (${(bounceRate * 100).toFixed(2)}%)`, accountId]
        );
        
        await sendAdminAlert({
            subject: `Account ${accountId} auto-paused`,
            body: `Bounce rate: ${(bounceRate * 100).toFixed(2)}%`
        });
    }
}
```

### Consecutive Error Tracking

```javascript
// In-memory counter per worker
let consecutiveErrors = 0;

async function handleSendResult(result, accountId) {
    if (result.success) {
        consecutiveErrors = 0;
    } else {
        consecutiveErrors++;
        
        if (consecutiveErrors >= THRESHOLDS.CONSECUTIVE_ERRORS) {
            console.error(`Account ${accountId} hit ${consecutiveErrors} consecutive errors`);
            
            await db.query(
                'UPDATE sender_accounts SET status = $1 WHERE id = $2',
                ['paused', accountId]
            );
            
            throw new Error('Too many consecutive errors, pausing account');
        }
    }
}
```

### Authentication Failure

```javascript
// In sendWorker.js
try {
    client = await authenticate(account);
} catch (error) {
    console.error(`Auth failed for account ${accountId}:`, error);
    
    await db.query(
        'UPDATE sender_accounts SET status = $1, notes = $2 WHERE id = $3',
        ['suspended', `Auth failed: ${error.message}`, accountId]
    );
    
    await sendAdminAlert({
        subject: `Account ${accountId} suspended`,
        body: `Authentication failed: ${error.message}`
    });
    
    process.exit(1);
}
```

## 4. Domain Rotation and Reputation

### Why Domain Rotation?

**Problem**: Sending from many accounts under same domain concentrates reputation risk.

**Solution**: Rotate across multiple domains to distribute risk.

### Strategy

```
Primary Domain:    yourdomain.com
Rotation Domains:  mail1.yourdomain.com
                   mail2.yourdomain.com
                   mail3.yourdomain.com
                   newsletters.yourdomain.com
```

### Implementation

```javascript
// Add domain field to sender_accounts
ALTER TABLE sender_accounts ADD COLUMN sending_domain VARCHAR(255);

// Distribute accounts across domains
const DOMAINS = [
    'mail1.yourdomain.com',
    'mail2.yourdomain.com',
    'mail3.yourdomain.com',
    'newsletters.yourdomain.com'
];

async function assignDomain(accountId) {
    // Count accounts per domain
    const domainCounts = await db.query(`
        SELECT sending_domain, COUNT(*) as count
        FROM sender_accounts
        WHERE sending_domain IS NOT NULL
        GROUP BY sending_domain
    `);
    
    // Assign to domain with fewest accounts
    const counts = DOMAINS.map(domain => ({
        domain,
        count: domainCounts.rows.find(d => d.sending_domain === domain)?.count || 0
    }));
    
    const leastUsed = counts.sort((a, b) => a.count - b.count)[0];
    
    await db.query(
        'UPDATE sender_accounts SET sending_domain = $1 WHERE id = $2',
        [leastUsed.domain, accountId]
    );
}
```

### DNS Configuration

Each domain needs proper DNS records:

```
SPF Record:
yourdomain.com.   TXT   "v=spf1 include:_spf.google.com ~all"

DKIM Record:
google._domainkey.yourdomain.com.   TXT   "v=DKIM1; k=rsa; p=<public_key>"

DMARC Record:
_dmarc.yourdomain.com.   TXT   "v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com"
```

**Important**: Set up SPF, DKIM, and DMARC for EVERY domain.

## 5. Content Best Practices

### Avoiding Spam Triggers

**Subject Line**:
- ❌ ALL CAPS, excessive punctuation!!!
- ❌ "FREE", "URGENT", "ACT NOW"
- ❌ Too many emojis 🔥🔥🔥
- ✅ Clear, concise, relevant
- ✅ Personalized when possible

**Body Content**:
- ❌ Large images, no text (image-only emails)
- ❌ All caps, excessive exclamation marks
- ❌ Suspicious links (URL shorteners, typosquatting)
- ❌ Broken HTML, missing alt text
- ✅ Good text-to-image ratio (60:40)
- ✅ Plain text version included
- ✅ Unsubscribe link clearly visible
- ✅ Physical address included (CAN-SPAM)

**Links**:
- ❌ Raw IP addresses (http://192.168.1.1)
- ❌ URL shorteners (bit.ly, tinyurl)
- ❌ Too many links (>10 is suspicious)
- ✅ HTTPS links to reputable domains
- ✅ Descriptive anchor text

### Content Validation

```javascript
function validateEmailContent(subject, htmlBody) {
    const warnings = [];
    
    // Check subject
    if (subject.toUpperCase() === subject) {
        warnings.push('Subject is all caps');
    }
    
    if (/[!]{3,}/.test(subject)) {
        warnings.push('Subject has excessive exclamation marks');
    }
    
    const spamWords = ['free', 'urgent', 'act now', 'limited time', 'click here'];
    spamWords.forEach(word => {
        if (subject.toLowerCase().includes(word)) {
            warnings.push(`Subject contains spam trigger: "${word}"`);
        }
    });
    
    // Check body
    const textLength = htmlBody.replace(/<[^>]*>/g, '').length;
    const imageCount = (htmlBody.match(/<img/gi) || []).length;
    
    if (imageCount > 5 && textLength < 200) {
        warnings.push('Too many images, not enough text');
    }
    
    const linkCount = (htmlBody.match(/<a /gi) || []).length;
    if (linkCount > 10) {
        warnings.push('Too many links (>10)');
    }
    
    // Check for unsubscribe link
    if (!htmlBody.includes('/unsubscribe/')) {
        warnings.push('Missing unsubscribe link');
    }
    
    return { valid: warnings.length === 0, warnings };
}
```

## 6. Monitoring and Alerting

### Metrics to Monitor

**Per-Account Metrics**:
- Daily sent count
- Bounce rate
- Error rate
- Open rate (if tracked)
- Click rate (if tracked)
- Time since last send

**System-Wide Metrics**:
- Total emails sent today
- Average bounce rate
- Number of active accounts
- Number of paused/suspended accounts
- Queue depth
- Worker health

### Alert Rules

```javascript
const ALERT_RULES = [
    {
        name: 'High Bounce Rate',
        condition: (account) => account.bounceRate > 0.05,
        severity: 'critical',
        action: 'pause_account'
    },
    {
        name: 'Authentication Failed',
        condition: (account) => account.status === 'suspended',
        severity: 'critical',
        action: 'notify_admin'
    },
    {
        name: 'Daily Limit Reached',
        condition: (account) => account.daily_sent >= account.daily_limit,
        severity: 'info',
        action: 'log_only'
    },
    {
        name: 'Low Open Rate',
        condition: (account) => account.openRate < 0.05 && account.daily_sent > 100,
        severity: 'warning',
        action: 'notify_admin'
    },
    {
        name: 'Queue Depth High',
        condition: (system) => system.queueDepth > 10000,
        severity: 'warning',
        action: 'notify_admin'
    }
];

async function checkAlerts() {
    const accounts = await getAccountStats();
    
    for (const account of accounts) {
        for (const rule of ALERT_RULES) {
            if (rule.condition(account)) {
                console.warn(`Alert: ${rule.name} for account ${account.id}`);
                
                if (rule.action === 'pause_account') {
                    await pauseAccount(account.id);
                }
                
                if (rule.action === 'notify_admin' || rule.action === 'pause_account') {
                    await sendAdminAlert({
                        subject: `[${rule.severity.toUpperCase()}] ${rule.name}`,
                        body: `Account ${account.email} triggered alert: ${rule.name}`
                    });
                }
            }
        }
    }
}
```

### Grafana Dashboard (Example Queries)

```promql
# Emails sent per hour
rate(emails_sent_total[1h])

# Bounce rate per account
(emails_bounced_total / emails_sent_total) * 100

# Active workers
count(up{job="send-worker"})

# Queue depth
email_queue_depth

# Average send time
histogram_quantile(0.95, rate(email_send_duration_bucket[5m]))
```

## 7. Incident Response Playbook

### High Bounce Rate

**Symptoms**: Bounce rate > 5%

**Actions**:
1. Auto-pause affected account
2. Review recent recipient list for quality issues
3. Check for typos in email addresses
4. Verify domain DNS records (SPF, DKIM)
5. If persistent, reduce daily limit and restart warm-up
6. Consider switching to new account

### Account Suspended by Provider

**Symptoms**: Authentication failures, "account disabled" errors

**Actions**:
1. Mark account as 'suspended' in database
2. Do NOT retry (will make it worse)
3. Contact provider support with details
4. Appeal suspension if possible
5. In parallel, create replacement account
6. Learn from incident (what triggered suspension?)

### Emails Going to Spam

**Symptoms**: Low open rate (<2%), complaints

**Actions**:
1. Review email content for spam triggers
2. Check DNS records (SPF, DKIM, DMARC)
3. Use spam testing tools (mail-tester.com)
4. Reduce send volume temporarily
5. Improve content quality
6. Engage with recipients (ask to whitelist)

### Database Overload

**Symptoms**: Slow queries, worker timeouts

**Actions**:
1. Check database CPU/memory usage
2. Identify slow queries with pg_stat_statements
3. Add missing indexes
4. Scale database vertically (larger instance)
5. Consider read replicas for analytics
6. Archive old data

---

## Summary: Safety Checklist

Before launching production:

- [ ] All accounts on warm-up schedule
- [ ] Daily limits configured per provider
- [ ] Auto-pause enabled for high bounce rate
- [ ] Auto-suspend enabled for auth failures
- [ ] DNS records (SPF, DKIM, DMARC) configured
- [ ] Unsubscribe link in all emails
- [ ] Physical address in all emails (CAN-SPAM)
- [ ] Content validation enabled
- [ ] Suppression lists checked before enqueueing
- [ ] Monitoring and alerting configured
- [ ] Admin alert system tested
- [ ] Backup and recovery procedures documented
- [ ] Rate limiting tested under load
- [ ] Retry logic tested
- [ ] Worker failure scenarios tested

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-03  
**Author**: Principal Backend Architect
