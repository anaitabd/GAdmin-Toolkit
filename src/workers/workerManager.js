/**
 * Worker Manager
 * Orchestrates multiple email workers for parallel processing
 */

const SendWorker = require('./sendWorker');
const config = require('../config');
const logger = require('../utils/logger');

class WorkerManager {
  constructor() {
    this.workers = [];
    this.isRunning = false;
  }

  /**
   * Start multiple workers to process email queue
   * @param {Object} options - Worker options
   */
  async startWorkers(options = {}) {
    const {
      count = config.worker.concurrentWorkers,
      emailsPerWorker = config.worker.emailsPerWorker,
    } = options;

    if (this.isRunning) {
      logger.warn('Workers are already running');
      return;
    }

    this.isRunning = true;
    logger.info(`Starting ${count} workers`, { emailsPerWorker });

    try {
      // Create worker promises
      const workerPromises = [];

      for (let i = 1; i <= count; i++) {
        const worker = new SendWorker(i);
        this.workers.push(worker);
        workerPromises.push(worker.start(emailsPerWorker));
      }

      // Wait for all workers to complete
      const results = await Promise.all(workerPromises);

      // Calculate totals
      const totals = results.reduce(
        (acc, result) => ({
          sent: acc.sent + result.emailsSent,
          failed: acc.failed + result.emailsFailed,
        }),
        { sent: 0, failed: 0 }
      );

      logger.info('All workers completed', totals);

      this.isRunning = false;
      this.workers = [];

      return {
        totalSent: totals.sent,
        totalFailed: totals.failed,
        workerResults: results,
      };
    } catch (error) {
      logger.error('Worker manager error', { error: error.message });
      this.isRunning = false;
      this.workers = [];
      throw error;
    }
  }

  /**
   * Stop all running workers
   */
  stopAllWorkers() {
    logger.info('Stopping all workers...');
    
    for (const worker of this.workers) {
      worker.stop();
    }

    this.isRunning = false;
  }

  /**
   * Get worker status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeWorkers: this.workers.length,
    };
  }
}

// Export singleton instance
module.exports = new WorkerManager();
