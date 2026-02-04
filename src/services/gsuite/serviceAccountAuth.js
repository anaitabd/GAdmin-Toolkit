const { google } = require('googleapis');
const { query } = require('../../db');
const encryptionService = require('../core/encryptionService');
const logger = require('../../utils/logger');

class ServiceAccountAuth {
  /**
   * Create JWT client for G Suite service account with impersonation
   * @param {Object} credJson - Service account credentials JSON
   * @param {string} impersonateUser - User email to impersonate
   * @param {Array<string>} scopes - OAuth scopes
   * @returns {Object} - Authorized JWT client
   */
  async getAuthClient(credJson, impersonateUser, scopes = ['https://mail.google.com/']) {
    try {
      const jwtClient = new google.auth.JWT(
        credJson.client_email,
        null,
        credJson.private_key,
        scopes,
        impersonateUser
      );

      await jwtClient.authorize();
      logger.info('JWT authorization successful', { 
        impersonateUser, 
        clientEmail: credJson.client_email 
      });

      return jwtClient;
    } catch (error) {
      logger.error('JWT authorization failed', { 
        error: error.message, 
        impersonateUser 
      });
      throw error;
    }
  }

  /**
   * Get Gmail API client for a sender account
   * @param {number} senderAccountId - Sender account ID
   * @returns {Object} - Gmail API client
   */
  async getGmailClient(senderAccountId) {
    try {
      // Get sender account details
      const accountResult = await query(
        `SELECT sa.*, gsa.credentials_json, sa.impersonate_user
         FROM sender_accounts sa
         JOIN gsuite_service_accounts gsa ON sa.service_account_id = gsa.id
         WHERE sa.id = $1 AND sa.auth_type = 'gmail_jwt'`,
        [senderAccountId]
      );

      if (accountResult.rows.length === 0) {
        throw new Error(`Sender account ${senderAccountId} not found or not JWT type`);
      }

      const account = accountResult.rows[0];
      
      // Decrypt credentials
      const credJson = encryptionService.decryptJSON(account.credentials_json);
      
      // Get JWT client
      const authClient = await this.getAuthClient(
        credJson,
        account.impersonate_user,
        ['https://mail.google.com/', 'https://www.googleapis.com/auth/gmail.send']
      );

      // Create Gmail API client
      const gmail = google.gmail({ version: 'v1', auth: authClient });

      return { gmail, authClient, account };
    } catch (error) {
      logger.error('Failed to get Gmail client', { 
        error: error.message, 
        senderAccountId 
      });
      throw error;
    }
  }

  /**
   * Get Admin Directory API client for a domain
   * @param {number} domainId - G Suite domain ID
   * @returns {Object} - Admin Directory API client
   */
  async getAdminClient(domainId) {
    try {
      // Get domain and service account details
      const result = await query(
        `SELECT d.admin_email, gsa.credentials_json
         FROM gsuite_domains d
         JOIN gsuite_service_accounts gsa ON gsa.gsuite_domain_id = d.id
         WHERE d.id = $1 AND gsa.status = 'active'
         LIMIT 1`,
        [domainId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Domain ${domainId} not found or no active service account`);
      }

      const { admin_email, credentials_json } = result.rows[0];
      
      // Decrypt credentials
      const credJson = encryptionService.decryptJSON(credentials_json);
      
      // Get JWT client with admin scopes
      const authClient = await this.getAuthClient(
        credJson,
        admin_email,
        ['https://www.googleapis.com/auth/admin.directory.user']
      );

      // Create Admin Directory API client
      const admin = google.admin({ version: 'directory_v1', auth: authClient });

      return { admin, authClient };
    } catch (error) {
      logger.error('Failed to get Admin client', { 
        error: error.message, 
        domainId 
      });
      throw error;
    }
  }

  /**
   * Test service account authentication
   * @param {Object} credJson - Service account credentials
   * @param {string} impersonateUser - User to impersonate
   * @returns {boolean} - True if authentication successful
   */
  async testAuth(credJson, impersonateUser) {
    try {
      const authClient = await this.getAuthClient(credJson, impersonateUser);
      
      // Test with Gmail API
      const gmail = google.gmail({ version: 'v1', auth: authClient });
      await gmail.users.getProfile({ userId: 'me' });
      
      logger.info('Service account test successful', { impersonateUser });
      return true;
    } catch (error) {
      logger.error('Service account test failed', { 
        error: error.message, 
        impersonateUser 
      });
      return false;
    }
  }
}

module.exports = new ServiceAccountAuth();
