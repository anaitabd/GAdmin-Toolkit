const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
    // Enhanced connection pooling settings for better scalability
    max: process.env.DB_POOL_MAX ? Number(process.env.DB_POOL_MAX) : 20, // Maximum pool size
    min: process.env.DB_POOL_MIN ? Number(process.env.DB_POOL_MIN) : 2, // Minimum pool size
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 5000, // Timeout for acquiring connection
    allowExitOnIdle: false, // Keep pool alive
});

// Log pool errors
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle database client', err);
});

// Optional: Log pool events for monitoring
if (process.env.DB_POOL_LOGGING === 'true') {
    pool.on('connect', () => {
        console.log('Database pool: New client connected');
    });
    pool.on('acquire', () => {
        console.log('Database pool: Client acquired');
    });
    pool.on('remove', () => {
        console.log('Database pool: Client removed');
    });
}

const query = (text, params) => pool.query(text, params);

const withClient = async (fn) => {
    const client = await pool.connect();
    try {
        return await fn(client);
    } finally {
        client.release();
    }
};

// Graceful shutdown helper
const closePool = async () => {
    await pool.end();
    console.log('Database pool has ended');
};

module.exports = {
    pool,
    query,
    withClient,
    closePool,
};
