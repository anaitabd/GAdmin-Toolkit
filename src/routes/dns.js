const express = require('express');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const { query } = require('../db');
const { authenticateAdmin } = require('../middleware/auth');
const route53Service = require('../services/ec2/route53Service');

const router = express.Router();

router.use(authenticateAdmin);

// POST /api/campaigns/:id/dns - Configure DNS for campaign
router.post('/:id/dns', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { domain, subdomain } = req.body;

  // Verify campaign exists
  const campaign = await query('SELECT * FROM campaigns WHERE id = $1', [id]);
  
  if (campaign.rows.length === 0) {
    throw new AppError('Campaign not found', 404);
  }

  // Check if EC2 instance exists
  const ec2Result = await query(
    `SELECT * FROM ec2_instances 
     WHERE campaign_id = $1 AND status = $2`,
    [id, 'running']
  );

  if (ec2Result.rows.length === 0) {
    throw new AppError('No running EC2 instance found. Please create an EC2 instance first.', 400);
  }

  // Configure DNS
  const service = new route53Service();
  const dnsConfig = await service.setupDNSForCampaign(id, subdomain);

  // Update campaign with tracking domain
  await query(
    'UPDATE campaigns SET tracking_domain = $1 WHERE id = $2',
    [dnsConfig.fullDomain, id]
  );

  res.status(201).json({
    success: true,
    data: { 
      dns_config: dnsConfig,
      message: 'DNS records created successfully'
    }
  });
}));

// GET /api/campaigns/:id/dns - Verify DNS propagation
router.get('/:id/dns', asyncHandler(async (req, res) => {
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
        dns_verified: false,
        message: 'No tracking domain configured for this campaign'
      }
    });
  }

  // Get tracking domain details
  const domainResult = await query(
    'SELECT * FROM tracking_domains WHERE full_domain = $1',
    [trackingDomain]
  );

  if (domainResult.rows.length === 0) {
    return res.json({
      success: true,
      data: { 
        dns_verified: false,
        tracking_domain: trackingDomain,
        message: 'Tracking domain record not found'
      }
    });
  }

  const domainRecord = domainResult.rows[0];

  // Verify DNS propagation
  const service = new route53Service();
  const verified = await service.verifyDNSPropagation(trackingDomain);

  // Update domain status if verified
  if (verified && domainRecord.status !== 'active') {
    await query(
      'UPDATE tracking_domains SET status = $1, verified_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['active', domainRecord.id]
    );
  }

  res.json({
    success: true,
    data: { 
      dns_verified: verified,
      tracking_domain: trackingDomain,
      domain_status: verified ? 'active' : domainRecord.status,
      last_checked: new Date().toISOString()
    }
  });
}));

// DELETE /api/campaigns/:id/dns - Delete DNS records
router.delete('/:id/dns', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get campaign
  const campaign = await query('SELECT * FROM campaigns WHERE id = $1', [id]);
  
  if (campaign.rows.length === 0) {
    throw new AppError('Campaign not found', 404);
  }

  const trackingDomain = campaign.rows[0].tracking_domain;

  if (!trackingDomain) {
    throw new AppError('No tracking domain configured for this campaign', 400);
  }

  // Get domain record
  const domainResult = await query(
    'SELECT * FROM tracking_domains WHERE full_domain = $1',
    [trackingDomain]
  );

  if (domainResult.rows.length > 0) {
    const domainRecord = domainResult.rows[0];

    // Delete DNS records from Route53
    const service = new route53Service();
    await service.deleteDNSRecords(domainRecord.id);

    // Update tracking domain status
    await query(
      'UPDATE tracking_domains SET status = $1, campaign_id = NULL WHERE id = $2',
      ['available', domainRecord.id]
    );
  }

  // Clear tracking domain from campaign
  await query(
    'UPDATE campaigns SET tracking_domain = NULL WHERE id = $1',
    [id]
  );

  res.json({
    success: true,
    data: { 
      message: 'DNS records deleted successfully',
      tracking_domain: trackingDomain
    }
  });
}));

module.exports = router;
