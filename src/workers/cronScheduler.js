require('dotenv').config();
const cron = require('node-cron');
const { query } = require('../db');
const logger = require('../utils/logger');

async function resetDailyCounters() {
  try {
    const result = await query(`
      UPDATE sender_accounts
      SET emails_sent_today = 0,
          bounces_today = 0,
          consecutive_errors = 0,
          status = CASE 
            WHEN status = 'paused' AND emails_sent_today >= current_daily_limit THEN 'active'
            ELSE status
          END
      WHERE archived = false
      RETURNING id, email, status
    `);

    logger.info('Daily counters reset', { accountsUpdated: result.rowCount });
  } catch (error) {
    logger.error('Failed to reset daily counters', { error: error.message });
  }
}

async function progressWarmup() {
  try {
    const warmupSchedule = [
      { stage: 1, limit: 50, days: 7 },
      { stage: 2, limit: 100, days: 7 },
      { stage: 3, limit: 250, days: 7 },
      { stage: 4, limit: 500, days: 7 },
      { stage: 5, limit: 1000, days: 7 },
      { stage: 6, limit: 2000, days: 7 }
    ];

    const result = await query(`
      SELECT id, email, warmup_stage, warmup_started_at
      FROM sender_accounts
      WHERE status = 'warming_up' AND archived = false
    `);

    for (const account of result.rows) {
      const currentStage = warmupSchedule.find(s => s.stage === account.warmup_stage);
      if (!currentStage) continue;

      const daysSinceStart = Math.floor(
        (Date.now() - new Date(account.warmup_started_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceStart >= currentStage.days) {
        const nextStage = warmupSchedule.find(s => s.stage === account.warmup_stage + 1);

        if (nextStage) {
          await query(`
            UPDATE sender_accounts
            SET warmup_stage = $1, current_daily_limit = $2
            WHERE id = $3
          `, [nextStage.stage, nextStage.limit, account.id]);

          logger.info('Account progressed to next warmup stage', {
            accountId: account.id,
            email: account.email,
            newStage: nextStage.stage,
            newLimit: nextStage.limit
          });
        } else {
          await query(`
            UPDATE sender_accounts
            SET status = 'active'
            WHERE id = $1
          `, [account.id]);

          logger.info('Account warmup completed', {
            accountId: account.id,
            email: account.email
          });
        }
      }
    }
  } catch (error) {
    logger.error('Failed to progress warmup', { error: error.message });
  }
}

async function checkBounceRates() {
  try {
    const result = await query(`
      SELECT 
        sa.id,
        sa.email,
        sa.emails_sent_today,
        sa.bounces_today
      FROM sender_accounts sa
      WHERE sa.status IN ('active', 'warming_up')
        AND sa.emails_sent_today > 0
        AND sa.archived = false
    `);

    for (const account of result.rows) {
      const bounceRate = (account.bounces_today / account.emails_sent_today) * 100;

      if (bounceRate > 5) {
        await query(`
          UPDATE sender_accounts
          SET status = 'paused'
          WHERE id = $1
        `, [account.id]);

        logger.warn('Account paused due to high bounce rate', {
          accountId: account.id,
          email: account.email,
          bounceRate: bounceRate.toFixed(2)
        });
      }
    }
  } catch (error) {
    logger.error('Failed to check bounce rates', { error: error.message });
  }
}

async function archiveOldLogs() {
  try {
    const retentionDays = parseInt(process.env.LOG_RETENTION_DAYS || '90');

    const result = await query(`
      DELETE FROM send_logs
      WHERE created_at < NOW() - INTERVAL '${retentionDays} days'
    `);

    logger.info('Old logs archived', { rowsDeleted: result.rowCount });
  } catch (error) {
    logger.error('Failed to archive old logs', { error: error.message });
  }
}

function startCronJobs() {
  logger.info('Starting cron jobs...');

  cron.schedule('0 0 * * *', async () => {
    logger.info('Running daily counter reset job');
    await resetDailyCounters();
  });

  cron.schedule('0 1 * * *', async () => {
    logger.info('Running warmup progression job');
    await progressWarmup();
  });

  cron.schedule('0 * * * *', async () => {
    logger.info('Running bounce rate check job');
    await checkBounceRates();
  });

  cron.schedule('0 3 1 * *', async () => {
    logger.info('Running log archival job');
    await archiveOldLogs();
  });

  logger.info('Cron jobs started');
}

if (require.main === module) {
  startCronJobs();

  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, stopping cron jobs');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('Received SIGINT, stopping cron jobs');
    process.exit(0);
  });
}

module.exports = { startCronJobs };
