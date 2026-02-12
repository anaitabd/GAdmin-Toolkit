const express = require('express');
const router = express.Router();
const { query } = require('../db/index');
const fs = require('fs').promises;
const path = require('path');

// GET /api/logs/frontend - Get frontend logs
router.get('/frontend', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      level = '',
      date_from = '',
      date_to = '',
      search = ''
    } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = ['log_type = \'frontend\''];
    let queryParams = [];
    let paramCount = 1;

    if (level) {
      whereConditions.push(`level = $${paramCount}`);
      queryParams.push(level);
      paramCount++;
    }

    if (date_from) {
      whereConditions.push(`created_at >= $${paramCount}`);
      queryParams.push(date_from);
      paramCount++;
    }

    if (date_to) {
      whereConditions.push(`created_at <= $${paramCount}`);
      queryParams.push(date_to);
      paramCount++;
    }

    if (search) {
      whereConditions.push(`message ILIKE $${paramCount}`);
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    const countResult = await query(
      `SELECT COUNT(*) FROM application_logs ${whereClause}`,
      queryParams
    );

    const result = await query(
      `SELECT id, level, message, user_email, context, ip_address, created_at
       FROM application_logs
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...queryParams, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      count: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/logs/backend - Get backend logs
router.get('/backend', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      level = '',
      date_from = '',
      date_to = '',
      search = ''
    } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = ['log_type = \'backend\''];
    let queryParams = [];
    let paramCount = 1;

    if (level) {
      whereConditions.push(`level = $${paramCount}`);
      queryParams.push(level);
      paramCount++;
    }

    if (date_from) {
      whereConditions.push(`created_at >= $${paramCount}`);
      queryParams.push(date_from);
      paramCount++;
    }

    if (date_to) {
      whereConditions.push(`created_at <= $${paramCount}`);
      queryParams.push(date_to);
      paramCount++;
    }

    if (search) {
      whereConditions.push(`message ILIKE $${paramCount}`);
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    const countResult = await query(
      `SELECT COUNT(*) FROM application_logs ${whereClause}`,
      queryParams
    );

    const result = await query(
      `SELECT id, level, message, user_email, context, stack_trace, created_at
       FROM application_logs
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...queryParams, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      count: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/logs/frontend - Create frontend log entry
router.post('/frontend', async (req, res, next) => {
  try {
    const { level, message, context, user_email } = req.body;
    const ip_address = req.ip || req.headers['x-forwarded-for'];
    const user_agent = req.headers['user-agent'];

    await query(
      `INSERT INTO application_logs (
        log_type, level, message, user_email, context, ip_address, user_agent
      )
       VALUES ('frontend', $1, $2, $3, $4, $5, $6)`,
      [level, message, user_email, context, ip_address, user_agent]
    );

    res.json({
      success: true,
      message: 'Log entry created'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
