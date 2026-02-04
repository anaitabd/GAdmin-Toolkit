require('dotenv').config();
const { fork } = require('child_process');
const { query, closePool } = require('../db');
const logger = require('../utils/logger');

class Orchestrator {
  constructor() {
    this.workers = new Map();
    this.running = false;
    this.healthCheckInterval = parseInt(process.env.HEALTH_CHECK_INTERVAL_MS || '30000');
    this.maxRestarts = parseInt(process.env.MAX_WORKER_RESTARTS || '5');
    this.restartWindow = 60 * 60 * 1000; // 1 hour
  }

  async start() {
    this.running = true;
    logger.info('Orchestrator starting...');

    await this.loadAccounts();
    
    this.healthCheckTimer = setInterval(() => {
      this.checkWorkerHealth();
    }, this.healthCheckInterval);

    this.accountRefreshTimer = setInterval(() => {
      this.refreshAccounts();
    }, 60000); // Check for new accounts every minute

    logger.info('Orchestrator started', { workerCount: this.workers.size });
  }

  async loadAccounts() {
    try {
      const result = await query(`
        SELECT id, email, status 
        FROM sender_accounts 
        WHERE status IN ('active', 'warming_up')
        ORDER BY id
      `);

      for (const account of result.rows) {
        await this.startWorker(account.id);
      }

      logger.info('Loaded accounts', { count: result.rows.length });
    } catch (error) {
      logger.error('Failed to load accounts', { error: error.message });
    }
  }

  async refreshAccounts() {
    try {
      const result = await query(`
        SELECT id, email, status 
        FROM sender_accounts 
        WHERE status IN ('active', 'warming_up')
      `);

      const activeAccountIds = new Set(result.rows.map(a => a.id));

      for (const [accountId, workerInfo] of this.workers.entries()) {
        if (!activeAccountIds.has(accountId)) {
          logger.info('Stopping worker for inactive account', { accountId });
          this.stopWorker(accountId);
        }
      }

      for (const account of result.rows) {
        if (!this.workers.has(account.id)) {
          logger.info('Starting worker for new account', { accountId: account.id });
          await this.startWorker(account.id);
        }
      }
    } catch (error) {
      logger.error('Failed to refresh accounts', { error: error.message });
    }
  }

  async startWorker(accountId) {
    if (this.workers.has(accountId)) {
      logger.warn('Worker already running', { accountId });
      return;
    }

    const workerPath = require('path').join(__dirname, 'sendWorker.js');
    const worker = fork(workerPath, [accountId.toString()], {
      env: { ...process.env, WORKER_ACCOUNT_ID: accountId },
      silent: false
    });

    const workerInfo = {
      process: worker,
      accountId,
      startedAt: Date.now(),
      restarts: [],
      status: 'running'
    };

    worker.on('exit', (code, signal) => {
      logger.warn('Worker exited', { accountId, code, signal });
      this.workers.delete(accountId);
      
      if (this.running && code !== 0) {
        this.handleWorkerCrash(accountId, workerInfo);
      }
    });

    worker.on('error', (error) => {
      logger.error('Worker error', { accountId, error: error.message });
    });

    this.workers.set(accountId, workerInfo);
    logger.info('Worker started', { accountId, pid: worker.pid });
  }

  async handleWorkerCrash(accountId, workerInfo) {
    const now = Date.now();
    
    workerInfo.restarts = workerInfo.restarts.filter(
      timestamp => now - timestamp < this.restartWindow
    );

    if (workerInfo.restarts.length >= this.maxRestarts) {
      logger.error('Worker exceeded max restarts, suspending account', { 
        accountId, 
        restarts: workerInfo.restarts.length 
      });
      
      await query(
        'UPDATE sender_accounts SET status = $1 WHERE id = $2',
        ['suspended', accountId]
      );
      
      return;
    }

    workerInfo.restarts.push(now);
    
    const delay = Math.min(1000 * Math.pow(2, workerInfo.restarts.length), 30000);
    logger.info('Restarting worker', { accountId, delay, attempt: workerInfo.restarts.length });
    
    setTimeout(() => {
      if (this.running) {
        this.startWorker(accountId);
      }
    }, delay);
  }

  stopWorker(accountId) {
    const workerInfo = this.workers.get(accountId);
    if (!workerInfo) {
      return;
    }

    logger.info('Stopping worker', { accountId });
    workerInfo.status = 'stopping';
    
    workerInfo.process.kill('SIGTERM');
    
    setTimeout(() => {
      if (this.workers.has(accountId)) {
        logger.warn('Force killing worker', { accountId });
        workerInfo.process.kill('SIGKILL');
      }
    }, 10000);

    this.workers.delete(accountId);
  }

  checkWorkerHealth() {
    for (const [accountId, workerInfo] of this.workers.entries()) {
      if (!workerInfo.process.connected && workerInfo.process.exitCode === null) {
        logger.warn('Worker appears hung, restarting', { accountId });
        this.stopWorker(accountId);
        this.startWorker(accountId);
      }
    }

    logger.debug('Health check completed', { 
      totalWorkers: this.workers.size,
      runningWorkers: Array.from(this.workers.values()).filter(w => w.status === 'running').length
    });
  }

  async getStats() {
    const stats = {
      totalWorkers: this.workers.size,
      runningWorkers: 0,
      stoppingWorkers: 0,
      workers: []
    };

    for (const [accountId, workerInfo] of this.workers.entries()) {
      if (workerInfo.status === 'running') stats.runningWorkers++;
      if (workerInfo.status === 'stopping') stats.stoppingWorkers++;

      stats.workers.push({
        accountId,
        pid: workerInfo.process.pid,
        status: workerInfo.status,
        uptime: Date.now() - workerInfo.startedAt,
        restarts: workerInfo.restarts.length
      });
    }

    return stats;
  }

  async stop() {
    logger.info('Orchestrator stopping...');
    this.running = false;

    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    if (this.accountRefreshTimer) {
      clearInterval(this.accountRefreshTimer);
    }

    const stopPromises = Array.from(this.workers.keys()).map(accountId => {
      return new Promise((resolve) => {
        this.stopWorker(accountId);
        setTimeout(resolve, 1000);
      });
    });

    await Promise.all(stopPromises);
    await closePool();

    logger.info('Orchestrator stopped');
  }
}

if (require.main === module) {
  const orchestrator = new Orchestrator();

  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down orchestrator...');
    await orchestrator.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down orchestrator...');
    await orchestrator.stop();
    process.exit(0);
  });

  process.on('uncaughtException', async (error) => {
    logger.error('Uncaught exception', { error: error.message, stack: error.stack });
    await orchestrator.stop();
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason, promise) => {
    logger.error('Unhandled rejection', { reason, promise });
    await orchestrator.stop();
    process.exit(1);
  });

  orchestrator.start().catch((error) => {
    logger.error('Failed to start orchestrator', { error: error.message });
    process.exit(1);
  });
}

module.exports = Orchestrator;
