require('dotenv').config();
const { query } = require('../db');
const bcrypt = require('bcrypt');

async function quickCreateAdmin() {
  try {
    console.log('Creating admin user...');

    // Create table
    await query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        active BOOLEAN DEFAULT true,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if admin exists
    const existing = await query(
      'SELECT id FROM admin_users WHERE username = $1',
      ['admin']
    );

    if (existing.rows.length > 0) {
      console.log('⚠️  Admin user already exists');
      process.exit(0);
    }

    // Create admin
    const passwordHash = await bcrypt.hash('admin123', 10);
    await query(
      'INSERT INTO admin_users (username, password_hash, role) VALUES ($1, $2, $3)',
      ['admin', passwordHash, 'admin']
    );

    console.log('✅ Admin user created successfully');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('');
    console.log('⚠️  Change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

quickCreateAdmin();
