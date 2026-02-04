const { query } = require('../../db');
const serviceAccountAuth = require('./serviceAccountAuth');
const logger = require('../../utils/logger');

class BulkUserService {
  /**
   * Create users in bulk on Google Workspace
   * @param {number} domainId - Domain ID
   * @param {Array} userIds - Array of user IDs from gsuite_users table
   * @returns {Object} - Creation results
   */
  async bulkCreateUsers(domainId, userIds = null) {
    try {
      // Get admin client
      const { admin } = await serviceAccountAuth.getAdminClient(domainId);

      // Get pending users
      let usersQuery = `
        SELECT id, email, given_name, family_name, password_hash
        FROM gsuite_users
        WHERE gsuite_domain_id = $1 AND status = 'pending'
      `;
      const queryParams = [domainId];

      if (userIds && userIds.length > 0) {
        usersQuery += ` AND id = ANY($2)`;
        queryParams.push(userIds);
      }

      const usersResult = await query(usersQuery, queryParams);
      const users = usersResult.rows;

      if (users.length === 0) {
        return { success: 0, failed: 0, message: 'No pending users to create' };
      }

      logger.info('Starting bulk user creation', { count: users.length, domainId });

      const results = {
        success: 0,
        failed: 0,
        errors: []
      };

      // Rate limiting: 250ms between requests
      const RATE_LIMIT_MS = 250;

      for (const user of users) {
        try {
          // Update status to creating
          await query(
            'UPDATE gsuite_users SET status = $1 WHERE id = $2',
            ['creating', user.id]
          );

          // Create user on Google Workspace
          const response = await admin.users.insert({
            resource: {
              primaryEmail: user.email,
              password: user.password_hash,
              name: {
                givenName: user.given_name,
                familyName: user.family_name
              },
              changePasswordAtNextLogin: false
            }
          });

          // Update user as active
          await query(
            `UPDATE gsuite_users 
             SET status = $1, user_id = $2, google_created_at = CURRENT_TIMESTAMP, 
                 synced_from_google = true
             WHERE id = $3`,
            ['active', response.data.id, user.id]
          );

          results.success++;
          logger.info('User created successfully', { email: user.email });

        } catch (error) {
          // Update user as failed
          await query(
            'UPDATE gsuite_users SET status = $1, creation_error = $2 WHERE id = $3',
            ['failed', error.message, user.id]
          );

          results.failed++;
          results.errors.push({
            email: user.email,
            error: error.message
          });

          logger.error('Failed to create user', { 
            email: user.email, 
            error: error.message 
          });
        }

        // Rate limiting delay
        await this.sleep(RATE_LIMIT_MS);
      }

      logger.info('Bulk user creation completed', results);
      return results;

    } catch (error) {
      logger.error('Bulk user creation failed', { error: error.message, domainId });
      throw error;
    }
  }

