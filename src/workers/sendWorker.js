require('dotenv').config();
const { query, transaction, closePool } = require('../db');
const { GmailService, SMTPService } = require('../services/emailService');
const logger = require('../utils/logger');
const { classifyError, isRetryableError } = require('../utils/errorHandler');

class SendWorker {
  constructor(accountId) {
    this.accountId = accountId;
    this.account = null;
    this.emailService = null;
    this.running = false;
    this.batchSize = parseInt(process.env.WORKER_BATCH_SIZE || '10');
    this.delayBetweenEmails = parseInt(process.env.WORKER_DELAY_MS || '1000');
    this.maxRetries = 3;
  }

  async initialize() {
    try {
      const result = await query(
        'SELECT * FROM sender_accounts WHERE id = $1 AND status IN ($2, $3)',
        [this.accountId, 'active', 'warming_up']
      );

      if (result.rows.length === 0) {
        throw new Error(`Account ${this.accountId} not found or not active`);
      }

      this.account = result.rows[0];
      logger.info('Worker initialized', { accountId: this.accountId, email: this.account.email });

      if (this.account.provider === 'gmail') {
        this.emailService = new GmailService({
          client_id: this.account.client_id,
          client_secret: this.account.client_secret,
          refresh_token: this.account.refresh_token,
          access_token: this.account.access_token
        });
      } else if (this.account.provider === 'smtp') {
        this.emailService = new SMTPService({
          host: this.account.smtp_host,
          port: this.account.smtp_port,
          secure: this.account.smtp_secure,
          username: this.account.smtp_username,
          password: this.account.smtp_password
        });
      }

      await this.emailService.authenticate();
      return true;
    } catch (error) {
      logger.error('Worker initialization failed', { 
        accountId: this.accountId, 
        error: error.message 
      });
      throw error;
    }
  }

  async checkLimits() {
    const result = await query(
      'SELECT emails_sent_today, current_daily_limit, status FROM sender_accounts WHERE id = $1',
      [this.accountId]
    );

    if (result.rows.length === 0) {
      return { canSend: false, reason: 'account_not_found' };
    }

    const account = result.rows[0];

    if (account.status === 'paused' || account.status === 'suspended') {
      return { canSend: false, reason: 'account_not_active', status: account.status };
    }

    if (account.emails_sent_today >= account.current_daily_limit) {
      await query(
        'UPDATE sender_accounts SET status = $1 WHERE id = $2',
        ['paused', this.accountId]
      );
      return { canSend: false, reason: 'daily_limit_reached' };
    }

    return { canSend: true, remaining: account.current_daily_limit - account.emails_sent_today };
  }

  async fetchBatch() {
    return await transaction(async (client) => {
      const result = await client.query(`
        SELECT eq.* FROM email_queue eq
        LEFT JOIN campaigns c ON c.id::text = eq.campaign_id
        WHERE eq.status = 'pending'
        AND eq.retry_count < $1
        AND (eq.next_retry_at IS NULL OR eq.next_retry_at <= NOW())
        AND (c.id IS NULL OR c.status NOT IN ('paused', 'cancelled'))
        AND eq.recipient_email NOT IN (
          SELECT email FROM bounce_list WHERE bounce_type = 'hard'
          UNION
          SELECT email FROM unsubscribe_list
        )
        ORDER BY eq.priority DESC, eq.created_at ASC
        LIMIT $2
        FOR UPDATE OF eq SKIP LOCKED
      `, [this.maxRetries, this.batchSize]);

      if (result.rows.length === 0) {
        return [];
      }

      const ids = result.rows.map(r => r.id);
      await client.query(`
        UPDATE email_queue
        SET status = 'processing', assigned_worker_id = $1, assigned_at = NOW()
        WHERE id = ANY($2)
      `, [this.accountId, ids]);

      return result.rows;
    });
  }

  async sendEmail(email) {
    const emailData = {
      to: email.recipient_email,
      from: this.account.email,
      subject: email.subject,
      html: email.html_body,
      text: email.text_body
    };

    const result = await this.emailService.sendEmail(emailData);
    return result;
  }

  async processBatch(emails) {
    for (const email of emails) {
      try {
        const limitCheck = await this.checkLimits();
        if (!limitCheck.canSend) {
          logger.warn('Cannot send email, limit reached', { 
            accountId: this.accountId, 
            reason: limitCheck.reason 
          });
          await query(
            'UPDATE email_queue SET status = $1, assigned_worker_id = NULL WHERE id = $2',
            ['pending', email.id]
          );
          continue;
        }

        logger.info('Sending email', { 
          emailId: email.id, 
          to: email.recipient_email,
          accountId: this.accountId
        });

        const result = await this.sendEmail(email);

        if (result.success) {
          await this.handleSuccess(email, result);
        } else {
          await this.handleFailure(email, result.error);
        }

        await this.delay(this.delayBetweenEmails);

      } catch (error) {
        logger.error('Error processing email', { 
          emailId: email.id, 
          error: error.message 
        });
        await this.handleFailure(email, error.message);
      }
    }
  }

