const express = require('express');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const { query } = require('../db');
const { authenticateAdmin } = require('../middleware/auth');
const route53Service = require('../services/ec2/route53Service');

const router = express.Router();

router.use(authenticateAdmin);

// GET /api/tracking-domains - List all tracking domains
router.get('/', asyncHandler(async (req, res) => {
  const { status } = req.query;

  let queryText = `
    SELECT 
      td.*,
      c.name as campaign_name,
      sc.status as ssl_status,
      sc.expires_at as ssl_expires_at
    FROM tracking_domains td
    LEFT JOIN campaigns c ON c.id = td.campaign_id
    LEFT JOIN ssl_certificates sc ON sc.id = td.ssl_certificate_id
  `;

  const params = [];
  
  if (status) {
    queryText += ' WHERE td.status = $1';
    params.push(status);
  }

  queryText += ' ORDER BY td.created_at DESC';

  const result = await query(queryText, params);

  // Calculate SSL days remaining for each domain
  const domains = result.rows.map(domain => {
    let sslDaysRemaining = null;
    if (domain.ssl_expires_at) {
      const now = new Date();
      const expiresAt = new Date(domain.ssl_expires_at);
      sslDaysRemaining = Math.floor((expiresAt - now) / (1000 * 60 * 60 * 24));
    }

    return {
      ...domain,
      ssl_days_remaining: sslDaysRemaining
    };
  });

  res.json({
    success: true,
    data: { 
      tracking_domains: domains,
      total: domains.length
    }
  });
}));

// POST /api/tracking-domains - Add new tracking domain
router.post('/', asyncHandler(async (req, res) => {
  const { domain, provider = 'aws_route53', hosted_zone_id } = req.body;

  if (!domain) {
    throw new AppError('Domain is required', 400);
  }

  // Validate domain format
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
  if (!domainRegex.test(domain)) {
    throw new AppError('Invalid domain format', 400);
  }

  // Check if domain already exists
  const existing = await query(
    'SELECT id FROM tracking_domains WHERE full_domain = $1',
    [domain]
  );

  if (existing.rows.length > 0) {
    throw new AppError('Domain already exists', 400);
  }

  // Insert domain
  const result = await query(`
    INSERT INTO tracking_domains (
      full_domain, provider, hosted_zone_id, status
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [domain, provider, hosted_zone_id, 'available']);

  res.status(201).json({
    success: true,
    data: { 
      tracking_domain: result.rows[0],
      message: 'Tracking domain added successfully'
    }
  });
}));

// DELETE /api/tracking-domains/:id - Delete tracking domain
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get domain
  const domain = await query(
    'SELECT * FROM tracking_domains WHERE id = $1',
    [id]
  );

  if (domain.rows.length === 0) {
    throw new AppError('Tracking domain not found', 404);
  }

  // Check if domain is assigned to a campaign
  if (domain.rows[0].campaign_id) {
    throw new AppError('Cannot delete domain that is assigned to a campaign. Please unassign it first.', 400);
  }

  // Delete domain
  await query('DELETE FROM tracking_domains WHERE id = $1', [id]);

  res.json({
    success: true,
    data: { 
      message: 'Tracking domain deleted successfully',
      domain: domain.rows[0].full_domain
    }
  });
}));

// POST /api/tracking-domains/:id/verify - Verify domain health
router.post('/:id/verify', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get domain
  const domain = await query(
    'SELECT * FROM tracking_domains WHERE id = $1',
    [id]
  );

  if (domain.rows.length === 0) {
    throw new AppError('Tracking domain not found', 404);
  }

  const domainData = domain.rows[0];

  // Verify DNS propagation
  const service = new route53Service();
  let verified = false;
  let statusUpdate = domainData.status;

  try {
    verified = await service.verifyDNSPropagation(domainData.full_domain);
    
    if (verified && domainData.status !== 'active') {
      statusUpdate = 'active';
      await query(
        `UPDATE tracking_domains 
         SET status = $1, verified_at = CURRENT_TIMESTAMP, last_checked_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [statusUpdate, id]
      );
    } else {
      await query(
        'UPDATE tracking_domains SET last_checked_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );
    }
  } catch (error) {
    // Update last checked time even if verification failed
    await query(
      'UPDATE tracking_domains SET last_checked_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
    throw error;
  }

  res.json({
    success: true,
    data: {
      tracking_domain: domainData.full_domain,
      verified,
      status: statusUpdate,
      message: verified ? 'Domain is active and responding' : 'Domain verification failed'
    }
  });
}));

// GET /api/tracking-domains/available - Get available domains for assignment
router.get('/available', asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT * FROM tracking_domains
    WHERE status = 'available' AND campaign_id IS NULL
    ORDER BY created_at DESC
  `);

  res.json({
    success: true,
    data: { 
      available_domains: result.rows,
      count: result.rows.length
    }
  });
}));

module.exports = router;
