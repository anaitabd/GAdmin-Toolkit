const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { fork } = require('child_process');
const path = require('path');

// In-memory tracking of running campaigns to prevent duplicate executions
const runningCampaigns = new Set();

// GET all campaigns
router.get('/', async (req, res, next) => {
    try {
        const { status, created_by, limit = 100, offset = 0 } = req.query;
        
        let queryText = `
            SELECT c.*, 
                   au.username as creator_username,
                   u.email as sender_email,
                   ei.from_name, ei.subject,
                   et.name as template_name
            FROM campaigns c
            LEFT JOIN admin_users au ON c.created_by = au.id
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN email_info ei ON c.email_info_id = ei.id
            LEFT JOIN email_templates et ON c.email_template_id = et.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            params.push(status);
            queryText += ` AND c.status = $${params.length}`;
        }

        if (created_by) {
            params.push(created_by);
            queryText += ` AND c.created_by = $${params.length}`;
        }

        queryText += ` ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await query(queryText, params);
        res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error) {
        next(error);
    }
});

// GET campaign by ID
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const campaignResult = await query(
            `SELECT c.*, 
                    au.username as creator_username,
                    u.email as sender_email,
                    ei.from_name, ei.subject,
                    et.name as template_name, et.html_content
            FROM campaigns c
            LEFT JOIN admin_users au ON c.created_by = au.id
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN email_info ei ON c.email_info_id = ei.id
            LEFT JOIN email_templates et ON c.email_template_id = et.id
            WHERE c.id = $1`,
            [id]
        );
        
        if (campaignResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Campaign not found' });
        }

        // Get recipients count
        const recipientsResult = await query(
            `SELECT COUNT(*) as total, 
                    SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
                    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
            FROM campaign_recipients WHERE campaign_id = $1`,
            [id]
        );

        const campaign = campaignResult.rows[0];
        campaign.recipients_stats = recipientsResult.rows[0];

        res.json({ success: true, data: campaign });
    } catch (error) {
        next(error);
    }
});

// POST create new campaign
router.post('/', async (req, res, next) => {
    try {
        const { 
            name, 
            description, 
            created_by, 
            user_id, 
            email_info_id, 
            email_template_id,
            recipient_ids,
            scheduled_at
        } = req.body;
        
        if (!name) {
            return res.status(400).json({ success: false, error: 'Campaign name is required' });
        }

        // Validate required references
        if (user_id) {
            const userCheck = await query('SELECT id FROM users WHERE id = $1', [user_id]);
            if (userCheck.rows.length === 0) {
                return res.status(400).json({ success: false, error: 'Invalid user_id' });
            }
        }

        if (email_info_id) {
            const infoCheck = await query('SELECT id FROM email_info WHERE id = $1', [email_info_id]);
            if (infoCheck.rows.length === 0) {
                return res.status(400).json({ success: false, error: 'Invalid email_info_id' });
            }
        }

        if (email_template_id) {
            const templateCheck = await query('SELECT id FROM email_templates WHERE id = $1', [email_template_id]);
            if (templateCheck.rows.length === 0) {
                return res.status(400).json({ success: false, error: 'Invalid email_template_id' });
            }
        }

        if (created_by) {
            const adminCheck = await query('SELECT id FROM admin_users WHERE id = $1', [created_by]);
            if (adminCheck.rows.length === 0) {
                return res.status(400).json({ success: false, error: 'Invalid created_by (admin_user_id)' });
            }
        }

        // Create campaign
        const campaignResult = await query(
            `INSERT INTO campaigns (name, description, created_by, user_id, email_info_id, email_template_id, scheduled_at, total_recipients) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, 0) 
            RETURNING *`,
            [name, description || null, created_by || null, user_id || null, email_info_id || null, email_template_id || null, scheduled_at || null]
        );

        const campaign = campaignResult.rows[0];

        // Add recipients if provided
        if (recipient_ids && Array.isArray(recipient_ids) && recipient_ids.length > 0) {
            // Validate recipient_ids exist in email_data
            const recipientsCheck = await query(
                'SELECT id FROM email_data WHERE id = ANY($1::int[])',
                [recipient_ids]
            );

            if (recipientsCheck.rows.length !== recipient_ids.length) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Some recipient_ids are invalid',
                    valid_count: recipientsCheck.rows.length,
                    provided_count: recipient_ids.length
                });
            }

            // Insert campaign recipients using unnest for efficient bulk insert
            await query(
                `INSERT INTO campaign_recipients (campaign_id, email_data_id, status) 
                SELECT $1, unnest($2::int[]), 'pending'`,
                [campaign.id, recipient_ids]
            );

            // Update total_recipients count
            await query(
                'UPDATE campaigns SET total_recipients = $1 WHERE id = $2',
                [recipient_ids.length, campaign.id]
            );

            campaign.total_recipients = recipient_ids.length;
        }

        res.status(201).json({ success: true, data: campaign });
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({ success: false, error: 'Campaign name already exists' });
        }
        next(error);
    }
});

