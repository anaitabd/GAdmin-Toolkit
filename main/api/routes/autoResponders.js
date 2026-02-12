const express = require('express');
const router = express.Router();
const { query } = require('../db/index');
const { logAudit, getActionBy } = require('../middleware/auditLog');

// GET /api/auto-responders - List all auto-responders
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 1;

    if (search) {
      whereConditions.push(`ar.name ILIKE $${paramCount}`);
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      whereConditions.push(`ar.status = $${paramCount}`);
      queryParams.push(status);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM auto_responders ar ${whereClause}`,
      queryParams
    );

    const result = await query(
      `SELECT ar.*,
              o.name as offer_name,
              an.name as network_name,
              c.name as creative_name
       FROM auto_responders ar
       LEFT JOIN offers o ON ar.offer_id = o.id
       LEFT JOIN affiliate_networks an ON ar.affiliate_network_id = an.id
       LEFT JOIN creatives c ON ar.creative_id = c.id
       ${whereClause}
       ORDER BY ar.created_at DESC
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

// GET /api/auto-responders/:id - Get single auto-responder
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT ar.*,
              o.name as offer_name,
              an.name as network_name,
              c.name as creative_name,
              fn.value as from_name,
              s.value as subject
       FROM auto_responders ar
       LEFT JOIN offers o ON ar.offer_id = o.id
       LEFT JOIN affiliate_networks an ON ar.affiliate_network_id = an.id
       LEFT JOIN creatives c ON ar.creative_id = c.id
       LEFT JOIN from_names fn ON ar.from_name_id = fn.id
       LEFT JOIN subjects s ON ar.subject_id = s.id
       WHERE ar.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Auto-responder not found'
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

// POST /api/auto-responders - Create new auto-responder
router.post('/', async (req, res, next) => {
  try {
    const {
      name,
      offer_id,
      affiliate_network_id,
      trigger_type,
      delay_value = 1,
      delay_unit = 'hours',
      creative_id,
      from_name_id,
      subject_id,
      send_limit,
      status = 'active'
    } = req.body;
    const actionBy = getActionBy(req);

    if (!name || !trigger_type) {
      return res.status(400).json({
        success: false,
        error: 'name and trigger_type are required'
      });
    }

    const result = await query(
      `INSERT INTO auto_responders (
        name, offer_id, affiliate_network_id, trigger_type, delay_value, delay_unit,
        creative_id, from_name_id, subject_id, send_limit, status, created_by, updated_at
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       RETURNING *`,
      [
        name, offer_id, affiliate_network_id, trigger_type, delay_value, delay_unit,
        creative_id, from_name_id, subject_id, send_limit, status, actionBy
      ]
    );

    const autoResponder = result.rows[0];
    await logAudit('auto_responders', autoResponder.id, 'create', actionBy, null, autoResponder);

    res.status(201).json({
      success: true,
      data: autoResponder
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/auto-responders/:id - Update auto-responder
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      offer_id,
      affiliate_network_id,
      trigger_type,
      delay_value,
      delay_unit,
      creative_id,
      from_name_id,
      subject_id,
      send_limit,
      status
    } = req.body;
    const actionBy = getActionBy(req);

    const existingResult = await query('SELECT * FROM auto_responders WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Auto-responder not found'
      });
    }

    const oldData = existingResult.rows[0];

    const result = await query(
      `UPDATE auto_responders
       SET name = COALESCE($1, name),
           offer_id = COALESCE($2, offer_id),
           affiliate_network_id = COALESCE($3, affiliate_network_id),
           trigger_type = COALESCE($4, trigger_type),
           delay_value = COALESCE($5, delay_value),
           delay_unit = COALESCE($6, delay_unit),
           creative_id = COALESCE($7, creative_id),
           from_name_id = COALESCE($8, from_name_id),
           subject_id = COALESCE($9, subject_id),
           send_limit = COALESCE($10, send_limit),
           status = COALESCE($11, status),
           updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [
        name, offer_id, affiliate_network_id, trigger_type, delay_value, delay_unit,
        creative_id, from_name_id, subject_id, send_limit, status, id
      ]
    );

    const autoResponder = result.rows[0];
    await logAudit('auto_responders', id, 'update', actionBy, oldData, autoResponder);

    res.json({
      success: true,
      data: autoResponder
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/auto-responders/:id - Delete auto-responder
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const actionBy = getActionBy(req);

    const existingResult = await query('SELECT * FROM auto_responders WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Auto-responder not found'
      });
    }

    await query('DELETE FROM auto_responders WHERE id = $1', [id]);
    await logAudit('auto_responders', id, 'delete', actionBy, existingResult.rows[0], null);

    res.json({
      success: true,
      message: 'Auto-responder deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auto-responders/:id/start - Start auto-responder
router.post('/:id/start', async (req, res, next) => {
  try {
    const { id } = req.params;
    const actionBy = getActionBy(req);

    const result = await query(
      `UPDATE auto_responders
       SET status = 'active',
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Auto-responder not found'
      });
    }

    await logAudit('auto_responders', id, 'start', actionBy, null, result.rows[0]);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Auto-responder started'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auto-responders/:id/stop - Stop auto-responder
router.post('/:id/stop', async (req, res, next) => {
  try {
    const { id } = req.params;
    const actionBy = getActionBy(req);

    const result = await query(
      `UPDATE auto_responders
       SET status = 'inactive',
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Auto-responder not found'
      });
    }

    await logAudit('auto_responders', id, 'stop', actionBy, null, result.rows[0]);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Auto-responder stopped'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auto-responders/:id/logs - Get auto-responder logs
router.get('/:id/logs', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const countResult = await query(
      'SELECT COUNT(*) FROM auto_responder_logs WHERE auto_responder_id = $1',
      [id]
    );

    const result = await query(
      `SELECT * FROM auto_responder_logs
       WHERE auto_responder_id = $1
       ORDER BY sent_at DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
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

module.exports = router;
