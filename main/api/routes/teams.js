const express = require('express');
const router = express.Router();
const { query } = require('../db/index');
const { logAudit, getActionBy } = require('../middleware/auditLog');

// GET /api/teams - List all teams
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
      `SELECT COUNT(*) FROM teams ${whereClause}`,
      queryParams
    );

    const result = await query(
      `SELECT t.*,
              (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count,
              (SELECT COUNT(*) FROM team_authorizations WHERE team_id = t.id) as authorization_count
       FROM teams t
       ${whereClause}
       ORDER BY t.created_at DESC
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

// GET /api/teams/:id - Get single team
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query('SELECT * FROM teams WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
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

// POST /api/teams - Create new team
router.post('/', async (req, res, next) => {
  try {
    const { name, status = 'active' } = req.body;
    const actionBy = getActionBy(req);

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Team name is required'
      });
    }

    const result = await query(
      `INSERT INTO teams (name, status, created_by, updated_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [name, status, actionBy]
    );

    const team = result.rows[0];
    await logAudit('teams', team.id, 'create', actionBy, null, team);

    res.status(201).json({
      success: true,
      data: team
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/teams/:id - Update team
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;
    const actionBy = getActionBy(req);

    const existingResult = await query('SELECT * FROM teams WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    const oldData = existingResult.rows[0];

    const result = await query(
      `UPDATE teams
       SET name = COALESCE($1, name),
           status = COALESCE($2, status),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [name, status, id]
    );

    const team = result.rows[0];
    await logAudit('teams', id, 'update', actionBy, oldData, team);

    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/teams/:id - Delete team
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const actionBy = getActionBy(req);

    const existingResult = await query('SELECT * FROM teams WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    await query('DELETE FROM teams WHERE id = $1', [id]);
    await logAudit('teams', id, 'delete', actionBy, existingResult.rows[0], null);

    res.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/teams/:id/members - Get team members
router.get('/:id/members', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT u.id, u.email, u.given_name, u.family_name, tm.created_at as joined_at
       FROM users u
       INNER JOIN team_members tm ON u.id = tm.user_id
       WHERE tm.team_id = $1
       ORDER BY tm.created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/teams/:id/members - Add members to team
router.post('/:id/members', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user_ids } = req.body;
    const actionBy = getActionBy(req);

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'user_ids array is required'
      });
    }

    const values = user_ids.map((userId, idx) => 
      `($${idx * 2 + 1}, $${idx * 2 + 2})`
    ).join(', ');

    const params = [];
    user_ids.forEach(userId => {
      params.push(id, userId);
    });

    await query(
      `INSERT INTO team_members (team_id, user_id)
       VALUES ${values}
       ON CONFLICT (team_id, user_id) DO NOTHING`,
      params
    );

    await logAudit('team_members', id, 'add', actionBy, null, { team_id: id, user_ids });

    res.json({
      success: true,
      message: `Added ${user_ids.length} member(s) to team`
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/teams/:id/members/:userId - Remove member from team
router.delete('/:id/members/:userId', async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const actionBy = getActionBy(req);

    await query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2',
      [id, userId]
    );

    await logAudit('team_members', id, 'remove', actionBy, { team_id: id, user_id: userId }, null);

    res.json({
      success: true,
      message: 'Member removed from team'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/teams/:id/authorizations - Get team authorizations
router.get('/:id/authorizations', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT * FROM team_authorizations
       WHERE team_id = $1
       ORDER BY resource_type, resource_id`,
      [id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/teams/:id/authorizations - Add authorization
router.post('/:id/authorizations', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resource_type, resource_ids } = req.body;
    const actionBy = getActionBy(req);

    if (!resource_type || !Array.isArray(resource_ids) || resource_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'resource_type and resource_ids array are required'
      });
    }

    const values = resource_ids.map((resId, idx) => 
      `($${idx * 2 + 1}, $${idx * 2 + 2}, $${idx * 2 + 3})`
    ).join(', ');

    const params = [];
    resource_ids.forEach(resId => {
      params.push(id, resource_type, resId);
    });

    await query(
      `INSERT INTO team_authorizations (team_id, resource_type, resource_id)
       VALUES ${values}
       ON CONFLICT (team_id, resource_type, resource_id) DO NOTHING`,
      params
    );

    await logAudit('team_authorizations', id, 'add', actionBy, null, { team_id: id, resource_type, resource_ids });

    res.json({
      success: true,
      message: `Added ${resource_ids.length} authorization(s)`
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/teams/:id/authorizations/:authId - Remove authorization
router.delete('/:id/authorizations/:authId', async (req, res, next) => {
  try {
    const { authId } = req.params;
    const actionBy = getActionBy(req);

    const existingResult = await query('SELECT * FROM team_authorizations WHERE id = $1', [authId]);
    
    await query('DELETE FROM team_authorizations WHERE id = $1', [authId]);
    
    if (existingResult.rows.length > 0) {
      await logAudit('team_authorizations', authId, 'remove', actionBy, existingResult.rows[0], null);
    }

    res.json({
      success: true,
      message: 'Authorization removed'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
