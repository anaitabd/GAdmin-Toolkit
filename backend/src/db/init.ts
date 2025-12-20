import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'gadmin_toolkit',
      user: process.env.DB_USER || 'gadmin_user',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

export async function initDatabase(): Promise<void> {
  const pool = getPool();

  try {
    // Test connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    // Create schema
    await createSchema();
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

async function createSchema(): Promise<void> {
  const pool = getPool();

  const schemas = [
    // Jobs table
    `
      CREATE TABLE IF NOT EXISTS jobs (
        id UUID PRIMARY KEY,
        script_key VARCHAR(255) NOT NULL,
        script_path VARCHAR(1024) NOT NULL,
        script_lang VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        params JSONB,
        env JSONB,
        dry_run BOOLEAN DEFAULT FALSE,
        token VARCHAR(100),
        callback_url VARCHAR(1024),
        exit_code INTEGER,
        stdout TEXT,
        stderr TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        duration_ms INTEGER
      )
    `,
    // Create index on status for efficient polling
    `
      CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)
    `,
    // Create index on created_at for sorting
    `
      CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC)
    `,
  ];

  for (const schema of schemas) {
    await pool.query(schema);
  }
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

