const express = require('express');
const { asyncHandler } = require('../utils/errorHandler');
const { query } = require('../db');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateAdmin);

router.get('/overview', asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;

  const sendStats = await query(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'sent') as sent,
      COUNT(*) FILTER (WHERE status = 'failed') as failed,
      AVG(response_time_ms) as avg_response_time
    FROM send_logs
    WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `);

  const openStats = await query(`
    SELECT 
      DATE(oe.created_at) as date,
      COUNT(*) as opens,
      COUNT(DISTINCT oe.email_queue_id) as unique_opens
    FROM open_events oe
    WHERE oe.created_at >= NOW() - INTERVAL '${parseInt(days)} days'
    GROUP BY DATE(oe.created_at)
    ORDER BY date DESC
  `);

  const clickStats = await query(`
    SELECT 
      DATE(ce.created_at) as date,
      COUNT(*) as clicks,
      COUNT(DISTINCT ce.email_queue_id) as unique_clicks
    FROM click_events ce
    WHERE ce.created_at >= NOW() - INTERVAL '${parseInt(days)} days'
    GROUP BY DATE(ce.created_at)
    ORDER BY date DESC
  `);

  const bounceStats = await query(`
    SELECT 
      bounce_type,
      COUNT(*) as count
    FROM bounce_list
    WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
    GROUP BY bounce_type
  `);

  res.json({
    success: true,
    data: {
      sends: sendStats.rows,
      opens: openStats.rows,
      clicks: clickStats.rows,
      bounces: bounceStats.rows
    }
  });
}));

router.get('/campaigns/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const stats = await query(`
    SELECT 
      COUNT(*) FILTER (WHERE eq.status = 'sent') as sent,
      COUNT(*) FILTER (WHERE eq.status = 'failed') as failed,
      COUNT(*) FILTER (WHERE eq.status = 'pending') as pending,
      COUNT(DISTINCT oe.id) as opens,
      COUNT(DISTINCT ce.id) as clicks
    FROM email_queue eq
    LEFT JOIN open_events oe ON oe.email_queue_id = eq.id
    LEFT JOIN click_events ce ON ce.email_queue_id = eq.id
    WHERE eq.campaign_id = $1
  `, [id]);

  const timeline = await query(`
    SELECT 
      DATE_TRUNC('hour', sl.created_at) as hour,
      COUNT(*) as sent,
      COUNT(DISTINCT oe.id) as opens,
      COUNT(DISTINCT ce.id) as clicks
    FROM send_logs sl
    LEFT JOIN open_events oe ON oe.email_queue_id = sl.email_queue_id 
      AND oe.created_at >= sl.created_at
    LEFT JOIN click_events ce ON ce.email_queue_id = sl.email_queue_id
      AND ce.created_at >= sl.created_at
    WHERE sl.campaign_id = $1
      AND sl.created_at >= NOW() - INTERVAL '7 days'
    GROUP BY hour
    ORDER BY hour DESC
  `, [id]);

  res.json({
    success: true,
    data: {
      stats: stats.rows[0],
      timeline: timeline.rows
    }
  });
}));

router.get('/accounts/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const stats = await query(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'sent') as sent,
      COUNT(*) FILTER (WHERE status = 'failed') as failed
    FROM send_logs
    WHERE sender_account_id = $1
      AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `, [id]);

  res.json({
    success: true,
    data: { stats: stats.rows }
  });
}));

module.exports = router;