  /**
   * Delete users in bulk from Google Workspace
   * @param {number} domainId - Domain ID
   * @param {Array} userEmails - Array of user emails to delete
   * @param {boolean} excludeAdmin - Exclude admin users
   * @returns {Object} - Deletion results
   */
  async bulkDeleteUsers(domainId, userEmails = null, excludeAdmin = true) {
    try {
      // Get admin client
      const { admin } = await serviceAccountAuth.getAdminClient(domainId);

      // Get users to delete
      let usersQuery = `
        SELECT id, email, user_id, is_admin
        FROM gsuite_users
        WHERE gsuite_domain_id = $1 AND status IN ('active', 'suspended')
      `;
      const queryParams = [domainId];

      if (excludeAdmin) {
        usersQuery += ' AND is_admin = false';
      }

      if (userEmails && userEmails.length > 0) {
        usersQuery += ` AND email = ANY($${queryParams.length + 1})`;
        queryParams.push(userEmails);
      }

      const usersResult = await query(usersQuery, queryParams);
      const users = usersResult.rows;

      if (users.length === 0) {
        return { success: 0, failed: 0, message: 'No users to delete' };
      }

      logger.info('Starting bulk user deletion', { count: users.length, domainId });

      const results = {
        success: 0,
        failed: 0,
        errors: []
      };

      // Rate limiting: 250ms between requests
      const RATE_LIMIT_MS = 250;

      for (const user of users) {
        try {
          // Delete user from Google Workspace
          await admin.users.delete({
            userKey: user.email
          });

          // Update user status in database
          await query(
            `UPDATE gsuite_users 
             SET status = $1, deleted_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            ['deleted', user.id]
          );

          results.success++;
          logger.info('User deleted successfully', { email: user.email });

        } catch (error) {
          results.failed++;
          results.errors.push({
            email: user.email,
            error: error.message
          });

          logger.error('Failed to delete user', { 
            email: user.email, 
            error: error.message 
          });
        }

        // Rate limiting delay
        await this.sleep(RATE_LIMIT_MS);
      }

      logger.info('Bulk user deletion completed', results);
      return results;

    } catch (error) {
      logger.error('Bulk user deletion failed', { error: error.message, domainId });
      throw error;
    }
  }

  /**
   * List users from database or Google
   * @param {number} domainId - Domain ID
   * @param {string} source - 'database' or 'google'
   * @returns {Array} - List of users
   */
  async listUsers(domainId, source = 'database') {
    try {
      if (source === 'database') {
        const result = await query(
          `SELECT id, email, given_name, family_name, full_name, status, 
                  is_admin, google_created_at, created_at
           FROM gsuite_users
           WHERE gsuite_domain_id = $1 AND status != 'deleted'
           ORDER BY created_at DESC`,
          [domainId]
        );
        return result.rows;
      } else if (source === 'google') {
        const { admin } = await serviceAccountAuth.getAdminClient(domainId);
        
        // Get domain
        const domainResult = await query(
          'SELECT customer_id FROM gsuite_domains WHERE id = $1',
          [domainId]
        );
        
        if (domainResult.rows.length === 0) {
          throw new Error(`Domain ${domainId} not found`);
        }

        const customerId = domainResult.rows[0].customer_id;

        // List users from Google
        const response = await admin.users.list({
          customer: customerId,
          maxResults: 500
        });

        return response.data.users || [];
      }
    } catch (error) {
      logger.error('Failed to list users', { error: error.message, domainId, source });
      throw error;
    }
  }

  /**
   * Sync users from Google to database
   * @param {number} domainId - Domain ID
   * @returns {Object} - Sync results
   */
  async syncUsersFromGoogle(domainId) {
    try {
      const googleUsers = await this.listUsers(domainId, 'google');
      
      let added = 0;
      let updated = 0;

      for (const googleUser of googleUsers) {
        const existingResult = await query(
          'SELECT id FROM gsuite_users WHERE email = $1',
          [googleUser.primaryEmail]
        );

        if (existingResult.rows.length === 0) {
          // Add new user
          await query(
            `INSERT INTO gsuite_users 
             (gsuite_domain_id, email, user_id, given_name, family_name, 
              status, is_admin, google_created_at, synced_from_google)
             VALUES ($1, $2, $3, $4, $5, 'active', $6, $7, true)`,
            [
              domainId,
              googleUser.primaryEmail,
              googleUser.id,
              googleUser.name.givenName,
              googleUser.name.familyName,
              googleUser.isAdmin || false,
              googleUser.creationTime
            ]
          );
          added++;
        } else {
          // Update existing user
          await query(
            `UPDATE gsuite_users 
             SET user_id = $1, status = 'active', is_admin = $2, 
                 google_last_login_at = $3, synced_from_google = true
             WHERE email = $4`,
            [
              googleUser.id,
              googleUser.isAdmin || false,
              googleUser.lastLoginTime,
              googleUser.primaryEmail
            ]
          );
          updated++;
        }
      }

      logger.info('User sync completed', { domainId, added, updated });
      return { added, updated, total: googleUsers.length };

    } catch (error) {
      logger.error('Failed to sync users from Google', { error: error.message, domainId });
      throw error;
    }
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new BulkUserService();
