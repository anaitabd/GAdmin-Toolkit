const express = require('express');
const { asyncHandler } = require('../utils/errorHandler');
const { hashPassword, comparePassword, generateToken } = require('../middleware/auth');
const { query } = require('../db');
const { AppError } = require('../utils/errorHandler');

const router = express.Router();

router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new AppError('Username and password are required', 400);
  }

  const result = await query(
    'SELECT id, username, password_hash, role FROM admin_users WHERE username = $1 AND active = true',
    [username]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid credentials', 401);
  }

  const user = result.rows[0];
  const isValidPassword = await comparePassword(password, user.password_hash);

  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401);
  }

  const token = await generateToken(user.id, user.role);

  await query(
    'UPDATE admin_users SET last_login_at = NOW() WHERE id = $1',
    [user.id]
  );

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    }
  });
}));

module.exports = router;