// PUT update campaign
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { 
            name, 
            description, 
            user_id, 
            email_info_id, 
            email_template_id, 
            status,
            scheduled_at
        } = req.body;

        // Check if campaign exists
        const checkResult = await query('SELECT id, status FROM campaigns WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Campaign not found' });
        }

        // Don't allow updating campaigns that are running or completed
        const currentStatus = checkResult.rows[0].status;
        if (['running', 'completed'].includes(currentStatus) && status && status !== currentStatus) {
            return res.status(400).json({ 
                success: false, 
                error: `Cannot change status of ${currentStatus} campaign` 
            });
        }

        // Validate status if provided
        if (status) {
            const validStatuses = ['draft', 'scheduled', 'running', 'completed', 'paused', 'failed'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ 
                    success: false, 
                    error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
                });
            }
        }

        const result = await query(
            `UPDATE campaigns 
            SET name = COALESCE($1, name), 
                description = COALESCE($2, description),
                user_id = COALESCE($3, user_id),
                email_info_id = COALESCE($4, email_info_id),
                email_template_id = COALESCE($5, email_template_id),
                status = COALESCE($6, status),
                scheduled_at = COALESCE($7, scheduled_at),
                updated_at = NOW()
            WHERE id = $8 
            RETURNING *`,
            [name || null, description || null, user_id || null, email_info_id || null, email_template_id || null, status || null, scheduled_at || null, id]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ success: false, error: 'Campaign name already exists' });
        }
        next(error);
    }
});

// DELETE campaign
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Check if campaign is running
        const checkResult = await query('SELECT status FROM campaigns WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Campaign not found' });
        }

        if (checkResult.rows[0].status === 'running') {
            return res.status(400).json({ 
                success: false, 
                error: 'Cannot delete a running campaign. Pause it first.' 
            });
        }

        const result = await query('DELETE FROM campaigns WHERE id = $1 RETURNING *', [id]);
        res.json({ success: true, message: 'Campaign deleted', data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// POST add recipients to campaign
router.post('/:id/recipients', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { recipient_ids } = req.body;

        if (!recipient_ids || !Array.isArray(recipient_ids) || recipient_ids.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'recipient_ids array is required and must not be empty' 
            });
        }

        // Check if campaign exists
        const campaignCheck = await query('SELECT id, status FROM campaigns WHERE id = $1', [id]);
        if (campaignCheck.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Campaign not found' });
        }

        if (campaignCheck.rows[0].status === 'running') {
            return res.status(400).json({ 
                success: false, 
                error: 'Cannot add recipients to a running campaign' 
            });
        }

        // Validate recipient_ids exist in email_data
        const recipientsCheck = await query(
            'SELECT id FROM email_data WHERE id = ANY($1::int[])',
            [recipient_ids]
        );

        if (recipientsCheck.rows.length !== recipient_ids.length) {
            return res.status(400).json({ 
                success: false, 
                error: 'Some recipient_ids are invalid',
                valid_count: recipientsCheck.rows.length,
                provided_count: recipient_ids.length
            });
        }

        // Insert campaign recipients (ignore duplicates)
        const insertResult = await query(
            `INSERT INTO campaign_recipients (campaign_id, email_data_id, status) 
            SELECT $1, unnest($2::int[]), 'pending'
            ON CONFLICT (campaign_id, email_data_id) DO NOTHING
            RETURNING id`,
            [id, recipient_ids]
        );

        const added = insertResult.rows.length;
        const duplicates = recipient_ids.length - added;

        // Update total_recipients count
        const countResult = await query(
            'SELECT COUNT(*) as total FROM campaign_recipients WHERE campaign_id = $1',
            [id]
        );

        await query(
            'UPDATE campaigns SET total_recipients = $1, updated_at = NOW() WHERE id = $2',
            [parseInt(countResult.rows[0].total), id]
        );

        res.json({ 
            success: true, 
            message: 'Recipients added to campaign',
            added: added,
            duplicates_skipped: duplicates,
            total_recipients: parseInt(countResult.rows[0].total)
        });
    } catch (error) {
        next(error);
    }
});

