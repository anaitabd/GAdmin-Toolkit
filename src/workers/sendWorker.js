/**
 * Email Worker
 * Handles sending emails through worker processes
 * Manages email queue and parallel sending
 */

const smtpService = require('../services/email/smtp');
const logger = require('../utils/logger');
const { query } = require('../db/connection');

class SendWorker {
  constructor(workerId) {
    this.workerId = workerId;
    this.emailsSent = 0;
    this.emailsFailed = 0;
    this.isRunning = false;
  }

  /**
   * Start processing emails from the queue
   * @param {number} limit - Maximum number of emails to process
   */
  async start(limit = 100) {
    this.isRunning = true;
    logger.info(`Worker ${this.workerId} started`, { limit });

    try {
      // Record worker start
      await this.recordWorkerStart();

      // Get emails from queue
      const emails = await this.getEmailsFromQueue(limit);
      
      if (emails.length === 0) {
        logger.info(`Worker ${this.workerId}: No emails in queue`);
        await this.recordWorkerFinish();
        return {
          workerId: this.workerId,
          emailsSent: this.emailsSent,
          emailsFailed: this.emailsFailed,
        };
      }

      logger.info(`Worker ${this.workerId}: Processing ${emails.length} emails`);

      // Process each email
      for (const email of emails) {
        if (!this.isRunning) {
          logger.warn(`Worker ${this.workerId} stopped`);
          break;
        }

        await this.processEmail(email);
      }

      // Record worker completion
      await this.recordWorkerFinish();

      logger.info(`Worker ${this.workerId} completed`, {
        sent: this.emailsSent,
        failed: this.emailsFailed,
      });

      return {
        workerId: this.workerId,
        emailsSent: this.emailsSent,
        emailsFailed: this.emailsFailed,
      };
    } catch (error) {
      logger.error(`Worker ${this.workerId} error`, { error: error.message });
      await this.recordWorkerFinish();
      throw error;
    }
  }

  /**
   * Stop the worker
   */
  stop() {
    this.isRunning = false;
    logger.info(`Worker ${this.workerId} stopping...`);
  }

  /**
   * Get emails from queue
   * @param {number} limit - Maximum number to fetch
   * @returns {Promise<Array>} Array of emails
   */
  async getEmailsFromQueue(limit) {
    try {
      const result = await query(
        `SELECT id, recipient, subject, body, html_body, retry_count, max_retries
         FROM email_queue
         WHERE status = 'pending' 
         AND scheduled_at <= NOW()
         ORDER BY priority DESC, scheduled_at ASC
         LIMIT $1`,
        [limit]
      );

      return result.rows;
    } catch (error) {
      logger.error(`Worker ${this.workerId}: Failed to fetch emails from queue`, {
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Process a single email
   * @param {Object} email - Email data
   */
  async processEmail(email) {
    const { id, recipient, subject, body, html_body, retry_count, max_retries } = email;

    try {
      // Update status to processing
      await query(
        `UPDATE email_queue SET status = 'processing' WHERE id = $1`,
        [id]
      );

      // Send email via SMTP
      const result = await smtpService.sendEmail({
        to: recipient,
        subject,
        text: body,
        html: html_body || body,
      });

      if (result.success) {
        // Mark as sent
        await query(
          `UPDATE email_queue 
           SET status = 'sent', processed_at = NOW() 
           WHERE id = $1`,
          [id]
        );

        // Log success
        await this.logEmail(recipient, subject, body, 'sent', null);
        this.emailsSent++;

        logger.debug(`Worker ${this.workerId}: Email sent to ${recipient}`);
      } else {
        // Handle failure
        await this.handleEmailFailure(id, recipient, subject, body, retry_count, max_retries, result.error);
      }
    } catch (error) {
      logger.error(`Worker ${this.workerId}: Error processing email ${id}`, {
        error: error.message,
      });
      await this.handleEmailFailure(id, recipient, subject, body, retry_count, max_retries, error.message);
    }
  }

  /**
   * Handle email sending failure
   */
  async handleEmailFailure(id, recipient, subject, body, retry_count, max_retries, errorMessage) {
    const newRetryCount = retry_count + 1;

    if (newRetryCount >= max_retries) {
      // Mark as failed permanently
      await query(
        `UPDATE email_queue 
         SET status = 'failed', retry_count = $1, processed_at = NOW() 
         WHERE id = $2`,
        [newRetryCount, id]
      );

      await this.logEmail(recipient, subject, body, 'failed', errorMessage);
      this.emailsFailed++;

      logger.warn(`Worker ${this.workerId}: Email failed permanently to ${recipient}`);
    } else {
      // Retry later
      await query(
        `UPDATE email_queue 
         SET status = 'pending', retry_count = $1, 
         scheduled_at = NOW() + INTERVAL '5 minutes' 
         WHERE id = $2`,
        [newRetryCount, id]
      );

      logger.info(`Worker ${this.workerId}: Email queued for retry (${newRetryCount}/${max_retries}) to ${recipient}`);
    }
  }

  /**
   * Log email sending attempt
   */
  async logEmail(recipient, subject, body, status, errorMessage) {
    try {
      await query(
        `INSERT INTO email_logs (recipient, subject, body, status, method, worker_id, error_message)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [recipient, subject, body, status, 'smtp', this.workerId, errorMessage]
      );
    } catch (error) {
      logger.error('Failed to log email', { error: error.message });
    }
  }

  /**
   * Record worker start in stats
   */
  async recordWorkerStart() {
    try {
      await query(
        `INSERT INTO worker_stats (worker_id, emails_sent, emails_failed)
         VALUES ($1, 0, 0)`,
        [this.workerId]
      );
    } catch (error) {
      logger.error('Failed to record worker start', { error: error.message });
    }
  }

  /**
   * Record worker finish in stats
   */
  async recordWorkerFinish() {
    try {
      await query(
        `UPDATE worker_stats 
         SET emails_sent = $1, emails_failed = $2, finished_at = NOW()
         WHERE worker_id = $3 AND finished_at IS NULL`,
        [this.emailsSent, this.emailsFailed, this.workerId]
      );
    } catch (error) {
      logger.error('Failed to record worker finish', { error: error.message });
    }
  }
}

module.exports = SendWorker;
