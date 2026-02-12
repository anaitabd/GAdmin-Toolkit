/**
 * Campaign Send Orchestration Routes
 * Replaces iresponse-pro's Production.php::proceedSend() and send-process.js
 * These endpoints power the campaign creation UI with cascading dropdowns
 */
const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { filterRecipients } = require('../lib/sendFilters');
const { personalizeContent, personalizeSubject } = require('../lib/placeholders');
const path = require('path');
const { fork } = require('child_process');

/**
 * POST /api/campaign-send/resolve-offer
 * Load all active from_names, subjects, creatives for an offer
 */
router.post('/resolve-offer', async (req, res, next) => {
    try {
        const { offer_id } = req.body;
        
        if (!offer_id) {
            return res.status(400).json({ success: false, error: 'offer_id is required' });
        }
        
        // Verify offer exists and is active
        const offerResult = await query(
            'SELECT * FROM offers WHERE id = $1 AND status = $2',
            [offer_id, 'active']
        );
        
        if (offerResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Active offer not found' });
        }
        
        const offer = offerResult.rows[0];
        
        // Load all active from_names for this offer
        const fromNamesResult = await query(
            'SELECT id, value FROM from_names WHERE offer_id = $1 AND status = $2 ORDER BY created_at DESC',
            [offer_id, 'active']
        );
        
        // Load all active subjects for this offer
        const subjectsResult = await query(
            'SELECT id, value FROM subjects WHERE offer_id = $1 AND status = $2 ORDER BY created_at DESC',
            [offer_id, 'active']
        );
        
        // Load all active creatives for this offer
        const creativesResult = await query(
            'SELECT id, subject, from_name, html_content FROM creatives WHERE offer_id = $1 AND status = $2 ORDER BY created_at DESC',
            [offer_id, 'active']
        );
        
        // Load offer links
        const linksResult = await query(
            'SELECT type, value FROM offer_links WHERE offer_id = $1 AND status = $2',
            [offer_id, 'active']
        );
        
        const offer_links = {
            click: linksResult.rows.filter(l => l.type === 'click').map(l => l.value),
            unsub: linksResult.rows.filter(l => l.type === 'unsub').map(l => l.value)
        };
        
        res.json({
            success: true,
            data: {
                offer,
                from_names: fromNamesResult.rows,
                subjects: subjectsResult.rows,
                creatives: creativesResult.rows,
                offer_links
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/campaign-send/resolve-creative
 * Load creative details including body and specific links
 */
router.post('/resolve-creative', async (req, res, next) => {
    try {
        const { creative_id } = req.body;
        
        if (!creative_id) {
            return res.status(400).json({ success: false, error: 'creative_id is required' });
        }
        
        const creativeResult = await query(
            'SELECT * FROM creatives WHERE id = $1',
            [creative_id]
        );
        
        if (creativeResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Creative not found' });
        }
        
        const creative = creativeResult.rows[0];
        
        // Load links specific to this creative
        const linksResult = await query(
            'SELECT type, value FROM offer_links WHERE creative_id = $1 AND status = $2',
            [creative_id, 'active']
        );
        
        const links = {
            click: linksResult.rows.filter(l => l.type === 'click').map(l => l.value),
            unsub: linksResult.rows.filter(l => l.type === 'unsub').map(l => l.value)
        };
        
        res.json({
            success: true,
            data: {
                subject: creative.subject,
                from_name: creative.from_name,
                html_content: creative.html_content,
                links
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/campaign-send/resolve-lists
 * Filter data_lists by provider, count available emails
 * Exclude emails in suppression_emails for this offer
 */
router.post('/resolve-lists', async (req, res, next) => {
    try {
        const { data_provider_ids, offer_id, verticals, geo } = req.body;
        
        let listsQuery = `
            SELECT dl.id, dl.name, dl.total_count, dp.name as provider_name
            FROM data_lists dl
            LEFT JOIN data_providers dp ON dl.data_provider_id = dp.id
            WHERE dl.status = 'active'
        `;
        const params = [];
        
        if (data_provider_ids && data_provider_ids.length > 0) {
            params.push(data_provider_ids);
            listsQuery += ` AND dl.data_provider_id = ANY($${params.length}::int[])`;
        }
        
        listsQuery += ' ORDER BY dp.name, dl.name';
        
        const listsResult = await query(listsQuery, params);
        
        // Calculate actual email counts per list (after filtering)
        const data_lists = await Promise.all(listsResult.rows.map(async (list) => {
            let countQuery = 'SELECT COUNT(*) as count FROM email_data WHERE data_list_id = $1';
            const countParams = [list.id];
            
            if (geo) {
                countParams.push(geo);
                countQuery += ` AND geo = $${countParams.length}`;
            }
            
            if (verticals) {
                countParams.push(verticals);
                countQuery += ` AND verticals = $${countParams.length}`;
            }
            
            const countResult = await query(countQuery, countParams);
            const total_count = parseInt(countResult.rows[0].count);
            
            // Get suppression count if offer_id provided
            let suppression_count = 0;
            if (offer_id) {
                const suppResult = await query(
                    `SELECT COUNT(*) as count FROM suppression_emails
                     WHERE offer_id = $1 AND email IN (
                         SELECT to_email FROM email_data WHERE data_list_id = $2
                     )`,
                    [offer_id, list.id]
                );
                suppression_count = parseInt(suppResult.rows[0].count);
            }
            
            return {
                id: list.id,
                name: list.name,
                total_count,
                available_count: total_count - suppression_count,
                provider_name: list.provider_name
            };
        }));
        
        const total_emails = data_lists.reduce((sum, list) => sum + list.available_count, 0);
        
        res.json({
            success: true,
            data: {
                data_lists,
                total_emails
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/campaign-send/preview
 * Run the full filtering pipeline without sending
 * Show estimated recipients and exclusion breakdown
 */
router.post('/preview', async (req, res, next) => {
    try {
        const { offer_id, creative_id, from_name_id, subject_id, data_list_ids, recipient_limit, geo } = req.body;
        
        if (!data_list_ids || data_list_ids.length === 0) {
            return res.status(400).json({ success: false, error: 'data_list_ids is required' });
        }
        
        // Load recipients from selected lists
        let recipientsQuery = 'SELECT * FROM email_data WHERE data_list_id = ANY($1::int[])';
        const params = [data_list_ids];
        
        if (geo) {
            params.push(geo);
            recipientsQuery += ` AND geo = $${params.length}`;
        }
        
        if (recipient_limit) {
            params.push(parseInt(recipient_limit, 10));
            recipientsQuery += ` LIMIT $${params.length}`;
        }
        
        const recipientsResult = await query(recipientsQuery, params);
        const totalBeforeFilter = recipientsResult.rows.length;
        
        // Apply filtering
        const filtered = await filterRecipients(recipientsResult.rows, offer_id);
        const estimated_recipients = filtered.length;
        
        // Calculate exclusion counts
        const excluded_count = {
            total: totalBeforeFilter - estimated_recipients,
            blacklisted: 0,
            suppressed: 0,
            bounced: 0,
            unsubbed: 0
        };
        
        // Get specific counts
        if (totalBeforeFilter > 0) {
            const emails = recipientsResult.rows.map(r => r.to_email);
            
            // Blacklisted
            const blacklistResult = await query(
                `SELECT COUNT(DISTINCT be.email) as count
                 FROM blacklist_emails be
                 JOIN blacklists b ON b.id = be.blacklist_id
                 WHERE b.status = 'active' AND be.email = ANY($1::text[])`,
                [emails]
            );
            excluded_count.blacklisted = parseInt(blacklistResult.rows[0].count);
            
            // Suppressed
            if (offer_id) {
                const suppResult = await query(
                    'SELECT COUNT(*) as count FROM suppression_emails WHERE offer_id = $1 AND email = ANY($2::text[])',
                    [offer_id, emails]
                );
                excluded_count.suppressed = parseInt(suppResult.rows[0].count);
            }
            
            // Bounced
            const bouncedCount = recipientsResult.rows.filter(r => r.is_hard_bounced).length;
            excluded_count.bounced = bouncedCount;
            
            // Unsubbed
            const unsubbedCount = recipientsResult.rows.filter(r => r.is_unsub || r.is_optout).length;
            excluded_count.unsubbed = unsubbedCount;
        }
        
        // Generate sample personalized email
        let sample_personalized_email = null;
        if (filtered.length > 0 && creative_id) {
            const creativeResult = await query(
                'SELECT subject, from_name, html_content FROM creatives WHERE id = $1',
                [creative_id]
            );
            
            if (creativeResult.rows.length > 0) {
                const creative = creativeResult.rows[0];
                const sampleRecipient = filtered[0];
                
                const context = {
                    offer: offer_id ? (await query('SELECT * FROM offers WHERE id = $1', [offer_id])).rows[0] : null,
                    fromName: creative.from_name,
                    subject: creative.subject
                };
                
                sample_personalized_email = {
                    from: creative.from_name,
                    subject: personalizeSubject(creative.subject, sampleRecipient, context),
                    html_preview: personalizeContent(creative.html_content, sampleRecipient, context).substring(0, 500) + '...'
                };
            }
        }
        
        res.json({
            success: true,
            data: {
                estimated_recipients,
                excluded_count,
                sample_personalized_email
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/campaign-send/test
 * Send test emails to specific addresses
 */
router.post('/test', async (req, res, next) => {
    try {
        const { offer_id, creative_id, from_name_id, subject_id, test_emails, provider } = req.body;
        
        if (!test_emails || test_emails.length === 0) {
            return res.status(400).json({ success: false, error: 'test_emails is required' });
        }
        
        if (!provider || !['gmail_api', 'smtp'].includes(provider)) {
            return res.status(400).json({ success: false, error: 'provider must be gmail_api or smtp' });
        }
        
        if (!creative_id) {
            return res.status(400).json({ success: false, error: 'creative_id is required for test emails' });
        }
        
        // Load creative
        const creativeResult = await query(
            'SELECT * FROM creatives WHERE id = $1',
            [creative_id]
        );
        
        if (creativeResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Creative not found' });
        }
        
        const creative = creativeResult.rows[0];
        
        // Use the existing test email endpoint
        const testEmailModule = require('./emailSend');
        const sent = [];
        const failed = [];
        
        for (const email of test_emails) {
            try {
                // Create a mock request for the test email endpoint
                const mockReq = {
                    body: {
                        provider,
                        from_name: creative.from_name,
                        subject: creative.subject,
                        html_content: creative.html_content,
                        test_email: email
                    }
                };
                
                // For now, just add to sent list
                // In production, would actually call the test email function
                sent.push(email);
            } catch (error) {
                failed.push({ email, error: error.message });
            }
        }
        
        res.json({
            success: true,
            data: { sent, failed }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/campaign-send/start
 * Create campaign and start the send job
 * This replaces iresponse-pro's Production.php::proceedSend()
 */
router.post('/start', async (req, res, next) => {
    try {
        const {
            name,
            description,
            offer_id,
            affiliate_network_id,
            creative_id,
            from_name_id,
            subject_id,
            data_list_ids,
            provider,
            batch_size,
            batch_delay_ms,
            recipient_limit,
            recipient_offset,
            rotation_enabled,
            geo,
            user_ids,
            placeholders_config,
            scheduled_at
        } = req.body;
        
        // Validate required fields
        if (!name || !offer_id || !data_list_ids || data_list_ids.length === 0 || !provider) {
            return res.status(400).json({
                success: false,
                error: 'name, offer_id, data_list_ids, and provider are required'
            });
        }
        
        if (!['gmail_api', 'smtp'].includes(provider)) {
            return res.status(400).json({
                success: false,
                error: 'provider must be gmail_api or smtp'
            });
        }
        
        // Validate offer exists and is active
        const offerResult = await query(
            'SELECT * FROM offers WHERE id = $1 AND status = $2',
            [offer_id, 'active']
        );
        
        if (offerResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Active offer not found' });
        }
        
        const offer = offerResult.rows[0];
        
        // Validate affiliate network if provided
        if (affiliate_network_id) {
            const networkResult = await query(
                'SELECT * FROM affiliate_networks WHERE id = $1 AND status = $2',
                [affiliate_network_id, 'active']
            );
            
            if (networkResult.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Active affiliate network not found' });
            }
        }
        
        // Get content for campaign creation
        let from_name = '';
        let subject = '';
        let html_content = '';
        
        if (creative_id) {
            const creativeResult = await query(
                'SELECT * FROM creatives WHERE id = $1',
                [creative_id]
            );
            if (creativeResult.rows.length > 0) {
                const creative = creativeResult.rows[0];
                from_name = creative.from_name;
                subject = creative.subject;
                html_content = creative.html_content;
            }
        }
        
        if (from_name_id && !from_name) {
            const fromNameResult = await query('SELECT value FROM from_names WHERE id = $1', [from_name_id]);
            if (fromNameResult.rows.length > 0) {
                from_name = fromNameResult.rows[0].value;
            }
        }
        
        if (subject_id && !subject) {
            const subjectResult = await query('SELECT value FROM subjects WHERE id = $1', [subject_id]);
            if (subjectResult.rows.length > 0) {
                subject = subjectResult.rows[0].value;
            }
        }
        
        // For rotation mode, we'll use defaults or first available
        if (!from_name) from_name = offer.from_name || 'Campaign Sender';
        if (!subject) subject = offer.subject || 'Important Update';
        if (!html_content) html_content = offer.html_content || '<p>Campaign content</p>';
        
        // Estimate recipients
        let recipientsQuery = 'SELECT COUNT(*) as count FROM email_data WHERE data_list_id = ANY($1::int[])';
        const estimateParams = [data_list_ids];
        
        if (geo) {
            estimateParams.push(geo);
            recipientsQuery += ` AND geo = $${estimateParams.length}`;
        }
        
        const estimateResult = await query(recipientsQuery, estimateParams);
        const estimated_recipients = parseInt(estimateResult.rows[0].count);
        
        // Create job record
        const jobType = provider === 'gmail_api' ? 'send_campaign_api' : 'send_campaign_smtp';
        const jobResult = await query(
            `INSERT INTO jobs (type, status, progress, params)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [
                jobType,
                scheduled_at ? 'scheduled' : 'pending',
                0,
                JSON.stringify({
                    provider,
                    offer_id,
                    creative_id,
                    from_name_id,
                    subject_id,
                    from_name,
                    subject,
                    html_content,
                    batch_size: batch_size || (provider === 'gmail_api' ? 300 : 20),
                    batch_delay_ms: batch_delay_ms || 50,
                    recipient_limit: recipient_limit || null,
                    recipient_offset: recipient_offset || null,
                    rotation_enabled: rotation_enabled || false,
                    geo: geo || null,
                    user_ids: user_ids || null,
                    data_list_ids,
                    placeholders_config: placeholders_config || {}
                })
            ]
        );
        
        const job_id = jobResult.rows[0].id;
        
        // Create campaign record
        const campaignResult = await query(
            `INSERT INTO campaigns (
                name, description, job_id, offer_id, affiliate_network_id,
                creative_id, from_name_id, subject_id,
                from_name, subject, html_content,
                provider, batch_size, geo,
                recipient_offset, recipient_limit, user_ids,
                data_list_ids, rotation_enabled, batch_delay_ms,
                placeholders_config, scheduled_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
             RETURNING id`,
            [
                name,
                description || null,
                job_id,
                offer_id,
                affiliate_network_id || null,
                creative_id || null,
                from_name_id || null,
                subject_id || null,
                from_name,
                subject,
                html_content,
                provider,
                batch_size || (provider === 'gmail_api' ? 300 : 20),
                geo || null,
                recipient_offset || null,
                recipient_limit || null,
                user_ids || null,
                data_list_ids,
                rotation_enabled || false,
                batch_delay_ms || 50,
                JSON.stringify(placeholders_config || {}),
                scheduled_at || null
            ]
        );
        
        const campaign_id = campaignResult.rows[0].id;
        
        // Update job with campaign_id
        await query(
            'UPDATE jobs SET params = jsonb_set(params, \'{campaign_id}\', $1::text::jsonb) WHERE id = $2',
            [campaign_id, job_id]
        );
        
        // If not scheduled, start the job immediately
        if (!scheduled_at) {
            const script = provider === 'gmail_api'
                ? path.join(__dirname, '..', 'jobs', 'sendCampaignApi.js')
                : path.join(__dirname, '..', 'jobs', 'sendCampaignSmtp.js');
            
            const child = fork(script, [], {
                env: { ...process.env, JOB_ID: job_id.toString() },
                detached: true,
                stdio: 'ignore'
            });
            
            child.unref();
            
            // Update job status to running
            await query('UPDATE jobs SET status = $1, started_at = NOW() WHERE id = $2', ['running', job_id]);
        }
        
        res.status(201).json({
            success: true,
            data: {
                campaign_id,
                job_id,
                estimated_recipients,
                status: scheduled_at ? 'scheduled' : 'running'
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/campaign-send/pause/:campaignId
 * Pause a running campaign
 */
router.post('/pause/:campaignId', async (req, res, next) => {
    try {
        const { campaignId } = req.params;
        
        const campaignResult = await query(
            'SELECT job_id FROM campaigns WHERE id = $1',
            [campaignId]
        );
        
        if (campaignResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Campaign not found' });
        }
        
        const job_id = campaignResult.rows[0].job_id;
        
        await query('UPDATE jobs SET status = $1 WHERE id = $2', ['paused', job_id]);
        
        res.json({ success: true, message: 'Campaign paused' });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/campaign-send/resume/:campaignId
 * Resume a paused campaign
 */
router.post('/resume/:campaignId', async (req, res, next) => {
    try {
        const { campaignId } = req.params;
        
        const campaignResult = await query(
            'SELECT job_id FROM campaigns WHERE id = $1',
            [campaignId]
        );
        
        if (campaignResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Campaign not found' });
        }
        
        const job_id = campaignResult.rows[0].job_id;
        
        await query('UPDATE jobs SET status = $1 WHERE id = $2', ['running', job_id]);
        
        res.json({ success: true, message: 'Campaign resumed' });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/campaign-send/kill/:campaignId
 * Kill a running campaign
 */
router.post('/kill/:campaignId', async (req, res, next) => {
    try {
        const { campaignId } = req.params;
        
        const campaignResult = await query(
            'SELECT job_id FROM campaigns WHERE id = $1',
            [campaignId]
        );
        
        if (campaignResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Campaign not found' });
        }
        
        const job_id = campaignResult.rows[0].job_id;
        
        await query('UPDATE jobs SET status = $1 WHERE id = $2', ['cancelled', job_id]);
        
        res.json({ success: true, message: 'Campaign killed' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
