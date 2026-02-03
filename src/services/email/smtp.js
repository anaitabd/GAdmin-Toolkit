/**
 * SMTP Email Service
 * Handles sending emails using Nodemailer SMTP
 */

const nodemailer = require('nodemailer');
const config = require('../../config');
const logger = require('../../utils/logger');

class SMTPService {
  constructor() {
    this.transporter = null;
  }

  /**
   * Initialize SMTP transporter
   */
  initialize() {
    if (this.transporter) {
      return this.transporter;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {
          user: config.smtp.auth.user,
          pass: config.smtp.auth.pass,
        },
      });

      logger.info('SMTP service initialized', {
        host: config.smtp.host,
        port: config.smtp.port,
      });

      return this.transporter;
    } catch (error) {
      logger.error('Failed to initialize SMTP service', { error: error.message });
      throw error;
    }
  }

  /**
   * Send an email via SMTP
   * @param {Object} emailData - Email details
   * @returns {Promise<Object>} Send result
   */
  async sendEmail(emailData) {
    const { to, subject, text, html } = emailData;

    try {
      if (!this.transporter) {
        this.initialize();
      }

      const mailOptions = {
        from: config.smtp.auth.user,
        to,
        subject,
        text,
        html: html || text,
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info('Email sent successfully via SMTP', {
        recipient: to,
        messageId: info.messageId,
      });

      return {
        success: true,
        messageId: info.messageId,
        recipient: to,
      };
    } catch (error) {
      logger.error('Failed to send email via SMTP', {
        recipient: to,
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
        recipient: to,
      };
    }
  }

  /**
   * Send multiple emails
   * @param {Array<Object>} emails - Array of email data
   * @returns {Promise<Array>} Array of send results
   */
  async sendBulk(emails) {
    const results = [];

    for (const email of emails) {
      const result = await this.sendEmail(email);
      results.push(result);
    }

    return results;
  }

  /**
   * Verify SMTP connection
   * @returns {Promise<boolean>} Connection status
   */
  async verifyConnection() {
    try {
      if (!this.transporter) {
        this.initialize();
      }

      await this.transporter.verify();
      logger.info('SMTP connection verified');
      return true;
    } catch (error) {
      logger.error('SMTP connection verification failed', { error: error.message });
      return false;
    }
  }

  /**
   * Close SMTP connection
   */
  close() {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
      logger.info('SMTP connection closed');
    }
  }
}

// Export singleton instance
module.exports = new SMTPService();
