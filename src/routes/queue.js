const express = require('express');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const { query, transaction } = require('../db');
const { authenticateAdmin, authenticateSponsor } = require('../middleware/auth');
const crypto = require('crypto');

const router = express.Router();

router.post('/enqueue', authenticateAdmin, asyncHandler(async (req, res) => {
  const { campaign_id, emails } = req.body;

  if (!campaign_id || !emails || !Array.isArray(emails) || emails.length === 0) {
    throw new AppError('campaign_id and emails array are required', 400);
  }

  const inserted = await transaction(async (client) => {
    const results = [];

    for (const email of emails) {
      const { recipient_email, subject, html_body, text_body, priority = 5, custom_data = {} } = email;

      if (!recipient_email || !subject || (!html_body && !text_body)) {
        continue;
      }

      const trackingToken = crypto.randomBytes(32).toString('hex');

      const result = await client.query(`
        INSERT INTO email_queue (
          campaign_id, recipient_email, subject, html_body, text_body,
          priority, tracking_token, custom_data, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        campaign_id, recipient_email, subject, html_body, text_body,
        priority, trackingToken, JSON.stringify(custom_data), 'pending'
      ]);

      results.push(result.rows[0].id);
    }

    return results;
  });

  res.status(201).json({
    success: true,
    data: {
      message: `${inserted.length} emails added to queue`,
      count: inserted.length
    }
  });
}));

router.get('/status', authenticateAdmin, asyncHandler(async (req, res) => {
  const stats = await query(`
    SELECT 
      status,
      COUNT(*) as count,
      MIN(created_at) as oldest,
      MAX(created_at) as newest
    FROM email_queue
    GROUP BY status
  `);

  const accountStats = await query(`
    SELECT 
      sa.id,
      sa.email,
      sa.status,
      sa.emails_sent_today,
      sa.current_daily_limit,
      COUNT(eq.id) as processing_count
    FROM sender_accounts sa
    LEFT JOIN email_queue eq ON eq.assigned_worker_id = sa.id AND eq.status = 'processing'
    WHERE sa.archived = false
    GROUP BY sa.id
    ORDER BY sa.id
  `);

  res.json({
    success: true,
    data: {
      queue: stats.rows,
      accounts: accountStats.rows
    }
  });
}));

router.post('/clear-failed', authenticateAdmin, asyncHandler(async (req, res) => {
  const result = await query(`
    DELETE FROM email_queue
    WHERE status = 'failed'
    RETURNING id
  `);

  res.json({
    success: true,
    data: {
      message: `${result.rowCount} failed emails cleared`,
      count: result.rowCount
    }
  });
}));

router.post('/retry-failed', authenticateAdmin, asyncHandler(async (req, res) => {
  const result = await query(`
    UPDATE email_queue
    SET status = 'pending', retry_count = 0, next_retry_at = NULL, last_error = NULL
    WHERE status = 'failed'
    RETURNING id
  `);

  res.json({
    success: true,
    data: {
      message: `${result.rowCount} failed emails reset for retry`,
      count: result.rowCount
    }
  });
}));

module.exports = router;
