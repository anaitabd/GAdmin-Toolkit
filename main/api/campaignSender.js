const { query } = require('./db');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const { getActiveCredential } = require('./db/queries');

// Configuration constants
const EMAIL_SEND_DELAY_MS = 100; // Delay between emails to avoid rate limiting

// Get campaign ID and provider from command line arguments
const campaignId = parseInt(process.argv[2]);
const provider = process.argv[3] || 'gmail_api';

console.log(`Campaign Sender started: Campaign ID=${campaignId}, Provider=${provider}`);

async function sendViaGmailAPI(userEmail, userPassword, toEmail, fromName, subject, htmlContent) {
    try {
        // Get active credential
        const credential = await getActiveCredential();
        if (!credential) {
            throw new Error('No active Google credential found');
        }

        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials(credential.cred_json);

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        const message = [
            `From: ${fromName} <${userEmail}>`,
            `To: ${toEmail}`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=utf-8',
            '',
            htmlContent
        ].join('\n');

        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });

        return { success: true };
    } catch (error) {
        console.error(`Gmail API error for ${toEmail}:`, error.message);
        return { success: false, error: error.message };
    }
}

async function sendViaSMTP(userEmail, userPassword, toEmail, fromName, subject, htmlContent) {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: userEmail,
                pass: userPassword,
            },
        });

        await transporter.sendMail({
            from: `${fromName} <${userEmail}>`,
            to: toEmail,
            subject: subject,
            html: htmlContent,
        });

        return { success: true };
    } catch (error) {
        console.error(`SMTP error for ${toEmail}:`, error.message);
        return { success: false, error: error.message };
    }
}

async function processCampaign() {
    try {
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
            [campaignId]
        );

        if (campaignResult.rows.length === 0) {
            console.error(`Campaign ${campaignId} not found`);
            process.exit(1);
        }

        const campaign = campaignResult.rows[0];
        console.log(`Processing campaign: ${campaign.name}`);

        // Get pending recipients
        const recipientsResult = await query(
            `SELECT cr.id, cr.email_data_id, ed.to_email
            FROM campaign_recipients cr
            JOIN email_data ed ON cr.email_data_id = ed.id
            WHERE cr.campaign_id = $1 AND cr.status = 'pending'
            ORDER BY cr.id`,
            [campaignId]
        );

        const recipients = recipientsResult.rows;
        console.log(`Found ${recipients.length} pending recipients`);

        let sentCount = 0;
        let failedCount = 0;

        // Process each recipient
        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];
            
            console.log(`Sending ${i + 1}/${recipients.length} to ${recipient.to_email}`);

            let result;
            if (provider === 'gmail_api') {
                result = await sendViaGmailAPI(
                    campaign.user_email,
                    campaign.password,
                    recipient.to_email,
                    campaign.from_name,
                    campaign.subject,
                    campaign.html_content
                );
            } else {
                result = await sendViaSMTP(
                    campaign.user_email,
                    campaign.password,
                    recipient.to_email,
                    campaign.from_name,
                    campaign.subject,
                    campaign.html_content
                );
            }

            // Update recipient status
            if (result.success) {
                await query(
                    `UPDATE campaign_recipients 
                    SET status = 'sent', sent_at = NOW() 
                    WHERE id = $1`,
                    [recipient.id]
                );
                sentCount++;
            } else {
                await query(
                    `UPDATE campaign_recipients 
                    SET status = 'failed', error_message = $1 
                    WHERE id = $2`,
                    [result.error, recipient.id]
                );
                failedCount++;
            }

            // Log to email_logs table
            await query(
                `INSERT INTO email_logs (user_email, to_email, status, provider, error_message, sent_at)
                VALUES ($1, $2, $3, $4, $5, NOW())`,
                [
                    campaign.user_email,
                    recipient.to_email,
                    result.success ? 'sent' : 'failed',
                    provider,
                    result.error || null
                ]
            );

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, EMAIL_SEND_DELAY_MS));
        }

        // Update campaign status
        await query(
            `UPDATE campaigns 
            SET status = 'completed', 
                sent_count = $1, 
                failed_count = $2,
                completed_at = NOW(),
                updated_at = NOW()
            WHERE id = $3`,
            [sentCount, failedCount, campaignId]
        );

        console.log(`Campaign ${campaign.name} completed: ${sentCount} sent, ${failedCount} failed`);
        process.exit(0);
    } catch (error) {
        console.error('Campaign processing error:', error);
        
        // Update campaign status to failed
        try {
            await query(
                `UPDATE campaigns 
                SET status = 'failed', updated_at = NOW() 
                WHERE id = $1`,
                [campaignId]
            );
        } catch (updateError) {
            console.error('Failed to update campaign status:', updateError);
        }

        process.exit(1);
    }
}

// Start processing
processCampaign();
