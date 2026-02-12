const express = require('express');
const router = express.Router();
const { query } = require('../db/index');

// GET /api/statistics/revenue - Get revenue report
router.get('/revenue', async (req, res, next) => {
  try {
    const {
      date_from = '',
      date_to = '',
      group_by = 'day' // day, week, month
    } = req.query;

    let dateFilter = '';
    let queryParams = [];
    let paramCount = 1;

    if (date_from) {
      dateFilter += ` AND l.created_at >= $${paramCount}`;
      queryParams.push(date_from);
      paramCount++;
    }

    if (date_to) {
      dateFilter += ` AND l.created_at <= $${paramCount}`;
      queryParams.push(date_to);
      paramCount++;
    }

    // Overall totals
    const totalsResult = await query(
      `SELECT
         COUNT(*) as total_leads,
         SUM(l.payout) as total_payout,
         (SELECT COUNT(*) FROM email_logs WHERE campaign_id IS NOT NULL ${dateFilter}) as total_sent,
         (SELECT COUNT(*) FROM click_tracking WHERE clicked = true ${dateFilter}) as total_clicks,
         (SELECT COUNT(*) FROM open_tracking WHERE opened = true ${dateFilter}) as total_opens
       FROM leads l
       WHERE 1=1 ${dateFilter}`,
      queryParams
    );

    // Revenue by period
    let dateGrouping;
    if (group_by === 'month') {
      dateGrouping = `DATE_TRUNC('month', l.created_at)`;
    } else if (group_by === 'week') {
      dateGrouping = `DATE_TRUNC('week', l.created_at)`;
    } else {
      dateGrouping = `DATE_TRUNC('day', l.created_at)`;
    }

    const revenueByPeriodResult = await query(
      `SELECT
         ${dateGrouping} as period,
         COUNT(*) as leads,
         SUM(l.payout) as payout
       FROM leads l
       WHERE 1=1 ${dateFilter}
       GROUP BY period
       ORDER BY period DESC
       LIMIT 30`,
      queryParams
    );

    // Revenue by offer
    const revenueByOfferResult = await query(
      `SELECT
         o.id,
         o.name,
         COUNT(l.id) as leads,
         SUM(l.payout) as payout
       FROM leads l
       INNER JOIN offers o ON l.offer_id = o.id
       WHERE 1=1 ${dateFilter}
       GROUP BY o.id, o.name
       ORDER BY payout DESC NULLS LAST
       LIMIT 20`,
      queryParams
    );

    // Revenue by network
    const revenueByNetworkResult = await query(
      `SELECT
         an.id,
         an.name,
         COUNT(l.id) as leads,
         SUM(l.payout) as payout
       FROM leads l
       INNER JOIN offers o ON l.offer_id = o.id
       LEFT JOIN affiliate_networks an ON o.affiliate_network_id = an.id
       WHERE 1=1 ${dateFilter}
       GROUP BY an.id, an.name
       ORDER BY payout DESC NULLS LAST
       LIMIT 20`,
      queryParams
    );

    // Top performing data lists
    const topListsResult = await query(
      `SELECT
         dl.id,
         dl.name,
         dp.name as provider_name,
         COUNT(l.id) as leads,
         SUM(l.payout) as payout
       FROM leads l
       LEFT JOIN data_lists dl ON l.data_list_id = dl.id
       LEFT JOIN data_providers dp ON dl.data_provider_id = dp.id
       WHERE 1=1 ${dateFilter}
       GROUP BY dl.id, dl.name, dp.name
       ORDER BY payout DESC NULLS LAST
       LIMIT 20`,
      queryParams
    );

    res.json({
      success: true,
      data: {
        totals: totalsResult.rows[0],
        revenue_by_period: revenueByPeriodResult.rows,
        revenue_by_offer: revenueByOfferResult.rows,
        revenue_by_network: revenueByNetworkResult.rows,
        top_lists: topListsResult.rows
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/statistics/dashboard - Get dashboard stats
router.get('/dashboard', async (req, res, next) => {
  try {
    // Today's stats
    const todayStats = await query(
      `SELECT
         (SELECT COUNT(*) FROM email_logs WHERE sent_at >= CURRENT_DATE) as emails_sent_today,
         (SELECT COUNT(*) FROM leads WHERE created_at >= CURRENT_DATE) as leads_today,
         (SELECT SUM(payout) FROM leads WHERE created_at >= CURRENT_DATE) as revenue_today,
         (SELECT COUNT(*) FROM campaigns WHERE status = 'running') as active_campaigns`
    );

    // Last 7 days stats
    const weekStats = await query(
      `SELECT
         (SELECT COUNT(*) FROM email_logs WHERE sent_at >= CURRENT_DATE - INTERVAL '7 days') as emails_sent_week,
         (SELECT COUNT(*) FROM leads WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as leads_week,
         (SELECT SUM(payout) FROM leads WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as revenue_week`
    );

    // Google Accounts quota
    const quotaStats = await query(
      `SELECT
         id,
         name,
         daily_send_limit,
         sends_today,
         (daily_send_limit - sends_today) as remaining,
         status
       FROM google_accounts
       WHERE status = 'active'
       ORDER BY remaining ASC
       LIMIT 10`
    );

    // Auto-responders stats
    const autoResponderStats = await query(
      `SELECT
         COUNT(*) as total_autoresponders,
         COUNT(*) FILTER (WHERE status = 'active') as active,
         COUNT(*) FILTER (WHERE status = 'inactive') as inactive,
         SUM(total_sent) as total_sent,
         SUM(total_opened) as total_opened,
         SUM(total_clicked) as total_clicked
       FROM auto_responders`
    );

    res.json({
      success: true,
      data: {
        today: todayStats.rows[0],
        week: weekStats.rows[0],
        google_accounts: quotaStats.rows,
        auto_responders: autoResponderStats.rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
