/**
 * Database Migration Script
 * Creates necessary tables and indexes for GAdmin-Toolkit
 */

const { query, initializePool, closePool } = require('./connection');

const migrations = [
  {
    name: 'Create users table',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        password VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
    `,
  },
  {
    name: 'Create email_logs table',
    sql: `
      CREATE TABLE IF NOT EXISTS email_logs (
        id SERIAL PRIMARY KEY,
        recipient VARCHAR(255) NOT NULL,
        subject VARCHAR(500),
        body TEXT,
        status VARCHAR(50) NOT NULL,
        method VARCHAR(50),
        worker_id INTEGER,
        error_message TEXT,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient);
      CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
      CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
    `,
  },
  {
    name: 'Create bounced_emails table',
    sql: `
      CREATE TABLE IF NOT EXISTS bounced_emails (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        bounce_type VARCHAR(100),
        bounce_reason TEXT,
        detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_bounced_emails_email ON bounced_emails(email);
    `,
  },
  {
    name: 'Create admin_users table',
    sql: `
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
    `,
  },
  {
    name: 'Create email_queue table',
    sql: `
      CREATE TABLE IF NOT EXISTS email_queue (
        id SERIAL PRIMARY KEY,
        recipient VARCHAR(255) NOT NULL,
        subject VARCHAR(500),
        body TEXT,
        html_body TEXT,
        priority INTEGER DEFAULT 5,
        status VARCHAR(50) DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
      CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_at ON email_queue(scheduled_at);
      CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON email_queue(priority);
    `,
  },
  {
    name: 'Create worker_stats table',
    sql: `
      CREATE TABLE IF NOT EXISTS worker_stats (
        id SERIAL PRIMARY KEY,
        worker_id INTEGER NOT NULL,
        emails_sent INTEGER DEFAULT 0,
        emails_failed INTEGER DEFAULT 0,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        finished_at TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_worker_stats_worker_id ON worker_stats(worker_id);
    `,
  },
];

/**
 * Run all migrations
 */
const runMigrations = async () => {
  console.log('Starting database migrations...\n');
  
  try {
    // Initialize database pool
    initializePool();
    
    // Run each migration
    for (const migration of migrations) {
      console.log(`Running: ${migration.name}`);
      await query(migration.sql);
      console.log(`✓ Completed: ${migration.name}\n`);
    }
    
    console.log('All migrations completed successfully!');
    return true;
  } catch (error) {
    console.error('Migration failed:', error.message);
    console.error(error.stack);
    return false;
  } finally {
    await closePool();
  }
};

/**
 * Rollback all tables (use with caution!)
 */
const rollback = async () => {
  console.log('WARNING: Rolling back all tables...\n');
  
  try {
    initializePool();
    
    const tables = [
      'worker_stats',
      'email_queue',
      'email_logs',
      'bounced_emails',
      'users',
      'admin_users',
    ];
    
    for (const table of tables) {
      console.log(`Dropping table: ${table}`);
      await query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`✓ Dropped: ${table}\n`);
    }
    
    console.log('Rollback completed!');
    return true;
  } catch (error) {
    console.error('Rollback failed:', error.message);
    return false;
  } finally {
    await closePool();
  }
};

// Run migrations if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--rollback')) {
    rollback().then(() => process.exit(0));
  } else {
    runMigrations().then(() => process.exit(0));
  }
}

module.exports = { runMigrations, rollback };
