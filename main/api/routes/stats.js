const express = require('express');
const { getDatabase } = require('../db');

const router = express.Router();

// Get system statistics
router.get('/', (req, res, next) => {
  try {
    const db = getDatabase();
    
    // Get counts
    const credentialsCount = db.getAllCredentials(true).length;
    const totalCredentials = db.getAllCredentials(false).length;
    const gsuiteAccountsCount = db.getAllGSuiteAccounts(true).length;
    const totalGSuiteAccounts = db.getAllGSuiteAccounts(false).length;
    
    // Get geographical distribution
    const geoQuery = db.getDatabase().prepare(`
      SELECT country, COUNT(*) as count
      FROM gsuite_accounts
      WHERE is_active = 1 AND country IS NOT NULL
      GROUP BY country
      ORDER BY count DESC
    `);
    const geographicalDistribution = geoQuery.all();
    
    // Get domain distribution
    const domainQuery = db.getDatabase().prepare(`
      SELECT domain, COUNT(*) as count
      FROM gsuite_accounts
      WHERE is_active = 1
      GROUP BY domain
      ORDER BY count DESC
    `);
    const domainDistribution = domainQuery.all();

    const stats = {
      credentials: {
        active: credentialsCount,
        total: totalCredentials,
        inactive: totalCredentials - credentialsCount,
      },
      gsuiteAccounts: {
        active: gsuiteAccountsCount,
        total: totalGSuiteAccounts,
        inactive: totalGSuiteAccounts - gsuiteAccountsCount,
      },
      geographicalDistribution,
      domainDistribution,
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

// Get available countries
router.get('/countries', (req, res, next) => {
  try {
    const db = getDatabase();
    const query = db.getDatabase().prepare(`
      SELECT DISTINCT country, COUNT(*) as account_count
      FROM gsuite_accounts
      WHERE is_active = 1 AND country IS NOT NULL
      GROUP BY country
      ORDER BY country
    `);
    const countries = query.all();

    res.json({ success: true, data: countries });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
