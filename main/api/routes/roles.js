const express = require('express');
const router = express.Router();
const { query } = require('../db/index');
const { logAudit, getActionBy } = require('../middleware/auditLog');

// Permission keys definition (from iresponse-pro)
const PERMISSIONS = {
  // Main
  'dashboard': 'Show Dashboard',
  'show-full-report': 'Show Revenue Report',
  'manage-settings': 'Manage Settings',
  'show-auditlogs': 'Show Audit Logs',
  'show-frontend-logs': 'Show Frontend Logs',
  'show-backend-logs': 'Show Backend Logs',
  'show-users-sessions': 'Manage Sessions',
  
  // Users
  'add-users': 'Add Users',
  'show-users': 'Show Users',
  'edit-users': 'Edit Users',
  'delete-users': 'Delete Users',
  
  // Roles
  'add-roles': 'Add Roles',
  'show-roles': 'Show Roles',
  'affect-roles': 'Assign Roles',
  
  // Teams
  'add-teams': 'Add Teams',
  'show-teams': 'Show Teams',
  'manage-teams-authorisations': 'Manage Team Auth',
  
  // Production
  'send-campaigns': 'Send Campaigns',
  'show-campaign-drops': 'Show Campaign Drops',
  'show-campaign-tests': 'Show Campaign Tests',
  'upload-images': 'Upload Images',
  'pause-resume-campaigns': 'Pause/Resume Campaigns',
  'kill-campaigns': 'Kill Campaigns',
  
  // Headers
  'add-headers': 'Add Headers',
  'show-headers': 'Show Headers',
  'edit-headers': 'Edit Headers',
  'delete-headers': 'Delete Headers',
  
  // Auto-Responders
  'create-auto-responders': 'Create AutoResponders',
  'show-auto-responders': 'Show AutoResponders',
  'edit-auto-responders': 'Edit AutoResponders',
  'delete-auto-responders': 'Delete AutoResponders',
  
  // Affiliate Networks
  'add-affiliate-networks': 'Add Networks',
  'show-affiliate-networks': 'Show Networks',
  'edit-affiliate-networks': 'Edit Networks',
  'delete-affiliate-networks': 'Delete Networks',
  
  // Offers
  'add-offers': 'Add Offers',
  'show-offers': 'Show Offers',
  'edit-offers': 'Edit Offers',
  'delete-offers': 'Delete Offers',
  'add-suppression-lists': 'Upload Suppressions',
  
  // Verticals
  'add-verticals': 'Add Verticals',
  'show-verticals': 'Show Verticals',
  'edit-verticals': 'Edit Verticals',
  'delete-verticals': 'Delete Verticals',
  
  // Data Management
  'add-data-providers': 'Add Data Providers',
  'show-data-providers': 'Show Data Providers',
  'import-emails-lists': 'Import Email Lists',
  'data-lists-fetch': 'Fetch Blacklist Emails',
  'black-lists': 'Manage Blacklists',
  
  // Google Accounts
  'add-google-accounts': 'Add Google Accounts',
  'show-google-accounts': 'Show Google Accounts',
  
  // Tools
  'spf-lookup': 'SPF Checker',
  'blacklist-tools': 'Reputation Checker',
  'mailbox-extractor': 'Mailbox Extractor',
  'extractor-tools': 'Value Extractor',
  
  // Leads
  'show-leads': 'Show Leads',
};

