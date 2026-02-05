const express = require('express');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const { query } = require('../db');
const { authenticateAdmin } = require('../middleware/auth');
const letsEncryptService = require('../services/ec2/letsEncryptService');

const router = express.Router();

router.use(authenticateAdmin);

// POST /api/campaigns/:id/ssl - Create SSL certificate
router.post('/:id/ssl', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  // Verify campaign exists
  const campaign = await query('SELECT * FROM campaigns WHERE id = $1', [id]);
  
  if (campaign.rows.length === 0) {
    throw new AppError('Campaign not found', 404);
  }

  const trackingDomain = campaign.rows[0].tracking_domain;

  if (!trackingDomain) {
    throw new AppError('No tracking domain configured. Please configure DNS first.', 400);
  }

  // Verify DNS is active
  const domainResult = await query(
    'SELECT * FROM tracking_domains WHERE full_domain = $1',
    [trackingDomain]
  );

  if (domainResult.rows.length === 0) {
    throw new AppError('Tracking domain record not found', 404);
  }

  if (domainResult.rows[0].status !== 'active') {
    throw new AppError('DNS must be verified before creating SSL certificate', 400);
  }

  // Get EC2 public IP
  const ec2Result = await query(
    `SELECT public_ip FROM ec2_instances 
     WHERE campaign_id = $1 AND status = $2`,
    [id, 'running']
  );

  if (ec2Result.rows.length === 0 || !ec2Result.rows[0].public_ip) {
    throw new AppError('No running EC2 instance with public IP found', 400);
  }

  const publicIp = ec2Result.rows[0].public_ip;
  const acmeEmail = email || process.env.LETS_ENCRYPT_EMAIL || 'admin@example.com';

  // Create SSL certificate
  const service = new letsEncryptService();
  const certificate = await service.installCertificate(trackingDomain, publicIp, acmeEmail);

  res.status(201).json({
    success: true,
    data: { 
      ssl_certificate: certificate,
      message: 'SSL certificate created successfully'
    }
  });
}));

// GET /api/campaigns/:id/ssl - Get SSL certificate status
router.get('/:id/ssl', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify campaign exists
  const campaign = await query('SELECT * FROM campaigns WHERE id = $1', [id]);
  
  if (campaign.rows.length === 0) {
    throw new AppError('Campaign not found', 404);
  }

  const trackingDomain = campaign.rows[0].tracking_domain;

  if (!trackingDomain) {
    return res.json({
      success: true,
      data: { 
        ssl_certificate: null,
        ssl_active: false,
        message: 'No tracking domain configured'
      }
    });
  }

  // Get SSL certificate
  const result = await query(
    `SELECT sc.* 
     FROM ssl_certificates sc
     JOIN tracking_domains td ON td.ssl_certificate_id = sc.id
     WHERE td.full_domain = $1
     ORDER BY sc.issued_at DESC
     LIMIT 1`,
    [trackingDomain]
  );

  if (result.rows.length === 0) {
    return res.json({
      success: true,
      data: { 
        ssl_certificate: null,
        ssl_active: false,
        message: 'No SSL certificate found'
      }
    });
  }

  const certificate = result.rows[0];
  const now = new Date();
  const expiresAt = new Date(certificate.expires_at);
  const daysRemaining = Math.floor((expiresAt - now) / (1000 * 60 * 60 * 24));

  res.json({
    success: true,
    data: { 
      ssl_certificate: certificate,
      ssl_active: certificate.status === 'active',
      days_remaining: daysRemaining,
      needs_renewal: daysRemaining < 30
    }
  });
}));

// POST /api/campaigns/:id/ssl/renew - Renew SSL certificate
router.post('/:id/ssl/renew', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify campaign exists
  const campaign = await query('SELECT * FROM campaigns WHERE id = $1', [id]);
  
  if (campaign.rows.length === 0) {
    throw new AppError('Campaign not found', 404);
  }

  const trackingDomain = campaign.rows[0].tracking_domain;

  if (!trackingDomain) {
    throw new AppError('No tracking domain configured', 400);
  }

  // Get current certificate
  const certResult = await query(
    `SELECT sc.* 
     FROM ssl_certificates sc
     JOIN tracking_domains td ON td.ssl_certificate_id = sc.id
     WHERE td.full_domain = $1
     ORDER BY sc.issued_at DESC
     LIMIT 1`,
    [trackingDomain]
  );

  if (certResult.rows.length === 0) {
    throw new AppError('No SSL certificate found to renew', 404);
  }

  const certificate = certResult.rows[0];

  // Get EC2 public IP
  const ec2Result = await query(
    `SELECT public_ip FROM ec2_instances 
     WHERE campaign_id = $1 AND status = $2`,
    [id, 'running']
  );

  if (ec2Result.rows.length === 0 || !ec2Result.rows[0].public_ip) {
    throw new AppError('No running EC2 instance with public IP found', 400);
  }

  const publicIp = ec2Result.rows[0].public_ip;

  // Renew certificate
  const service = new letsEncryptService();
  const renewed = await service.renewCertificate(certificate.id, trackingDomain, publicIp);

  res.json({
    success: true,
    data: { 
      ssl_certificate: renewed,
      message: 'SSL certificate renewed successfully'
    }
  });
}));

module.exports = router;
