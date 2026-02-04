const { Pool } = require('pg');
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/database.log' })
  ]
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX || '20'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error('Unexpected database error', { error: err.message, stack: err.stack });
});

pool.on('connect', () => {
  logger.info('New database connection established');
});

async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Query executed', { query: text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    logger.error('Database query error', { query: text, error: error.message });
    throw error;
  }
}

async function getClient() {
  const client = await pool.getClient();
  const originalRelease = client.release.bind(client);
  
  client.release = () => {
    client.release = originalRelease;
    return originalRelease();
  };
  
  return client;
}

async function transaction(callback) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function testConnection() {
  try {
    const result = await query('SELECT NOW() as now, version() as version');
    logger.info('Database connection test successful', { 
      time: result.rows[0].now,
      version: result.rows[0].version.split(' ')[0]
    });
    return true;
  } catch (error) {
    logger.error('Database connection test failed', { error: error.message });
    return false;
  }
}

async function closePool() {
  await pool.end();
  logger.info('Database pool closed');
}

module.exports = {
  query,
  getClient,
  transaction,
  testConnection,
  closePool,
  pool,
  logger
};