  async handleSuccess(email, result) {
    await transaction(async (client) => {
      await client.query(
        'UPDATE email_queue SET status = $1, sent_at = NOW() WHERE id = $2',
        ['sent', email.id]
      );

      await client.query(`
        INSERT INTO send_logs (
          email_queue_id, sender_account_id, campaign_id, recipient_email,
          status, response_time_ms, message_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        email.id, 
        this.accountId, 
        email.campaign_id, 
        email.recipient_email,
        'sent', 
        result.responseTime, 
        result.messageId
      ]);

      await client.query(`
        UPDATE sender_accounts 
        SET emails_sent_today = emails_sent_today + 1,
            last_email_sent_at = NOW()
        WHERE id = $1
      `, [this.accountId]);
    });

    logger.info('Email sent successfully', { 
      emailId: email.id, 
      messageId: result.messageId 
    });
  }

  async handleFailure(email, errorMessage) {
    const errorType = classifyError({ message: errorMessage });
    const isRetryable = isRetryableError({ message: errorMessage });
    const newRetryCount = email.retry_count + 1;

    let status = 'failed';
    let nextRetryAt = null;

    if (isRetryable && newRetryCount < this.maxRetries) {
      status = 'pending';
      const backoffMinutes = Math.pow(2, newRetryCount) * 5;
      nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
    }

    await transaction(async (client) => {
      await client.query(`
        UPDATE email_queue 
        SET status = $1, 
            retry_count = $2, 
            last_error = $3,
            next_retry_at = $4,
            assigned_worker_id = NULL
        WHERE id = $5
      `, [status, newRetryCount, errorMessage, nextRetryAt, email.id]);

      await client.query(`
        INSERT INTO send_logs (
          email_queue_id, sender_account_id, campaign_id, recipient_email,
          status, error_message, error_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        email.id,
        this.accountId,
        email.campaign_id,
        email.recipient_email,
        'failed',
        errorMessage,
        errorType
      ]);

      await client.query(`
        UPDATE sender_accounts 
        SET consecutive_errors = consecutive_errors + 1
        WHERE id = $1
      `, [this.accountId]);
    });

    logger.error('Email send failed', { 
      emailId: email.id, 
      errorType, 
      retryCount: newRetryCount,
      willRetry: status === 'pending'
    });

    if (errorType === 'auth') {
      await this.handleAuthFailure();
    }
  }

  async handleAuthFailure() {
    await query(
      'UPDATE sender_accounts SET status = $1 WHERE id = $2',
      ['suspended', this.accountId]
    );
    logger.error('Account suspended due to authentication failure', { 
      accountId: this.accountId 
    });
    this.stop();
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async run() {
    this.running = true;
    logger.info('Worker started', { accountId: this.accountId });

    while (this.running) {
      try {
        const emails = await this.fetchBatch();

        if (emails.length === 0) {
          await this.delay(5000);
          continue;
        }

        await this.processBatch(emails);

      } catch (error) {
        logger.error('Worker error', { 
          accountId: this.accountId, 
          error: error.message,
          stack: error.stack
        });
        await this.delay(10000);
      }
    }

    logger.info('Worker stopped', { accountId: this.accountId });
  }

  stop() {
    this.running = false;
  }

  async cleanup() {
    await query(
      'UPDATE email_queue SET status = $1, assigned_worker_id = NULL WHERE assigned_worker_id = $2 AND status = $3',
      ['pending', this.accountId, 'processing']
    );
    await closePool();
  }
}

if (require.main === module) {
  const accountId = process.argv[2];
  
  if (!accountId) {
    console.error('Usage: node sendWorker.js <accountId>');
    process.exit(1);
  }

  const worker = new SendWorker(parseInt(accountId));

  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down worker...');
    worker.stop();
    await worker.cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down worker...');
    worker.stop();
    await worker.cleanup();
    process.exit(0);
  });

  (async () => {
    try {
      await worker.initialize();
      await worker.run();
    } catch (error) {
      logger.error('Worker crashed', { error: error.message, stack: error.stack });
      await worker.cleanup();
      process.exit(1);
    }
  })();
}

module.exports = SendWorker;
