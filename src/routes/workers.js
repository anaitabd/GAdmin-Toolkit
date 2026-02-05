const express = require('express');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const { query } = require('../db');
const { authenticateAdmin } = require('../middleware/auth');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

router.use(authenticateAdmin);

// In-memory reference to orchestrator (if running in same process)
// Otherwise, this would need to communicate with orchestrator process via IPC or Redis
let orchestratorInstance = null;

// Try to get orchestrator instance if available
try {
  const { orchestratorInstance: orch } = require('../workers/orchestrator');
  if (orch) {
    orchestratorInstance = orch;
  }
} catch (error) {
  // Orchestrator not running in this process
}

// GET /api/workers - List all active workers
router.get('/', asyncHandler(async (req, res) => {
  // Get all sender accounts that should have workers
  const accounts = await query(`
    SELECT 
      sa.id, sa.email, sa.status, sa.last_heartbeat, sa.last_used_at,
      sa.daily_sent, sa.daily_limit, sa.created_at
    FROM sender_accounts sa
    WHERE sa.status IN ('active', 'warming_up')
    ORDER BY sa.last_heartbeat DESC NULLS LAST
  `);

  const workers = [];

  for (const account of accounts.rows) {
    let workerStatus = {
      accountId: account.id,
      email: account.email,
      accountStatus: account.status,
      lastHeartbeat: account.last_heartbeat,
      dailySent: account.daily_sent,
      dailyLimit: account.daily_limit,
      processStatus: 'unknown', // Will be updated if orchestrator available
      uptime: null
    };

    // Try to get actual worker status from orchestrator if available
    if (orchestratorInstance && typeof orchestratorInstance.getWorkerStatus === 'function') {
      const workerInfo = orchestratorInstance.getWorkerStatus(account.id);
      if (workerInfo) {
        workerStatus.processStatus = workerInfo.status;
        workerStatus.uptime = workerInfo.uptime;
        workerStatus.pid = workerInfo.pid;
        workerStatus.restarts = workerInfo.restarts;
      } else {
        workerStatus.processStatus = 'not_running';
      }
    }

    workers.push(workerStatus);
  }

  res.json({
    success: true,
    data: { 
      workers,
      total: workers.length,
      orchestratorAvailable: orchestratorInstance !== null
    }
  });
}));

// GET /api/workers/:accountId/status - Get specific worker status
router.get('/:accountId/status', asyncHandler(async (req, res) => {
  const { accountId } = req.params;

  // Get account info
  const account = await query(
    `SELECT * FROM sender_accounts WHERE id = $1`,
    [accountId]
  );

  if (account.rows.length === 0) {
    throw new AppError('Sender account not found', 404);
  }

  const accountData = account.rows[0];

  // Get recent send stats
  const stats = await query(`
    SELECT 
      COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
      COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
      MAX(sent_at) as last_sent_at
    FROM send_logs
    WHERE sender_account_id = $1
      AND sent_at >= NOW() - INTERVAL '1 hour'
  `, [accountId]);

  let workerProcessInfo = null;
  if (orchestratorInstance && typeof orchestratorInstance.getWorkerStatus === 'function') {
    workerProcessInfo = orchestratorInstance.getWorkerStatus(parseInt(accountId));
  }

  res.json({
    success: true,
    data: {
      account: {
        id: accountData.id,
        email: accountData.email,
        status: accountData.status,
        dailySent: accountData.daily_sent,
        dailyLimit: accountData.daily_limit,
        dailyBounces: accountData.daily_bounces,
        dailyErrors: accountData.daily_errors,
        lastUsedAt: accountData.last_used_at,
        lastHeartbeat: accountData.last_heartbeat
      },
      workerProcess: workerProcessInfo || { status: 'unknown', message: 'Orchestrator not available' },
      recentStats: stats.rows[0],
      orchestratorAvailable: orchestratorInstance !== null
    }
  });
}));

// POST /api/workers/:accountId/start - Start a worker
router.post('/:accountId/start', asyncHandler(async (req, res) => {
  const { accountId } = req.params;

  if (!orchestratorInstance) {
    throw new AppError('Orchestrator not available in this process. Please start workers via the orchestrator process.', 503);
  }

  // Verify account exists and is active
  const account = await query(
    `SELECT * FROM sender_accounts WHERE id = $1`,
    [accountId]
  );

  if (account.rows.length === 0) {
    throw new AppError('Sender account not found', 404);
  }

  if (!['active', 'warming_up', 'paused'].includes(account.rows[0].status)) {
    throw new AppError(`Cannot start worker for account with status: ${account.rows[0].status}`, 400);
  }

  // Activate account if paused
  if (account.rows[0].status === 'paused') {
    await query(
      'UPDATE sender_accounts SET status = $1 WHERE id = $2',
      ['active', accountId]
    );
  }

  // Start worker
  await orchestratorInstance.startWorker(parseInt(accountId));

  res.json({
    success: true,
    data: { 
      message: 'Worker started successfully',
      accountId: parseInt(accountId)
    }
  });
}));

