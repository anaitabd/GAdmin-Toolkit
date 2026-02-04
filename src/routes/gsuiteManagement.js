const express = require('express');
const router = express.Router();
const gsuiteService = require('../services/gsuite/gsuiteService');
const userGeneratorService = require('../services/gsuite/userGeneratorService');
const bulkUserService = require('../services/gsuite/bulkUserService');
const serviceAccountAuth = require('../services/gsuite/serviceAccountAuth');
const { query } = require('../db');
const logger = require('../utils/logger');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * GET /api/gsuite/domains
 * List all G Suite domains
 */
router.get('/domains', async (req, res) => {
  try {
    const domains = await gsuiteService.listDomains();
    res.json({ success: true, domains });
  } catch (error) {
    logger.error('Failed to list domains', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/gsuite/domains/:id
 * Get domain details
 */
router.get('/domains/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const domain = await gsuiteService.getDomain(parseInt(id));
    res.json({ success: true, domain });
  } catch (error) {
    logger.error('Failed to get domain', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/gsuite/domains
 * Add a new G Suite domain
 */
router.post('/domains', async (req, res) => {
  try {
    const { domain, customer_id, admin_email, max_users, notes } = req.body;

    if (!domain || !customer_id || !admin_email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: domain, customer_id, admin_email' 
      });
    }

    const newDomain = await gsuiteService.addDomain({
      domain,
      customer_id,
      admin_email,
      max_users,
      notes
    });

    res.status(201).json({ success: true, domain: newDomain });
  } catch (error) {
    logger.error('Failed to add domain', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/gsuite/domains/:id
 * Delete (soft delete) a G Suite domain
 */
router.delete('/domains/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await gsuiteService.deleteDomain(parseInt(id));
    res.json({ success: true, message: 'Domain deleted' });
  } catch (error) {
    logger.error('Failed to delete domain', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/gsuite/domains/:id/service-accounts
 * Upload service account credentials JSON
 */
router.post('/domains/:id/service-accounts', upload.single('credJson'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No credentials file uploaded' 
      });
    }

    // Parse JSON from uploaded file
    const credJson = JSON.parse(req.file.buffer.toString('utf8'));

    // Validate JSON structure
    if (!credJson.client_email || !credJson.private_key || !credJson.private_key_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid credentials JSON format' 
      });
    }

    // Add service account
    const serviceAccount = await gsuiteService.addServiceAccount(parseInt(id), credJson);

    res.status(201).json({ 
      success: true, 
      serviceAccount,
      message: 'Service account added successfully' 
    });
  } catch (error) {
    logger.error('Failed to add service account', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/gsuite/domains/:id/service-accounts
 * List service accounts for a domain
 */
router.get('/domains/:id/service-accounts', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT id, service_account_email, client_email, status, 
              last_auth_success_at, created_at
       FROM gsuite_service_accounts
       WHERE gsuite_domain_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    res.json({ success: true, serviceAccounts: result.rows });
  } catch (error) {
    logger.error('Failed to list service accounts', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/gsuite/domains/:id/users/generate
 * Generate fake users for a domain
 */
router.post('/domains/:id/users/generate', async (req, res) => {
  try {
    const { id } = req.params;
    const { count, password } = req.body;

    if (!count || count <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid count parameter' 
      });
    }

    const users = await userGeneratorService.generateAndSave(
      parseInt(id), 
      parseInt(count), 
      password || 'Password123@'
    );

    res.status(201).json({ 
      success: true, 
      count: users.length,
      users,
      message: `Generated ${users.length} users` 
    });
  } catch (error) {
    logger.error('Failed to generate users', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/gsuite/domains/:id/users/bulk-create
 * Create users in bulk on Google Workspace
 */
router.post('/domains/:id/users/bulk-create', async (req, res) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body; // Optional: specific user IDs to create

    // Start bulk creation asynchronously
    bulkUserService.bulkCreateUsers(parseInt(id), userIds)
      .then(results => {
        logger.info('Bulk user creation completed', results);
      })
      .catch(error => {
        logger.error('Bulk user creation failed', { error: error.message });
      });

    res.json({ 
      success: true, 
      message: 'Bulk user creation started in background' 
    });
  } catch (error) {
    logger.error('Failed to start bulk user creation', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/gsuite/domains/:id/users/bulk-delete
 * Delete users in bulk from Google Workspace
 */
router.delete('/domains/:id/users/bulk-delete', async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmails, excludeAdmin } = req.body;

    // Start bulk deletion asynchronously
    bulkUserService.bulkDeleteUsers(parseInt(id), userEmails, excludeAdmin !== false)
      .then(results => {
        logger.info('Bulk user deletion completed', results);
      })
      .catch(error => {
        logger.error('Bulk user deletion failed', { error: error.message });
      });

    res.json({ 
      success: true, 
      message: 'Bulk user deletion started in background' 
    });
  } catch (error) {
    logger.error('Failed to start bulk user deletion', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/gsuite/domains/:id/users
 * List users for a domain
 */
router.get('/domains/:id/users', async (req, res) => {
  try {
    const { id } = req.params;
    const { source } = req.query; // 'database' or 'google'

    const users = await bulkUserService.listUsers(
      parseInt(id), 
      source || 'database'
    );

    res.json({ success: true, users });
  } catch (error) {
    logger.error('Failed to list users', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/gsuite/domains/:id/sync
 * Sync users from Google to database
 */
router.post('/domains/:id/sync', async (req, res) => {
  try {
    const { id } = req.params;

    const results = await bulkUserService.syncUsersFromGoogle(parseInt(id));
    await gsuiteService.updateSyncTimestamp(parseInt(id));

    res.json({ 
      success: true, 
      results,
      message: `Synced ${results.total} users (${results.added} added, ${results.updated} updated)` 
    });
  } catch (error) {
    logger.error('Failed to sync users', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/gsuite/domains/:id/create-senders
 * Create sender_accounts from gsuite_users
 */
router.post('/domains/:id/create-senders', async (req, res) => {
  try {
    const { id } = req.params;

    // Get active users
    const usersResult = await query(
      `SELECT gu.id, gu.email, gd.domain
       FROM gsuite_users gu
       JOIN gsuite_domains gd ON gu.gsuite_domain_id = gd.id
       WHERE gu.gsuite_domain_id = $1 AND gu.status = 'active'
       AND NOT EXISTS (
         SELECT 1 FROM sender_accounts sa WHERE sa.gsuite_user_id = gu.id
       )`,
      [id]
    );

    if (usersResult.rows.length === 0) {
      return res.json({ 
        success: true, 
        count: 0,
        message: 'No users available to create sender accounts' 
      });
    }

    // Get service account ID
    const serviceAccountResult = await query(
      'SELECT id FROM gsuite_service_accounts WHERE gsuite_domain_id = $1 AND status = $2 LIMIT 1',
      [id, 'active']
    );

    if (serviceAccountResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No active service account found for domain' 
      });
    }

    const serviceAccountId = serviceAccountResult.rows[0].id;

    // Create sender accounts
    let created = 0;
    for (const user of usersResult.rows) {
      await query(
        `INSERT INTO sender_accounts 
         (email, display_name, auth_type, gsuite_user_id, gsuite_domain_id, 
          service_account_id, impersonate_user, sending_domain, status)
         VALUES ($1, $2, 'gmail_jwt', $3, $4, $5, $6, $7, 'active')`,
        [user.email, user.email, user.id, id, serviceAccountId, user.email, user.domain]
      );
      created++;
    }

    logger.info('Sender accounts created', { domainId: id, count: created });

    res.json({ 
      success: true, 
      count: created,
      message: `Created ${created} sender accounts` 
    });
  } catch (error) {
    logger.error('Failed to create sender accounts', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/gsuite/test-auth
 * Test service account authentication
 */
router.post('/test-auth', upload.single('credJson'), async (req, res) => {
  try {
    const { impersonateUser } = req.body;

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No credentials file uploaded' 
      });
    }

    if (!impersonateUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing impersonateUser parameter' 
      });
    }

    const credJson = JSON.parse(req.file.buffer.toString('utf8'));
    const testResult = await serviceAccountAuth.testAuth(credJson, impersonateUser);

    res.json({ 
      success: testResult, 
      message: testResult ? 'Authentication successful' : 'Authentication failed' 
    });
  } catch (error) {
    logger.error('Authentication test failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
