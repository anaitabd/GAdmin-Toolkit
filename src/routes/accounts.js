const express = require('express');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const { query, transaction } = require('../db');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateAdmin);

router.get('/', asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT id, email, provider, status, current_daily_limit, 
           emails_sent_today, warmup_stage, created_at
    FROM sender_accounts
    WHERE archived = false
    ORDER BY created_at DESC
  `);

  res.json({
    success: true,
    data: { accounts: result.rows }
  });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    'SELECT * FROM sender_accounts WHERE id = $1 AND archived = false',
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Account not found', 404);
  }

  res.json({
    success: true,
    data: { account: result.rows[0] }
  });
}));

router.post('/', asyncHandler(async (req, res) => {
  const {
    email,
    provider,
    client_id,
    client_secret,
    refresh_token,
    access_token,
    smtp_host,
    smtp_port,
    smtp_secure,
    smtp_username,
    smtp_password
  } = req.body;

  if (!email || !provider) {
    throw new AppError('Email and provider are required', 400);
  }

  if (provider === 'gmail' && (!client_id || !client_secret || !refresh_token)) {
    throw new AppError('Gmail credentials are incomplete', 400);
  }

  if (provider === 'smtp' && (!smtp_host || !smtp_port || !smtp_username || !smtp_password)) {
    throw new AppError('SMTP credentials are incomplete', 400);
  }

  const result = await query(`
    INSERT INTO sender_accounts (
      email, provider, client_id, client_secret, refresh_token, access_token,
      smtp_host, smtp_port, smtp_secure, smtp_username, smtp_password,
      status, warmup_stage, current_daily_limit
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *
  `, [
    email, provider, client_id, client_secret, refresh_token, access_token,
    smtp_host, smtp_port, smtp_secure, smtp_username, smtp_password,
    'warming_up', 1, 50
  ]);

  res.status(201).json({
    success: true,
    data: { account: result.rows[0] }
  });
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, current_daily_limit } = req.body;

  const updates = [];
  const values = [];
  let paramCount = 1;

  if (status) {
    updates.push(`status = $${paramCount++}`);
    values.push(status);
  }

  if (current_daily_limit !== undefined) {
    updates.push(`current_daily_limit = $${paramCount++}`);
    values.push(current_daily_limit);
  }

  if (updates.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  values.push(id);

  const result = await query(`
    UPDATE sender_accounts
    SET ${updates.join(', ')}, updated_at = NOW()
    WHERE id = $${paramCount} AND archived = false
    RETURNING *
  `, values);

  if (result.rows.length === 0) {
    throw new AppError('Account not found', 404);
  }

  res.json({
    success: true,
    data: { account: result.rows[0] }
  });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(`
    UPDATE sender_accounts
    SET archived = true, status = 'suspended', updated_at = NOW()
    WHERE id = $1 AND archived = false
    RETURNING id, email
  `, [id]);

  if (result.rows.length === 0) {
    throw new AppError('Account not found', 404);
  }

  res.json({
    success: true,
    data: { message: 'Account archived successfully' }
  });
}));

router.get('/:id/stats', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const stats = await query(`
    SELECT 
      COUNT(*) as total_sent,
      COUNT(*) FILTER (WHERE status = 'sent') as successful,
      COUNT(*) FILTER (WHERE status = 'failed') as failed,
      AVG(response_time_ms) as avg_response_time
    FROM send_logs
    WHERE sender_account_id = $1
      AND created_at >= NOW() - INTERVAL '30 days'
  `, [id]);

  const opens = await query(`
    SELECT COUNT(*) as total_opens
    FROM open_events oe
    JOIN send_logs sl ON sl.email_queue_id = oe.email_queue_id
    WHERE sl.sender_account_id = $1
      AND oe.created_at >= NOW() - INTERVAL '30 days'
  `, [id]);

  const clicks = await query(`
    SELECT COUNT(*) as total_clicks
    FROM click_events ce
    JOIN send_logs sl ON sl.email_queue_id = ce.email_queue_id
    WHERE sl.sender_account_id = $1
      AND ce.created_at >= NOW() - INTERVAL '30 days'
  `, [id]);

  res.json({
    success: true,
    data: {
      stats: {
        ...stats.rows[0],
        total_opens: parseInt(opens.rows[0].total_opens),
        total_clicks: parseInt(clicks.rows[0].total_clicks)
      }
    }
  });
}));

module.exports = router;
