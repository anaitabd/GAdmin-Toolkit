const { getDatabase } = require('../db');

/**
 * Service for managing G Suite account selection based on geographical preferences
 */
class AccountSelectionService {
  /**
   * Get the best available G Suite account based on criteria
   * @param {Object} criteria - Selection criteria
   * @param {string} criteria.country - Preferred country
   * @param {string} criteria.region - Preferred region
   * @param {string} criteria.domain - Required domain
   * @returns {Object|null} - Selected G Suite account or null if none found
   */
  static getBestAccount(criteria = {}) {
    const db = getDatabase();
    let accounts = db.getAllGSuiteAccounts(true);

    if (accounts.length === 0) {
      return null;
    }

    // Filter by domain if specified
    if (criteria.domain) {
      accounts = accounts.filter((acc) => acc.domain === criteria.domain);
    }

    // Filter by country if specified
    if (criteria.country) {
      const countryAccounts = accounts.filter((acc) => acc.country === criteria.country);
      if (countryAccounts.length > 0) {
        accounts = countryAccounts;
      }
    }

    // Filter by region if specified
    if (criteria.region) {
      const regionAccounts = accounts.filter((acc) => acc.region === criteria.region);
      if (regionAccounts.length > 0) {
        accounts = regionAccounts;
      }
    }

    // Return the first matching account or the first available one
    return accounts[0] || null;
  }

  /**
   * Get all accounts matching criteria
   * @param {Object} criteria - Selection criteria
   * @returns {Array} - Array of matching accounts
   */
  static getMatchingAccounts(criteria = {}) {
    const db = getDatabase();
    const filters = {};

    if (criteria.country) filters.country = criteria.country;
    if (criteria.domain) filters.domain = criteria.domain;

    return db.getAllGSuiteAccounts(true, filters);
  }

  /**
   * Get account with its credential information
   * @param {number} accountId - G Suite account ID
   * @returns {Object} - Account with credential details
   */
  static getAccountWithCredentials(accountId) {
    const db = getDatabase();
    const account = db.getGSuiteAccount(accountId);

    if (!account) {
      return null;
    }

    // Get full credential information
    const credential = db.getCredentialById(account.credential_id);

    return {
      ...account,
      credential: credential
        ? {
            type: credential.type,
            project_id: credential.project_id,
            client_email: credential.client_email,
            private_key: credential.private_key,
          }
        : null,
    };
  }

  /**
   * Get statistics about account usage and availability
   * @returns {Object} - Account statistics
   */
  static getAccountStats() {
    const db = getDatabase();
    const allAccounts = db.getAllGSuiteAccounts(true);

    const stats = {
      totalAccounts: allAccounts.length,
      byCountry: {},
      byDomain: {},
      totalQuota: 0,
      averageQuota: 0,
    };

    allAccounts.forEach((account) => {
      // Count by country
      if (account.country) {
        stats.byCountry[account.country] = (stats.byCountry[account.country] || 0) + 1;
      }

      // Count by domain
      stats.byDomain[account.domain] = (stats.byDomain[account.domain] || 0) + 1;

      // Sum quota
      stats.totalQuota += account.quota_limit || 0;
    });

    stats.averageQuota =
      allAccounts.length > 0 ? Math.round(stats.totalQuota / allAccounts.length) : 0;

    return stats;
  }

  /**
   * Load balance: Get the least recently used account for a domain/country
   * @param {Object} criteria - Selection criteria
   * @returns {Object|null} - Selected account
   */
  static getLoadBalancedAccount(criteria = {}) {
    const accounts = this.getMatchingAccounts(criteria);

    if (accounts.length === 0) {
      return null;
    }

    // For now, return a random account for simple load balancing
    // In a production system, you would track usage and return the least used one
    const randomIndex = Math.floor(Math.random() * accounts.length);
    return accounts[randomIndex];
  }
}

module.exports = AccountSelectionService;