// GET /api/roles/permissions - Get all available permissions
router.get('/permissions', async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: PERMISSIONS
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/roles - List all roles
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search = '', role_type = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 1;

    if (search) {
      whereConditions.push(`name ILIKE $${paramCount}`);
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    if (role_type) {
      whereConditions.push(`role_type = $${paramCount}`);
      queryParams.push(role_type);
      paramCount++;
    }

    if (status) {
      whereConditions.push(`status = $${paramCount}`);
      queryParams.push(status);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM roles ${whereClause}`,
      queryParams
    );

    // Get roles with permission counts
    const result = await query(
      `SELECT r.*,
              (SELECT COUNT(*) FROM role_permissions WHERE role_id = r.id) as permission_count,
              (SELECT COUNT(*) FROM user_roles WHERE role_id = r.id) as user_count
       FROM roles r
       ${whereClause}
       ORDER BY r.created_at DESC
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

// GET /api/roles/:id - Get single role with permissions
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const roleResult = await query('SELECT * FROM roles WHERE id = $1', [id]);

    if (roleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }

    // Get permissions for this role
    const permissionsResult = await query(
      'SELECT permission FROM role_permissions WHERE role_id = $1 ORDER BY permission',
      [id]
    );

    const role = roleResult.rows[0];
    role.permissions = permissionsResult.rows.map(p => p.permission);

    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/roles - Create new role
router.post('/', async (req, res, next) => {
  try {
    const { name, role_type = 'team', status = 'active', permissions = [] } = req.body;
    const actionBy = getActionBy(req);

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Role name is required'
      });
    }

    // Create role
    const result = await query(
      `INSERT INTO roles (name, role_type, status, created_by, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [name, role_type, status, actionBy]
    );

    const role = result.rows[0];

    // Add permissions if provided
    if (permissions.length > 0) {
      const permissionValues = permissions.map((perm, idx) => 
        `(${role.id}, $${idx + 1})`
      ).join(', ');

      await query(
        `INSERT INTO role_permissions (role_id, permission)
         VALUES ${permissionValues}
         ON CONFLICT (role_id, permission) DO NOTHING`,
        permissions
      );
    }

    await logAudit('roles', role.id, 'create', actionBy, null, role);

    res.status(201).json({
      success: true,
      data: role
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/roles/:id - Update role
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role_type, status, permissions } = req.body;
    const actionBy = getActionBy(req);

    // Get existing role
    const existingResult = await query('SELECT * FROM roles WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }

    const oldData = existingResult.rows[0];

    // Update role
    const result = await query(
      `UPDATE roles
       SET name = COALESCE($1, name),
           role_type = COALESCE($2, role_type),
           status = COALESCE($3, status),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [name, role_type, status, id]
    );

    const role = result.rows[0];

    // Update permissions if provided
    if (Array.isArray(permissions)) {
      // Remove all existing permissions
      await query('DELETE FROM role_permissions WHERE role_id = $1', [id]);

      // Add new permissions
      if (permissions.length > 0) {
        const permissionValues = permissions.map((perm, idx) => 
          `(${id}, $${idx + 1})`
        ).join(', ');

        await query(
          `INSERT INTO role_permissions (role_id, permission)
           VALUES ${permissionValues}
           ON CONFLICT (role_id, permission) DO NOTHING`,
          permissions
        );
      }
    }

    await logAudit('roles', id, 'update', actionBy, oldData, role);

    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/roles/:id - Delete role
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const actionBy = getActionBy(req);

    // Get existing role
    const existingResult = await query('SELECT * FROM roles WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }

    // Check if role is assigned to any users
    const usageResult = await query(
      'SELECT COUNT(*) FROM user_roles WHERE role_id = $1',
      [id]
    );

    if (parseInt(usageResult.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete role: it is assigned to users'
      });
    }

    await query('DELETE FROM roles WHERE id = $1', [id]);
    await logAudit('roles', id, 'delete', actionBy, existingResult.rows[0], null);

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/roles/:id/users - Get users assigned to role
router.get('/:id/users', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT u.id, u.email, u.given_name, u.family_name, ur.created_at as assigned_at
       FROM users u
       INNER JOIN user_roles ur ON u.id = ur.user_id
       WHERE ur.role_id = $1
       ORDER BY ur.created_at DESC`,
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

// POST /api/roles/:id/assign - Assign role to users
router.post('/:id/assign', async (req, res, next) => {
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

    // Verify role exists
    const roleResult = await query('SELECT * FROM roles WHERE id = $1', [id]);
    if (roleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }

    // Assign role to users
    const values = user_ids.map((userId, idx) => 
      `($${idx * 2 + 1}, $${idx * 2 + 2})`
    ).join(', ');

    const params = [];
    user_ids.forEach(userId => {
      params.push(userId, id);
    });

    await query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ${values}
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      params
    );

    await logAudit('user_roles', id, 'assign', actionBy, null, { role_id: id, user_ids });

    res.json({
      success: true,
      message: `Role assigned to ${user_ids.length} user(s)`
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/roles/:id/users/:userId - Remove role from user
router.delete('/:id/users/:userId', async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const actionBy = getActionBy(req);

    await query(
      'DELETE FROM user_roles WHERE role_id = $1 AND user_id = $2',
      [id, userId]
    );

    await logAudit('user_roles', id, 'unassign', actionBy, { role_id: id, user_id: userId }, null);

    res.json({
      success: true,
      message: 'Role removed from user'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
