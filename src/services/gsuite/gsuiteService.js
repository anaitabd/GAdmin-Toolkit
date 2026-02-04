const { query } = require('../../db');
const encryptionService = require('../core/encryptionService');
const logger = require('../../utils/logger');

class GSuiteService {
  /**
   * Add a new G Suite domain
   * @param {Object} domainData - Domain information
   * @returns {Object} - Created domain
   */
  async addDomain(domainData) {
    try {
      const { domain, customer_id, admin_email, max_users = 10000, notes = '' } = domainData;

      const result = await query(
        `INSERT INTO gsuite_domains (domain, customer_id, admin_email, max_users, notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [domain, customer_id, admin_email, max_users, notes]
      );

      logger.info('G Suite domain added', { domain, id: result.rows[0].id });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to add G Suite domain', { error: error.message });
      throw error;
    }
  }

  /**
   * Add service account to a domain
   * @param {number} domainId - Domain ID
   * @param {Object} credJson - Service account credentials JSON
   * @returns {Object} - Created service account
   */
  async addServiceAccount(domainId, credJson) {
    try {
      // Encrypt the credentials
      const credentialsEncrypted = encryptionService.encryptJSON(credJson);
      const privateKeyEncrypted = encryptionService.encrypt(credJson.private_key);

      const result = await query(
        `INSERT INTO gsuite_service_accounts 
         (gsuite_domain_id, service_account_email, client_email, private_key_id, 
          credentials_json, private_key_encrypted)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, service_account_email, client_email, status`,
        [
          domainId,
          credJson.client_email,
          credJson.client_email,
          credJson.private_key_id,
          credentialsEncrypted,
          privateKeyEncrypted
        ]
      );

      logger.info('Service account added', { 
        domainId, 
        serviceAccountId: result.rows[0].id 
      });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to add service account', { error: error.message });
      throw error;
    }
  }

  /**
   * Get decrypted service account credentials
   * @param {number} domainId - Domain ID
   * @returns {Object} - Decrypted credentials
   */
  async getServiceAccountCredentials(domainId) {
    try {
      const result = await query(
        `SELECT credentials_json 
         FROM gsuite_service_accounts 
         WHERE gsuite_domain_id = $1 AND status = 'active'
         LIMIT 1`,
        [domainId]
      );

      if (result.rows.length === 0) {
        throw new Error(`No active service account found for domain ${domainId}`);
      }

      const credJson = encryptionService.decryptJSON(result.rows[0].credentials_json);
      return credJson;
    } catch (error) {
      logger.error('Failed to get service account credentials', { 
        error: error.message, 
        domainId 
      });
      throw error;
    }
  }

  /**
   * List domains
   * @returns {Array} - List of domains
   */
  async listDomains() {
    try {
      const result = await query(
        `SELECT id, domain, customer_id, admin_email, status, verified, 
                max_users, auto_create_enabled, created_at, last_sync_at
         FROM gsuite_domains 
         WHERE status != 'deleted'
         ORDER BY created_at DESC`
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to list domains', { error: error.message });
      throw error;
    }
  }

  /**
   * Get domain by ID
   * @param {number} domainId - Domain ID
   * @returns {Object} - Domain details
   */
  async getDomain(domainId) {
    try {
      const result = await query(
        `SELECT d.*, 
                (SELECT COUNT(*) FROM gsuite_users WHERE gsuite_domain_id = d.id) as user_count,
                (SELECT COUNT(*) FROM gsuite_service_accounts WHERE gsuite_domain_id = d.id) as service_account_count
         FROM gsuite_domains d
         WHERE d.id = $1`,
        [domainId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Domain ${domainId} not found`);
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get domain', { error: error.message, domainId });
      throw error;
    }
  }

  /**
   * Update domain sync timestamp
   * @param {number} domainId - Domain ID
   */
  async updateSyncTimestamp(domainId) {
    try {
      await query(
        `UPDATE gsuite_domains 
         SET last_sync_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [domainId]
      );
    } catch (error) {
      logger.error('Failed to update sync timestamp', { error: error.message });
    }
  }

  /**
   * Delete domain (soft delete)
   * @param {number} domainId - Domain ID
   */
  async deleteDomain(domainId) {
    try {
      await query(
        `UPDATE gsuite_domains 
         SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [domainId]
      );

      logger.info('Domain deleted', { domainId });
    } catch (error) {
      logger.error('Failed to delete domain', { error: error.message, domainId });
      throw error;
    }
  }
}

module.exports = new GSuiteService();
