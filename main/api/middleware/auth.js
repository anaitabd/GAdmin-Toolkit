const { query } = require('../db/index');

/**
 * Permission-based authorization middleware
 * 
 * Usage: router.get('/offers', requirePermission('show-offers'), handler)
 * 
 * Checks if the user has the required permission by:
 * 1. Extracting user from req.user (set by authentication middleware)
 * 2. Loading user's roles from user_roles
 * 3. Loading permissions from role_permissions
 * 4. Checking if required permission exists
 * 
 * For now, this is a basic implementation. Future enhancements:
 * - Cache permissions in memory or Redis
 * - Add team-based authorization checks
 * - Support multiple permission requirements (AND/OR)
 */

/**
 * Middleware to check if user has required permission
 * @param {string} permission - The permission key to check (e.g., 'show-offers')
 * @returns {Function} Express middleware function
 */
function requirePermission(permission) {
  return async (req, res, next) => {
    try {
      // For now, if no authentication is implemented, allow all requests
      // TODO: Implement proper authentication middleware that sets req.user
      if (!req.user || !req.user.id) {
        // In development, allow all requests
        if (process.env.NODE_ENV === 'development' || process.env.DISABLE_AUTH === 'true') {
          return next();
        }
        
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const userId = req.user.id;

      // Get user's roles
      const rolesResult = await query(
        `SELECT DISTINCT r.id, r.name, r.role_type, r.status
         FROM roles r
         INNER JOIN user_roles ur ON r.id = ur.role_id
         WHERE ur.user_id = $1 AND r.status = 'active'`,
        [userId]
      );

      if (rolesResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'No active roles assigned to user'
        });
      }

      const roleIds = rolesResult.rows.map(r => r.id);

      // Check if any of the user's roles have the required permission
      const permissionResult = await query(
        `SELECT 1
         FROM role_permissions
         WHERE role_id = ANY($1) AND permission = $2
         LIMIT 1`,
        [roleIds, permission]
      );

      if (permissionResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: `Permission denied: ${permission}`
        });
      }

      // User has the required permission
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization check failed'
      });
    }
  };
}

/**
 * Middleware to check if user has ANY of the specified permissions
 * @param {string[]} permissions - Array of permission keys
 * @returns {Function} Express middleware function
 */
function requireAnyPermission(permissions) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        if (process.env.NODE_ENV === 'development' || process.env.DISABLE_AUTH === 'true') {
          return next();
        }
        
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const userId = req.user.id;

      // Get user's roles
      const rolesResult = await query(
        `SELECT DISTINCT r.id
         FROM roles r
         INNER JOIN user_roles ur ON r.id = ur.role_id
         WHERE ur.user_id = $1 AND r.status = 'active'`,
        [userId]
      );

      if (rolesResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'No active roles assigned to user'
        });
      }

      const roleIds = rolesResult.rows.map(r => r.id);

      // Check if any of the user's roles have any of the required permissions
      const permissionResult = await query(
        `SELECT 1
         FROM role_permissions
         WHERE role_id = ANY($1) AND permission = ANY($2)
         LIMIT 1`,
        [roleIds, permissions]
      );

      if (permissionResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: `Permission denied: requires one of [${permissions.join(', ')}]`
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization check failed'
      });
    }
  };
}

/**
 * Get user's permissions (useful for frontend to show/hide UI elements)
 * @param {number} userId - User ID
 * @returns {Promise<string[]>} Array of permission keys
 */
async function getUserPermissions(userId) {
  try {
    const result = await query(
      `SELECT DISTINCT rp.permission
       FROM role_permissions rp
       INNER JOIN user_roles ur ON rp.role_id = ur.role_id
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1 AND r.status = 'active'
       ORDER BY rp.permission`,
      [userId]
    );

    return result.rows.map(row => row.permission);
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return [];
  }
}

module.exports = {
  requirePermission,
  requireAnyPermission,
  getUserPermissions
};
