const express = require('express');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const { query } = require('../db');
const { authenticateAdmin } = require('../middleware/auth');
const ec2Service = require('../services/ec2/ec2Service');

const router = express.Router();

router.use(authenticateAdmin);

// POST /api/campaigns/:id/ec2 - Create EC2 instance for campaign
router.post('/:id/ec2', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { instanceType = 't3.micro', ami } = req.body;

  // Verify campaign exists
  const campaign = await query('SELECT * FROM campaigns WHERE id = $1', [id]);
  
  if (campaign.rows.length === 0) {
    throw new AppError('Campaign not found', 404);
  }

  // Check if EC2 instance already exists for this campaign
  const existing = await query(
    'SELECT * FROM ec2_instances WHERE campaign_id = $1 AND status != $2',
    [id, 'terminated']
  );

  if (existing.rows.length > 0) {
    throw new AppError('EC2 instance already exists for this campaign', 400);
  }

  // Create EC2 instance
  const service = new ec2Service();
  const instance = await service.createInstance(id, instanceType, ami);

  res.status(201).json({
    success: true,
    data: { 
      ec2_instance: instance,
      message: 'EC2 instance creation initiated'
    }
  });
}));

// GET /api/campaigns/:id/ec2 - Get EC2 instance status for campaign
router.get('/:id/ec2', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify campaign exists
  const campaign = await query('SELECT id FROM campaigns WHERE id = $1', [id]);
  
  if (campaign.rows.length === 0) {
    throw new AppError('Campaign not found', 404);
  }

  // Get EC2 instance
  const result = await query(
    `SELECT * FROM ec2_instances 
     WHERE campaign_id = $1 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [id]
  );

  if (result.rows.length === 0) {
    return res.json({
      success: true,
      data: { 
        ec2_instance: null,
        message: 'No EC2 instance found for this campaign'
      }
    });
  }

  res.json({
    success: true,
    data: { ec2_instance: result.rows[0] }
  });
}));

// DELETE /api/campaigns/:id/ec2 - Terminate EC2 instance
router.delete('/:id/ec2', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get EC2 instance
  const result = await query(
    `SELECT * FROM ec2_instances 
     WHERE campaign_id = $1 AND status != $2
     ORDER BY created_at DESC 
     LIMIT 1`,
    [id, 'terminated']
  );

  if (result.rows.length === 0) {
    throw new AppError('No active EC2 instance found for this campaign', 404);
  }

  const instance = result.rows[0];

  // Terminate instance
  const service = new ec2Service();
  await service.terminateInstance(instance.instance_id);

  // Update status in database
  await query(
    `UPDATE ec2_instances 
     SET status = $1, terminated_at = CURRENT_TIMESTAMP 
     WHERE id = $2`,
    ['terminated', instance.id]
  );

  res.json({
    success: true,
    data: { 
      message: 'EC2 instance termination initiated',
      instance_id: instance.instance_id
    }
  });
}));

module.exports = router;
