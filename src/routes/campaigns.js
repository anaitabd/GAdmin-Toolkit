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

module.exports = router;