// POST /api/workers/:accountId/stop - Stop a worker
router.post('/:accountId/stop', asyncHandler(async (req, res) => {
  const { accountId } = req.params;

  if (!orchestratorInstance) {
    throw new AppError('Orchestrator not available in this process', 503);
  }

  // Stop worker
  orchestratorInstance.stopWorker(parseInt(accountId));

  // Optionally pause the account
  await query(
    'UPDATE sender_accounts SET status = $1 WHERE id = $2',
    ['paused', accountId]
  );

  res.json({
    success: true,
    data: { 
      message: 'Worker stopped successfully',
      accountId: parseInt(accountId)
    }
  });
}));

// POST /api/workers/:accountId/restart - Restart a worker
router.post('/:accountId/restart', asyncHandler(async (req, res) => {
  const { accountId } = req.params;

  if (!orchestratorInstance) {
    throw new AppError('Orchestrator not available in this process', 503);
  }

  // Verify account exists
  const account = await query(
    `SELECT * FROM sender_accounts WHERE id = $1`,
    [accountId]
  );

  if (account.rows.length === 0) {
    throw new AppError('Sender account not found', 404);
  }

  // Restart worker
  await orchestratorInstance.restartWorker(parseInt(accountId));

  res.json({
    success: true,
    data: { 
      message: 'Worker restarted successfully',
      accountId: parseInt(accountId)
    }
  });
}));

// GET /api/workers/:accountId/logs - Get worker logs
router.get('/:accountId/logs', asyncHandler(async (req, res) => {
  const { accountId } = req.params;
  const { limit = 100 } = req.query;

  // Verify account exists
  const account = await query(
    `SELECT * FROM sender_accounts WHERE id = $1`,
    [accountId]
  );

  if (account.rows.length === 0) {
    throw new AppError('Sender account not found', 404);
  }

  // Get recent send logs for this account
  const logs = await query(`
    SELECT 
      id, recipient_email, status, error_message, error_code,
      sent_at, response_time_ms, retry_attempt, campaign_id
    FROM send_logs
    WHERE sender_account_id = $1
    ORDER BY sent_at DESC
    LIMIT $2
  `, [accountId, parseInt(limit)]);

  // Try to get worker logs from file system if available
  let fileLog = null;
  try {
    const logPath = path.join(__dirname, '../logs', `worker-${accountId}.log`);
    const exists = await fs.access(logPath).then(() => true).catch(() => false);
    
    if (exists) {
      const content = await fs.readFile(logPath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      fileLog = lines.slice(-parseInt(limit));
    }
  } catch (error) {
    // Log file not available
  }

  res.json({
    success: true,
    data: {
      accountId: parseInt(accountId),
      email: account.rows[0].email,
      sendLogs: logs.rows,
      fileLogs: fileLog,
      limit: parseInt(limit)
    }
  });
}));

// GET /api/workers/metrics - Get global worker metrics
router.get('/metrics', asyncHandler(async (req, res) => {
  // Get overall metrics from last hour
  const metrics = await query(`
    SELECT 
      COUNT(*) as total_sent,
      COUNT(*) FILTER (WHERE status = 'sent') as successful,
      COUNT(*) FILTER (WHERE status = 'failed') as failed,
      COUNT(*) FILTER (WHERE status = 'bounced') as bounced,
      AVG(response_time_ms) as avg_response_time,
      COUNT(DISTINCT sender_account_id) as active_senders
    FROM send_logs
    WHERE sent_at >= NOW() - INTERVAL '1 hour'
  `);

  // Calculate emails per second (approximate)
  const emailsPerSecond = metrics.rows[0].total_sent > 0 
    ? (metrics.rows[0].total_sent / 3600).toFixed(2) 
    : 0;

  // Calculate error rate
  const errorRate = metrics.rows[0].total_sent > 0
    ? ((metrics.rows[0].failed + metrics.rows[0].bounced) / metrics.rows[0].total_sent * 100).toFixed(2)
    : 0;

  // Get orchestrator stats if available
  let orchestratorStats = null;
  if (orchestratorInstance && typeof orchestratorInstance.getStats === 'function') {
    orchestratorStats = await orchestratorInstance.getStats();
  }

  res.json({
    success: true,
    data: {
      lastHour: {
        totalSent: parseInt(metrics.rows[0].total_sent),
        successful: parseInt(metrics.rows[0].successful),
        failed: parseInt(metrics.rows[0].failed),
        bounced: parseInt(metrics.rows[0].bounced),
        emailsPerSecond: parseFloat(emailsPerSecond),
        errorRate: parseFloat(errorRate),
        avgResponseTime: Math.round(metrics.rows[0].avg_response_time || 0),
        activeSenders: parseInt(metrics.rows[0].active_senders)
      },
      orchestrator: orchestratorStats
    }
  });
}));

module.exports = router;
