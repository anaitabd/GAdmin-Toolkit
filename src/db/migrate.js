const fs = require('fs').promises;
const path = require('path');
const { query, testConnection, closePool, logger } = require('./index');

async function runMigrations() {
  try {
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    await query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of sqlFiles) {
      const version = file.replace('.sql', '');
      
      const result = await query(
        'SELECT version FROM schema_migrations WHERE version = $1',
        [version]
      );

      if (result.rows.length > 0) {
        logger.info(`Migration ${version} already executed, skipping`);
        continue;
      }

      logger.info(`Running migration ${version}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = await fs.readFile(filePath, 'utf8');
      
      await query('BEGIN');
      try {
        await query(sql);
        await query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [version]
        );
        await query('COMMIT');
        logger.info(`Migration ${version} completed successfully`);
      } catch (error) {
        await query('ROLLBACK');
        logger.error(`Migration ${version} failed`, { error: error.message });
        throw error;
      }
    }

    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Migration process failed', { error: error.message, stack: error.stack });
    process.exit(1);
  } finally {
    await closePool();
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
