const express = require('express');
const router = express.Router();
const { query } = require('../db/index');
const { logAudit, getActionBy } = require('../middleware/auditLog');

// GET /api/sessions - List all active sessions
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const countResult = await query(
      `SELECT COUNT(*) FROM user_sessions
       WHERE expires_at IS NULL OR expires_at > NOW()`
    );

    const result = await query(
      `SELECT s.id, s.session_token, s.ip_address, s.user_agent,
              s.last_activity, s.created_at, s.expires_at,
              u.id as user_id, u.email, u.given_name, u.family_name
       FROM user_sessions s
       INNER JOIN users u ON s.user_id = u.id
       WHERE s.expires_at IS NULL OR s.expires_at > NOW()
       ORDER BY s.last_activity DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
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

// DELETE /api/sessions/:id - Force disconnect session
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const actionBy = getActionBy(req);

    const existingResult = await query('SELECT * FROM user_sessions WHERE id = $1', [id]);
    
    await query('DELETE FROM user_sessions WHERE id = $1', [id]);
    
    if (existingResult.rows.length > 0) {
      await logAudit('user_sessions', id, 'disconnect', actionBy, existingResult.rows[0], null);
    }

    res.json({
      success: true,
      message: 'Session disconnected'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/sessions/bulk - Force disconnect multiple sessions
router.delete('/bulk', async (req, res, next) => {
  try {
    const { session_ids } = req.body;
    const actionBy = getActionBy(req);

    if (!Array.isArray(session_ids) || session_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'session_ids array is required'
      });
    }

    const result = await query(
      'DELETE FROM user_sessions WHERE id = ANY($1) RETURNING id',
      [session_ids]
    );

    await logAudit('user_sessions', null, 'bulk_disconnect', actionBy, null, { count: result.rows.length });

    res.json({
      success: true,
      message: `Disconnected ${result.rows.length} session(s)`
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/sessions/cleanup - Remove expired sessions
router.post('/cleanup', async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM user_sessions WHERE expires_at < NOW() RETURNING id'
    );

    res.json({
      success: true,
      message: `Removed ${result.rows.length} expired session(s)`
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
