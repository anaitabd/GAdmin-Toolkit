const express = require('express');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const { query, transaction } = require('../db');
const { authenticateAdmin } = require('../middleware/auth');
const crypto = require('crypto');

const router = express.Router();

router.use(authenticateAdmin);

router.post('/', asyncHandler(async (req, res) => {
  const { name, description, sponsor_id } = req.body;

  if (!name) {
    throw new AppError('Campaign name is required', 400);
  }

  const result = await query(`
    INSERT INTO campaigns (name, description, sponsor_id, status)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [name, description, sponsor_id, 'active']);

  res.status(201).json({
    success: true,
    data: { campaign: result.rows[0] }
  });
}));

router.get('/', asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT * FROM campaigns
    ORDER BY created_at DESC
  `);

  res.json({
    success: true,
    data: { campaigns: result.rows }
  });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const campaign = await query('SELECT * FROM campaigns WHERE id = $1', [id]);

  if (campaign.rows.length === 0) {
    throw new AppError('Campaign not found', 404);
  }

  const stats = await query(`
    SELECT 
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'processing') as processing,
      COUNT(*) FILTER (WHERE status = 'sent') as sent,
      COUNT(*) FILTER (WHERE status = 'failed') as failed
    FROM email_queue
    WHERE campaign_id = $1
  `, [id]);

  const opens = await query(`
    SELECT COUNT(*) as opens
    FROM open_events oe
    JOIN email_queue eq ON eq.id = oe.email_queue_id
    WHERE eq.campaign_id = $1
  `, [id]);

  const clicks = await query(`
    SELECT COUNT(*) as clicks
    FROM click_events ce
    JOIN email_queue eq ON eq.id = ce.email_queue_id
    WHERE eq.campaign_id = $1
  `, [id]);

  res.json({
    success: true,
    data: {
      campaign: campaign.rows[0],
      stats: {
        ...stats.rows[0],
        opens: parseInt(opens.rows[0].opens),
        clicks: parseInt(clicks.rows[0].clicks)
      }
    }
  });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  await transaction(async (client) => {
    await client.query(
      'UPDATE campaigns SET status = $1 WHERE id = $2',
      ['cancelled', id]
    );

    await client.query(
      'UPDATE email_queue SET status = $1 WHERE campaign_id = $2 AND status = $3',
      ['failed', id, 'pending']
    );
  });

  res.json({
    success: true,
    data: { message: 'Campaign cancelled successfully' }
  });
}));