// GET campaign recipients
router.get('/:id/recipients', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, limit = 100, offset = 0 } = req.query;

        let queryText = `
            SELECT cr.*, ed.to_email 
            FROM campaign_recipients cr
            JOIN email_data ed ON cr.email_data_id = ed.id
            WHERE cr.campaign_id = $1
        `;
        const params = [id];

        if (status) {
            params.push(status);
            queryText += ` AND cr.status = $${params.length}`;
        }

        queryText += ` ORDER BY cr.id LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await query(queryText, params);
        res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error) {
        next(error);
    }
});

// POST execute campaign (send emails)
router.post('/:id/execute', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { provider = 'gmail_api' } = req.body;

        // Rate limiting: Check if campaign is already being executed
        if (runningCampaigns.has(parseInt(id))) {
            return res.status(429).json({
                success: false,
                error: 'Campaign execution already in progress. Please wait for it to complete.'
            });
        }

        // Validate provider
        if (!['gmail_api', 'smtp'].includes(provider)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid provider. Must be gmail_api or smtp' 
            });
        }

        // Get campaign details
        const campaignResult = await query(
            `SELECT c.*, u.email as user_email, u.password,
                    ei.from_name, ei.subject,
                    et.html_content
            FROM campaigns c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN email_info ei ON c.email_info_id = ei.id
            LEFT JOIN email_templates et ON c.email_template_id = et.id
            WHERE c.id = $1`,
            [id]
        );

        if (campaignResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Campaign not found' });
        }

        const campaign = campaignResult.rows[0];

        // Validate campaign has all required fields
        if (!campaign.user_id) {
            return res.status(400).json({ success: false, error: 'Campaign must have a sender user' });
        }

        if (!campaign.email_info_id) {
            return res.status(400).json({ success: false, error: 'Campaign must have email info' });
        }

        if (!campaign.email_template_id) {
            return res.status(400).json({ success: false, error: 'Campaign must have an email template' });
        }

        if (campaign.total_recipients === 0) {
            return res.status(400).json({ success: false, error: 'Campaign has no recipients' });
        }

        if (['running', 'completed'].includes(campaign.status)) {
            return res.status(400).json({ 
                success: false, 
                error: `Campaign is already ${campaign.status}` 
            });
        }

        // Add to running campaigns set for rate limiting
        runningCampaigns.add(parseInt(id));

        // Update campaign status to running
        await query(
            `UPDATE campaigns 
            SET status = 'running', started_at = NOW(), updated_at = NOW() 
            WHERE id = $1`,
            [id]
        );

        // Return immediate response
        res.json({
            success: true,
            message: `Campaign execution started via ${provider}`,
            campaign: {
                id: campaign.id,
                name: campaign.name,
                total_recipients: campaign.total_recipients,
                sender_email: campaign.user_email,
                from_name: campaign.from_name,
                subject: campaign.subject,
                provider: provider
            },
            note: 'Campaign is running in the background. Check campaign status for progress.'
        });

        // Start campaign execution in background
        const campaignSenderPath = path.join(__dirname, '..', 'campaignSender.js');
        const child = fork(campaignSenderPath, [id.toString(), provider], {
            detached: true,
            stdio: 'ignore',
        });
        
        // Remove from running set when child process exits
        child.on('exit', () => {
            runningCampaigns.delete(parseInt(id));
        });
        
        child.unref();
    } catch (error) {
        // Clean up on error
        runningCampaigns.delete(parseInt(req.params.id));
        next(error);
    }
});

// GET campaign statistics
router.get('/:id/stats', async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if campaign exists
        const campaignCheck = await query('SELECT * FROM campaigns WHERE id = $1', [id]);
        if (campaignCheck.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Campaign not found' });
        }

        const campaign = campaignCheck.rows[0];

        // Get recipient statistics
        const recipientStats = await query(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) as skipped
            FROM campaign_recipients 
            WHERE campaign_id = $1`,
            [id]
        );

        res.json({
            success: true,
            campaign: {
                id: campaign.id,
                name: campaign.name,
                status: campaign.status,
                created_at: campaign.created_at,
                started_at: campaign.started_at,
                completed_at: campaign.completed_at
            },
            statistics: {
                total_recipients: parseInt(recipientStats.rows[0].total) || 0,
                sent: parseInt(recipientStats.rows[0].sent) || 0,
                failed: parseInt(recipientStats.rows[0].failed) || 0,
                pending: parseInt(recipientStats.rows[0].pending) || 0,
                skipped: parseInt(recipientStats.rows[0].skipped) || 0,
                success_rate: recipientStats.rows[0].total > 0 
                    ? ((parseInt(recipientStats.rows[0].sent) / parseInt(recipientStats.rows[0].total)) * 100).toFixed(2) + '%'
                    : '0%'
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
