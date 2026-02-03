/**
 * User Routes
 * API endpoints for user management
 */

const express = require('express');
const router = express.Router();
const { query } = require('../db/connection');
const logger = require('../utils/logger');

/**
 * GET /api/users
 * Get all users with pagination
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const result = await query(
      `SELECT id, email, first_name, last_name, created_at, updated_at
       FROM users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      success: true,
      users: result.rows,
      count: result.rowCount,
      limit,
      offset,
    });
  } catch (error) {
    logger.error('Error fetching users', { error: error.message });
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/users/:id
 * Get a specific user by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT id, email, first_name, last_name, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    logger.error('Error fetching user', { error: error.message });
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * POST /api/users
 * Create a new user
 */
router.post('/', async (req, res) => {
  try {
    const { email, first_name, last_name, password } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
      });
    }

    const result = await query(
      `INSERT INTO users (email, first_name, last_name, password)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, first_name, last_name, created_at`,
      [email, first_name, last_name, password]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(409).json({
        error: 'User with this email already exists',
      });
    }

    logger.error('Error creating user', { error: error.message });
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * PUT /api/users/:id
 * Update a user
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name } = req.body;

    const result = await query(
      `UPDATE users
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, email, first_name, last_name, updated_at`,
      [first_name, last_name, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user: result.rows[0],
    });
  } catch (error) {
    logger.error('Error updating user', { error: error.message });
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/users/:id
 * Delete a user
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `DELETE FROM users WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting user', { error: error.message });
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/users/stats
 * Get user statistics
 */
router.get('/stats/overview', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as users_today,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as users_this_week
      FROM users
    `);

    res.json({
      success: true,
      stats: result.rows[0],
    });
  } catch (error) {
    logger.error('Error fetching user stats', { error: error.message });
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

module.exports = router;
