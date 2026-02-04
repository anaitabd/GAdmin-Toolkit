require('dotenv').config();
const readline = require('readline');
const { query } = require('../db');
const { hashPassword } = require('../middleware/auth');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createAdmin() {
  try {
    console.log('\n=== Create Admin User ===\n');

    const username = await question('Username: ');
    const password = await question('Password: ');
    const role = await question('Role (admin/user) [admin]: ') || 'admin';

    if (!username || !password) {
      console.error('Username and password are required');
      process.exit(1);
    }

    const existingUser = await query(
      'SELECT id FROM admin_users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      console.error('User already exists');
      process.exit(1);
    }

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

    const passwordHash = await hashPassword(password);

    await query(`
      INSERT INTO admin_users (username, password_hash, role)
      VALUES ($1, $2, $3)
    `, [username, passwordHash, role]);

    console.log('\n✓ Admin user created successfully');
    console.log(`Username: ${username}`);
    console.log(`Role: ${role}\n`);

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
