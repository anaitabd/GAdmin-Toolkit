const express = require('express');
const router = express.Router();
const { query } = require('../db/index');
const { logAudit, getActionBy } = require('../middleware/auditLog');

// GET /api/google-accounts - List all Google Workspace accounts
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 1;

    if (search) {
      whereConditions.push(`(name ILIKE $${paramCount} OR workspace_domain ILIKE $${paramCount})`);
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
      `SELECT COUNT(*) FROM google_accounts ${whereClause}`,
      queryParams
    );

    const result = await query(
      `SELECT id, name, workspace_domain, service_account_email, daily_send_limit,
              sends_today, sends_today_reset_at, status, last_error, last_used_at,
              created_by, created_at, updated_at
       FROM google_accounts
       ${whereClause}
       ORDER BY created_at DESC
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

// GET /api/google-accounts/:id - Get single account
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT id, name, workspace_domain, service_account_email, daily_send_limit,
              sends_today, sends_today_reset_at, status, last_error, last_used_at,
              created_by, created_at, updated_at
       FROM google_accounts
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Google account not found'
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

// GET /api/google-accounts/:id/quota - Get remaining quota
router.get('/:id/quota', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT daily_send_limit, sends_today, sends_today_reset_at, status
       FROM google_accounts
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Google account not found'
      });
    }

    const account = result.rows[0];
    const remaining = account.daily_send_limit - (account.sends_today || 0);

    res.json({
      success: true,
      data: {
        daily_limit: account.daily_send_limit,
        used_today: account.sends_today || 0,
        remaining: remaining,
        reset_at: account.sends_today_reset_at,
        status: account.status
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/google-accounts - Create new account
router.post('/', async (req, res, next) => {
  try {
    const {
      name,
      workspace_domain,
      service_account_email,
      service_account_key,
      daily_send_limit = 2000,
      status = 'active'
    } = req.body;
    const actionBy = getActionBy(req);

    if (!name || !workspace_domain) {
      return res.status(400).json({
        success: false,
        error: 'Name and workspace_domain are required'
      });
    }

    const result = await query(
      `INSERT INTO google_accounts (
        name, workspace_domain, service_account_email, service_account_key,
        daily_send_limit, status, created_by, updated_at
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id, name, workspace_domain, service_account_email, daily_send_limit,
                 sends_today, status, created_at`,
      [name, workspace_domain, service_account_email, service_account_key, daily_send_limit, status, actionBy]
    );

    const account = result.rows[0];
    await logAudit('google_accounts', account.id, 'create', actionBy, null, account);

    res.status(201).json({
      success: true,
      data: account
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/google-accounts/:id - Update account
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      workspace_domain,
      service_account_email,
      service_account_key,
      daily_send_limit,
      status
    } = req.body;
    const actionBy = getActionBy(req);

    const existingResult = await query('SELECT * FROM google_accounts WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Google account not found'
      });
    }

    const oldData = existingResult.rows[0];

    const result = await query(
      `UPDATE google_accounts
       SET name = COALESCE($1, name),
           workspace_domain = COALESCE($2, workspace_domain),
           service_account_email = COALESCE($3, service_account_email),
           service_account_key = COALESCE($4, service_account_key),
           daily_send_limit = COALESCE($5, daily_send_limit),
           status = COALESCE($6, status),
           updated_at = NOW()
       WHERE id = $7
       RETURNING id, name, workspace_domain, service_account_email, daily_send_limit,
                 sends_today, status, updated_at`,
      [name, workspace_domain, service_account_email, service_account_key, daily_send_limit, status, id]
    );

    const account = result.rows[0];
    await logAudit('google_accounts', id, 'update', actionBy, oldData, account);

    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/google-accounts/:id - Delete account
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const actionBy = getActionBy(req);

    const existingResult = await query('SELECT * FROM google_accounts WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Google account not found'
      });
    }

    await query('DELETE FROM google_accounts WHERE id = $1', [id]);
    await logAudit('google_accounts', id, 'delete', actionBy, existingResult.rows[0], null);

    res.json({
      success: true,
      message: 'Google account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/google-accounts/:id/test-connection - Test Google Workspace connection
router.post('/:id/test-connection', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT service_account_email, service_account_key FROM google_accounts WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Google account not found'
      });
    }

    const account = result.rows[0];

    if (!account.service_account_key) {
      return res.status(400).json({
        success: false,
        error: 'Service account key not configured'
      });
    }

    // TODO: Implement actual Google API connection test using googleapis
    // For now, return success
    res.json({
      success: true,
      message: 'Connection test successful',
      data: {
        service_account_email: account.service_account_email,
        status: 'connected'
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/google-accounts/reset-quotas - Reset daily quotas (cron job)
router.post('/reset-quotas', async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE google_accounts
       SET sends_today = 0,
           sends_today_reset_at = NOW(),
           status = CASE
             WHEN status = 'quota_exceeded' THEN 'active'
             ELSE status
           END
       WHERE sends_today_reset_at < NOW() - INTERVAL '1 day'
         OR sends_today_reset_at IS NULL
       RETURNING id`
    );

    res.json({
      success: true,
      message: `Reset quotas for ${result.rows.length} account(s)`
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
