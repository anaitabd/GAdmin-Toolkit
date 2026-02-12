const express = require('express');
const router = express.Router();
const { query } = require('../db/index');
const { logAudit, getActionBy } = require('../middleware/auditLog');

// GET /api/headers - List all headers
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 1;

    if (search) {
      whereConditions.push(`name ILIKE $${paramCount}`);
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      whereConditions.push(`status = $${paramCount}`);
      queryParams.push(status);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM predefined_headers ${whereClause}`,
      queryParams
    );

    const result = await query(
      `SELECT * FROM predefined_headers
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

// GET /api/headers/random - Get random header for rotation
router.get('/random', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM predefined_headers
       WHERE status = 'active'
       ORDER BY RANDOM()
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: null
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/headers/:id - Get single header
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query('SELECT * FROM predefined_headers WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Header not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/headers - Create new header
router.post('/', async (req, res, next) => {
  try {
    const { name, value, header_rotation = 'round-robin', status = 'active' } = req.body;
    const actionBy = getActionBy(req);

    if (!name || !value) {
      return res.status(400).json({
        success: false,
        error: 'Name and value are required'
      });
    }

    const result = await query(
      `INSERT INTO predefined_headers (name, value, header_rotation, status, created_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [name, value, header_rotation, status, actionBy]
    );

    const header = result.rows[0];
    await logAudit('predefined_headers', header.id, 'create', actionBy, null, header);

    res.status(201).json({
      success: true,
      data: header
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/headers/:id - Update header
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, value, header_rotation, status } = req.body;
    const actionBy = getActionBy(req);

    const existingResult = await query('SELECT * FROM predefined_headers WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Header not found'
      });
    }

    const oldData = existingResult.rows[0];

    const result = await query(
      `UPDATE predefined_headers
       SET name = COALESCE($1, name),
           value = COALESCE($2, value),
           header_rotation = COALESCE($3, header_rotation),
           status = COALESCE($4, status),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, value, header_rotation, status, id]
    );

    const header = result.rows[0];
    await logAudit('predefined_headers', id, 'update', actionBy, oldData, header);

    res.json({
      success: true,
      data: header
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/headers/:id - Delete header
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const actionBy = getActionBy(req);

    const existingResult = await query('SELECT * FROM predefined_headers WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Header not found'
      });
    }

    await query('DELETE FROM predefined_headers WHERE id = $1', [id]);
    await logAudit('predefined_headers', id, 'delete', actionBy, existingResult.rows[0], null);

    res.json({
      success: true,
      message: 'Header deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
