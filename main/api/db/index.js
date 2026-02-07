const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

const query = (text, params) => pool.query(text, params);

const withClient = async (fn) => {
    const client = await pool.connect();
    try {
        return await fn(client);
    } finally {
        client.release();
    }
};

module.exports = {
    pool,
    query,
    withClient,
};
