const express = require('express');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const { query } = require('../db');
const { authenticateAdmin } = require('../middleware/auth');
const vpsDeploymentService = require('../services/ec2/vpsDeploymentService');
const ec2Service = require('../services/ec2/ec2Service');
const route53Service = require('../services/ec2/route53Service');
const letsEncryptService = require('../services/ec2/letsEncryptService');

const router = express.Router();

router.use(authenticateAdmin);

// POST /api/campaigns/:id/deploy - Full stack deployment orchestration
router.post('/:id/deploy', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    instanceType = 't3.micro',
    subdomain,
    email 
  } = req.body;

  // Verify campaign exists
  const campaign = await query('SELECT * FROM campaigns WHERE id = $1', [id]);
  
  if (campaign.rows.length === 0) {
    throw new AppError('Campaign not found', 404);
  }

  // Initialize deployment log
  const deploymentLogs = [];
  const logStep = (step, status, message) => {
    deploymentLogs.push({
      step,
      status,
      message,
      timestamp: new Date().toISOString()
    });
  };

  try {
    // Update campaign status
    await query(
      `UPDATE campaigns 
       SET deployment_status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      ['deploying', id]
    );

    logStep('init', 'success', 'Deployment started');

    // Step 1: Create EC2 instance
    logStep('ec2', 'in_progress', 'Creating EC2 instance...');
    
    const ec2Svc = new ec2Service();
    const instance = await ec2Svc.createInstance(id, instanceType);
    
    logStep('ec2', 'success', `EC2 instance created: ${instance.instance_id}`);

    // Step 2: Wait for instance to be running and get public IP
    logStep('ec2_wait', 'in_progress', 'Waiting for EC2 instance to be ready...');
    
    let publicIp = null;
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max wait
    
    while (!publicIp && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      const instanceStatus = await query(
        'SELECT public_ip, status FROM ec2_instances WHERE id = $1',
        [instance.id]
      );
      
      if (instanceStatus.rows[0].status === 'running' && instanceStatus.rows[0].public_ip) {
        publicIp = instanceStatus.rows[0].public_ip;
      }
      
      attempts++;
    }

    if (!publicIp) {
      throw new Error('EC2 instance did not get a public IP in time');
    }

    logStep('ec2_wait', 'success', `EC2 instance ready with IP: ${publicIp}`);

    // Step 3: Configure DNS
    logStep('dns', 'in_progress', 'Configuring DNS records...');
    
    const route53Svc = new route53Service();
    const dnsConfig = await route53Svc.setupDNSForCampaign(id, subdomain);
    
    await query(
      'UPDATE campaigns SET tracking_domain = $1 WHERE id = $2',
      [dnsConfig.fullDomain, id]
    );
    
    logStep('dns', 'success', `DNS configured: ${dnsConfig.fullDomain}`);

    // Step 4: Wait for DNS propagation
    logStep('dns_wait', 'in_progress', 'Waiting for DNS propagation (this may take a few minutes)...');
    
    let dnsVerified = false;
    attempts = 0;
    const maxDNSAttempts = 30; // Up to 10 minutes
    
    while (!dnsVerified && attempts < maxDNSAttempts) {
      await new Promise(resolve => setTimeout(resolve, 20000)); // Wait 20 seconds
      
      dnsVerified = await route53Svc.verifyDNSPropagation(dnsConfig.fullDomain);
      
      if (dnsVerified) {
        await query(
          'UPDATE tracking_domains SET status = $1, verified_at = CURRENT_TIMESTAMP WHERE full_domain = $2',
          ['active', dnsConfig.fullDomain]
        );
      }
      
      attempts++;
    }

    if (!dnsVerified) {
      logStep('dns_wait', 'warning', 'DNS not fully propagated yet, but continuing...');
    } else {
      logStep('dns_wait', 'success', 'DNS propagation verified');
    }

    // Step 5: Install SSL certificate
    logStep('ssl', 'in_progress', 'Installing SSL certificate...');
    
    const acmeEmail = email || process.env.LETS_ENCRYPT_EMAIL || 'admin@example.com';
    const letsEncryptSvc = new letsEncryptService();
    
    try {
      const certificate = await letsEncryptSvc.installCertificate(
        dnsConfig.fullDomain,
        publicIp,
        acmeEmail
      );
      
      logStep('ssl', 'success', 'SSL certificate installed successfully');
    } catch (sslError) {
      logStep('ssl', 'warning', `SSL installation failed: ${sslError.message}. Server will run without HTTPS.`);
    }

    // Step 6: Deploy tracking server
    logStep('deploy', 'in_progress', 'Deploying tracking server...');
    
    const vpsDeploymentSvc = new vpsDeploymentService();
    await vpsDeploymentSvc.deployTrackingServer(id, publicIp, dnsConfig.fullDomain);
    
    logStep('deploy', 'success', 'Tracking server deployed successfully');

    // Update campaign deployment status
    await query(
      `UPDATE campaigns 
       SET deployment_status = $1, deployment_logs = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3`,
      ['active', JSON.stringify(deploymentLogs), id]
    );

    logStep('complete', 'success', 'Full stack deployment completed successfully');

    res.status(200).json({
      success: true,
      data: { 
        deployment_status: 'active',
        tracking_domain: dnsConfig.fullDomain,
        public_ip: publicIp,
        logs: deploymentLogs,
        message: 'Full stack deployment completed successfully'
      }
    });

  } catch (error) {
    logStep('error', 'failed', error.message);

    // Update campaign deployment status
    await query(
      `UPDATE campaigns 
       SET deployment_status = $1, deployment_logs = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3`,
      ['failed', JSON.stringify(deploymentLogs), id]
    );

    throw error;
  }
}));

// GET /api/campaigns/:id/deploy/status - Get deployment status
router.get('/:id/deploy/status', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get campaign
  const campaign = await query('SELECT * FROM campaigns WHERE id = $1', [id]);
  
  if (campaign.rows.length === 0) {
    throw new AppError('Campaign not found', 404);
  }

  const campaignData = campaign.rows[0];

  // Get EC2 instance
  const ec2Result = await query(
    `SELECT * FROM ec2_instances 
     WHERE campaign_id = $1 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [id]
  );

  // Get DNS/tracking domain
  let dnsStatus = null;
  if (campaignData.tracking_domain) {
    const domainResult = await query(
      'SELECT * FROM tracking_domains WHERE full_domain = $1',
      [campaignData.tracking_domain]
    );
    
    if (domainResult.rows.length > 0) {
      dnsStatus = {
        domain: campaignData.tracking_domain,
        status: domainResult.rows[0].status,
        verified: domainResult.rows[0].status === 'active'
      };
    }
  }

  // Get SSL certificate
  let sslStatus = null;
  if (campaignData.tracking_domain) {
    const sslResult = await query(
      `SELECT sc.* 
       FROM ssl_certificates sc
       JOIN tracking_domains td ON td.ssl_certificate_id = sc.id
       WHERE td.full_domain = $1
       ORDER BY sc.issued_at DESC
       LIMIT 1`,
      [campaignData.tracking_domain]
    );
    
    if (sslResult.rows.length > 0) {
      const cert = sslResult.rows[0];
      const now = new Date();
      const expiresAt = new Date(cert.expires_at);
      const daysRemaining = Math.floor((expiresAt - now) / (1000 * 60 * 60 * 24));
      
      sslStatus = {
        active: cert.status === 'active',
        expires_at: cert.expires_at,
        days_remaining: daysRemaining
      };
    }
  }

  res.json({
    success: true,
    data: {
      deployment_status: campaignData.deployment_status || 'not_started',
      ec2_status: ec2Result.rows.length > 0 ? {
        instance_id: ec2Result.rows[0].instance_id,
        status: ec2Result.rows[0].status,
        public_ip: ec2Result.rows[0].public_ip,
        created_at: ec2Result.rows[0].created_at
      } : null,
      dns_status: dnsStatus,
      ssl_status: sslStatus,
      deployment_logs: campaignData.deployment_logs ? JSON.parse(campaignData.deployment_logs) : []
    }
  });
}));

module.exports = router;
