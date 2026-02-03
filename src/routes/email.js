/**
 * Email Routes
 * API endpoints for email operations
 */

const express = require('express');
const router = express.Router();
const { query } = require('../db/connection');
const smtpService = require('../services/email/smtp');
const logger = require('../utils/logger');

/**
 * POST /api/emails/send
 * Send a single email immediately
 */
router.post('/send', async (req, res) => {
  try {
    const { to, subject, body, html } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['to', 'subject', 'body'],
      });
    }

    // Send email
    const result = await smtpService.sendEmail({
      to,
      subject,
      text: body,
      html: html || body,
    });

    if (result.success) {
      // Log the email
      await query(
        `INSERT INTO email_logs (recipient, subject, body, status, method)
         VALUES ($1, $2, $3, $4, $5)`,
        [to, subject, body, 'sent', 'smtp']
      );

      res.json({
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send email',
        details: result.error,
      });
    }
  } catch (error) {
    logger.error('Error sending email', { error: error.message });
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * POST /api/emails/queue
 * Add email to queue for processing by workers
 */
router.post('/queue', async (req, res) => {
  try {
    const { to, subject, body, html, priority = 5, scheduledAt } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['to', 'subject', 'body'],
      });
    }

    // Add to queue
    const result = await query(
      `INSERT INTO email_queue (recipient, subject, body, html_body, priority, scheduled_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [to, subject, body, html, priority, scheduledAt || 'NOW()']
    );

    res.json({
      success: true,
      message: 'Email added to queue',
      queueId: result.rows[0].id,
    });
  } catch (error) {
    logger.error('Error queueing email', { error: error.message });
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/emails/logs
 * Get email logs with pagination
 */
router.get('/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const status = req.query.status;

    let sql = `SELECT * FROM email_logs`;
    const params = [];

    if (status) {
      sql += ` WHERE status = $1`;
      params.push(status);
    }

    sql += ` ORDER BY sent_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    res.json({
      success: true,
      logs: result.rows,
      count: result.rowCount,
      limit,
      offset,
    });
  } catch (error) {
    logger.error('Error fetching email logs', { error: error.message });
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/emails/queue/status
 * Get queue statistics
 */
router.get('/queue/status', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM email_queue
      GROUP BY status
    `);

    const stats = result.rows.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {});

    res.json({
      success: true,
      queueStats: stats,
    });
  } catch (error) {
    logger.error('Error fetching queue status', { error: error.message });
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/emails/bounced
 * Get bounced emails
 */
router.get('/bounced', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM bounced_emails ORDER BY detected_at DESC LIMIT 100`
    );

    res.json({
      success: true,
      bouncedEmails: result.rows,
      count: result.rowCount,
    });
  } catch (error) {
    logger.error('Error fetching bounced emails', { error: error.message });
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

module.exports = router;
