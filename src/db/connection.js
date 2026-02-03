/**
 * PostgreSQL Database Connection Pool
 * Manages database connections using pg Pool
 */

const { Pool } = require('pg');
const config = require('../config');

let pool = null;

/**
 * Initialize PostgreSQL connection pool
 * @returns {Promise<Pool>} PostgreSQL pool instance
 */
const initializePool = () => {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    user: config.database.user,
    password: config.database.password,
    max: config.database.max,
    idleTimeoutMillis: config.database.idleTimeoutMillis,
    connectionTimeoutMillis: config.database.connectionTimeoutMillis,
  });

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
    process.exit(-1);
  });

  // Log successful connection
  pool.on('connect', () => {
    console.log('New PostgreSQL client connected to the pool');
  });

  return pool;
};

/**
 * Get the database pool
 * @returns {Pool} PostgreSQL pool instance
 */
const getPool = () => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializePool() first.');
  }
  return pool;
};

/**
 * Execute a query
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await getPool().query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Query error:', { text, error: error.message });
    throw error;
  }
};

/**
 * Get a client from the pool (for transactions)
 * @returns {Promise<PoolClient>} Database client
 */
const getClient = async () => {
  return await getPool().connect();
};

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection status
 */
const testConnection = async () => {
  try {
    const result = await query('SELECT NOW() as now');
    console.log('Database connection successful:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
};

/**
 * Close the database pool
 * @returns {Promise<void>}
 */
const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('PostgreSQL pool closed');
  }
};

module.exports = {
  initializePool,
  getPool,
  query,
  getClient,
  testConnection,
  closePool,
};