// POST /api/campaigns/:id/pause - Pause campaign
router.post('/:id/pause', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const campaign = await query('SELECT * FROM campaigns WHERE id = $1', [id]);
  
  if (campaign.rows.length === 0) {
    throw new AppError('Campaign not found', 404);
  }

  if (campaign.rows[0].status === 'paused') {
    throw new AppError('Campaign is already paused', 400);
  }

  await transaction(async (client) => {
    // Update campaign status to paused
    await client.query(`
      UPDATE campaigns 
      SET status = $1, paused_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, ['paused', id]);

    // Reset any processing emails back to pending
    // Workers will now skip them due to campaign being paused
    await client.query(`
      UPDATE email_queue
      SET status = 'pending', assigned_worker_id = NULL, assigned_at = NULL
      WHERE campaign_id = $1 AND status = 'processing'
    `, [id]);
  });

  res.json({
    success: true,
    data: { 
      message: 'Campaign paused successfully. Workers will skip emails from this campaign.',
      campaign_id: id
    }
  });
}));

// POST /api/campaigns/:id/resume - Resume campaign
router.post('/:id/resume', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const campaign = await query('SELECT * FROM campaigns WHERE id = $1', [id]);
  
  if (campaign.rows.length === 0) {
    throw new AppError('Campaign not found', 404);
  }

  if (campaign.rows[0].status !== 'paused') {
    throw new AppError('Campaign is not paused', 400);
  }

  await query(`
    UPDATE campaigns 
    SET status = $1, paused_at = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `, ['active', id]);

  // Workers will automatically pick up pending emails from this campaign
  // No need to manually trigger workers as they continuously poll for pending emails

  res.json({
    success: true,
    data: { 
      message: 'Campaign resumed successfully. Workers will now process emails from this campaign.',
      campaign_id: id
    }
  });
}));

// PATCH /api/campaigns/:id - Update campaign
router.patch('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const allowedFields = ['name', 'description', 'subject', 'html_template', 'text_template'];
  
  const campaign = await query('SELECT * FROM campaigns WHERE id = $1', [id]);
  
  if (campaign.rows.length === 0) {
    throw new AppError('Campaign not found', 404);
  }

  // Filter only allowed fields from request body
  const updates = {};
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key) && req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  });

  if (Object.keys(updates).length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  // Build dynamic SQL query
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
  
  values.push(id);
  const result = await query(`
    UPDATE campaigns 
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${values.length}
    RETURNING *
  `, values);

  res.json({
    success: true,
    data: { campaign: result.rows[0] }
  });
}));

// POST /api/campaigns/:id/duplicate - Duplicate campaign
router.post('/:id/duplicate', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const campaign = await query('SELECT * FROM campaigns WHERE id = $1', [id]);
  
  if (campaign.rows.length === 0) {
    throw new AppError('Campaign not found', 404);
  }

  const original = campaign.rows[0];
  const newName = `${original.name} (Copy)`;

  const result = await query(`
    INSERT INTO campaigns (
      name, description, subject, html_template, text_template,
      sponsor_id, tracking_domain, track_opens, track_clicks,
      use_ec2_tracking, real_offer_url, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `, [
    newName,
    original.description,
    original.subject,
    original.html_template,
    original.text_template,
    original.sponsor_id,
    null, // Clear tracking_domain for new campaign
    original.track_opens,
    original.track_clicks,
    original.use_ec2_tracking,
    original.real_offer_url,
    'active'
  ]);

  res.status(201).json({
    success: true,
    data: { 
      campaign: result.rows[0],
      message: 'Campaign duplicated successfully'
    }
  });
}));

// GET /api/campaigns/:id/emails - Get campaign emails with pagination
router.get('/:id/emails', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    status, 
    limit = 50, 
    offset = 0 
  } = req.query;

  // Verify campaign exists
  const campaign = await query('SELECT id FROM campaigns WHERE id = $1', [id]);
  
  if (campaign.rows.length === 0) {
    throw new AppError('Campaign not found', 404);
  }

  // Build query with optional status filter
  let emailQuery = `
    SELECT 
      id, recipient_email, recipient_name, subject,
      status, assigned_to, retry_count, last_error,
      created_at, sent_at, assigned_at
    FROM email_queue
    WHERE campaign_id = $1
  `;
  
  const params = [id];
  
  if (status) {
    params.push(status);
    emailQuery += ` AND status = $${params.length}`;
  }

  emailQuery += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(parseInt(limit), parseInt(offset));

  const emails = await query(emailQuery, params);

  // Get total count
  let countQuery = 'SELECT COUNT(*) as total FROM email_queue WHERE campaign_id = $1';
  const countParams = [id];
  
  if (status) {
    countParams.push(status);
    countQuery += ' AND status = $2';
  }

  const countResult = await query(countQuery, countParams);

  res.json({
    success: true,
    data: {
      emails: emails.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + emails.rows.length < parseInt(countResult.rows[0].total)
      }
    }
  });
}));

// GET /api/campaigns/:id/timeline - Hourly aggregation of send_logs
router.get('/:id/timeline', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { days = 7 } = req.query;

  // Verify campaign exists
  const campaign = await query('SELECT id FROM campaigns WHERE id = $1', [id]);
  
  if (campaign.rows.length === 0) {
    throw new AppError('Campaign not found', 404);
  }

  // Validate and sanitize days parameter
  const daysInt = Math.max(1, Math.min(365, parseInt(days) || 7));

  const timeline = await query(`
    SELECT 
      DATE_TRUNC('hour', sent_at) as hour,
      COUNT(*) as total_sent,
      COUNT(*) FILTER (WHERE status = 'sent') as sent,
      COUNT(*) FILTER (WHERE status = 'failed') as failed,
      COUNT(*) FILTER (WHERE status = 'bounced') as bounced,
      AVG(response_time_ms) as avg_response_time
    FROM send_logs
    WHERE campaign_id = $1
      AND sent_at >= NOW() - make_interval(days => $2)
    GROUP BY DATE_TRUNC('hour', sent_at)
    ORDER BY hour DESC
  `, [id, daysInt]);

  res.json({
    success: true,
    data: {
      timeline: timeline.rows,
      period_days: daysInt
    }
  });
}));

// GET /api/campaigns/:id/top-performers - Top 10 sender accounts by open rate
router.get('/:id/top-performers', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify campaign exists
  const campaign = await query('SELECT id FROM campaigns WHERE id = $1', [id]);
  
  if (campaign.rows.length === 0) {
    throw new AppError('Campaign not found', 404);
  }

  const topPerformers = await query(`
    SELECT 
      sa.id,
      sa.email,
      sa.name,
      COUNT(DISTINCT sl.id) as total_sent,
      COUNT(DISTINCT oe.id) as total_opens,
      COUNT(DISTINCT ce.id) as total_clicks,
      CASE 
        WHEN COUNT(DISTINCT sl.id) > 0 
        THEN ROUND((COUNT(DISTINCT oe.id)::DECIMAL / COUNT(DISTINCT sl.id)::DECIMAL) * 100, 2)
        ELSE 0
      END as open_rate,
      CASE 
        WHEN COUNT(DISTINCT sl.id) > 0 
        THEN ROUND((COUNT(DISTINCT ce.id)::DECIMAL / COUNT(DISTINCT sl.id)::DECIMAL) * 100, 2)
        ELSE 0
      END as click_rate
    FROM sender_accounts sa
    INNER JOIN send_logs sl ON sl.sender_account_id = sa.id
    LEFT JOIN email_queue eq ON eq.id = sl.email_queue_id
    LEFT JOIN open_events oe ON oe.email_queue_id = eq.id
    LEFT JOIN click_events ce ON ce.email_queue_id = eq.id
    WHERE sl.campaign_id = $1
      AND sl.status = 'sent'
    GROUP BY sa.id, sa.email, sa.name
    HAVING COUNT(DISTINCT sl.id) > 0
    ORDER BY open_rate DESC, total_sent DESC
    LIMIT 10
  `, [id]);

  res.json({
    success: true,
    data: {
      top_performers: topPerformers.rows
    }
  });
}));

module.exports = router;
