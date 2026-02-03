/**
 * Worker Routes
 * API endpoints for worker management
 */

const express = require('express');
const router = express.Router();
const workerManager = require('../workers/workerManager');
const { query } = require('../db/connection');
const logger = require('../utils/logger');

/**
 * POST /api/workers/start
 * Start email workers to process queue
 */
router.post('/start', async (req, res) => {
  try {
    const { count, emailsPerWorker } = req.body;

    // Check if workers are already running
    const status = workerManager.getStatus();
    if (status.isRunning) {
      return res.status(409).json({
        error: 'Workers are already running',
        status,
      });
    }

    // Start workers asynchronously
    workerManager.startWorkers({ count, emailsPerWorker })
      .then(results => {
        logger.info('Workers completed', results);
      })
      .catch(error => {
        logger.error('Worker error', { error: error.message });
      });

    res.json({
      success: true,
      message: 'Workers started',
      count: count || 5,
    });
  } catch (error) {
    logger.error('Error starting workers', { error: error.message });
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * POST /api/workers/stop
 * Stop all running workers
 */
router.post('/stop', (req, res) => {
  try {
    workerManager.stopAllWorkers();

    res.json({
      success: true,
      message: 'Workers stop signal sent',
    });
  } catch (error) {
    logger.error('Error stopping workers', { error: error.message });
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/workers/status
 * Get worker status
 */
router.get('/status', (req, res) => {
  try {
    const status = workerManager.getStatus();

    res.json({
      success: true,
      ...status,
    });
  } catch (error) {
    logger.error('Error getting worker status', { error: error.message });
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/workers/stats
 * Get worker statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        worker_id,
        emails_sent,
        emails_failed,
        started_at,
        finished_at,
        EXTRACT(EPOCH FROM (finished_at - started_at)) as duration_seconds
      FROM worker_stats
      ORDER BY started_at DESC
      LIMIT 50
    `);

    res.json({
      success: true,
      stats: result.rows,
      count: result.rowCount,
    });
  } catch (error) {
    logger.error('Error fetching worker stats', { error: error.message });
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

module.exports = router;
