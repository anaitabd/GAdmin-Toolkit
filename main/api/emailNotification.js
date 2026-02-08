const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { loadGoogleCreds } = require('./googleCreds');
const { getSetting } = require('./db/queries');

/**
 * Send admin notification email
 * @param {Object} params - Notification parameters
 * @param {string} params.subject - Email subject
 * @param {string} params.body - Email body (HTML)
 */
async function sendAdminNotification({ subject, body }) {
    try {
        const enabled = await getSetting('notification_enabled');
        if (enabled !== 'true') {
            console.log('Admin notifications disabled');
            return;
        }

        const notificationEmail = await getSetting('notification_email');
        if (!notificationEmail) {
            console.log('No notification email configured');
            return;
        }

        const adminEmail = await getSetting('admin_email');
        if (!adminEmail || adminEmail === 'admin@example.com') {
            console.log('No valid admin email configured');
            return;
        }

        // Load Google credentials
        const creds = await loadGoogleCreds();
        
        // Get access token
        const accessToken = await getAccessToken(creds, adminEmail);
        
        // Create OAuth2 client
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({
            access_token: accessToken
        });

        // Create transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: adminEmail,
                accessToken: accessToken
            }
        });

        // Send email
        await transporter.sendMail({
            from: adminEmail,
            to: notificationEmail,
            subject: `[GAdmin-Toolkit] ${subject}`,
            html: body
        });

        console.log(`Admin notification sent: ${subject}`);
    } catch (error) {
        console.error('Failed to send admin notification:', error.message);
    }
}

/**
 * Get access token for Gmail API
 */
async function getAccessToken(creds, email) {
    const jwtClient = new google.auth.JWT(
        creds.client_email,
        null,
        creds.private_key,
        ['https://mail.google.com'],
        email
    );
    
    await jwtClient.authorize();
    return jwtClient.credentials.access_token;
}

/**
 * Format job completion notification
 */
function formatJobNotification(job) {
    const statusColor = job.status === 'completed' ? '#10b981' : 
                       job.status === 'failed' ? '#ef4444' : '#6b7280';
    
    const statusText = job.status === 'completed' ? 'Completed Successfully' :
                      job.status === 'failed' ? 'Failed' : 'Cancelled';

    let bodyContent = '';
    
    switch (job.type) {
        case 'create_google_users':
            bodyContent = `
                <p><strong>Action:</strong> Create Google Workspace Users</p>
                <p><strong>Admin Email:</strong> ${job.params?.admin_email || 'N/A'}</p>
                <p><strong>Users Created:</strong> ${job.processed_items || 0} / ${job.total_items || 0}</p>
            `;
            break;
        case 'delete_google_users':
            bodyContent = `
                <p><strong>Action:</strong> Delete Google Workspace Users</p>
                <p><strong>Admin Email:</strong> ${job.params?.admin_email || 'N/A'}</p>
                <p><strong>Users Deleted:</strong> ${job.processed_items || 0} / ${job.total_items || 0}</p>
            `;
            break;
        case 'detect_bounces':
            bodyContent = `
                <p><strong>Action:</strong> Detect Bounced Emails</p>
                <p><strong>Bounces Found:</strong> ${job.processed_items || 0}</p>
                <p><strong>Users Scanned:</strong> ${job.total_items || 0}</p>
            `;
            break;
        case 'send_email_api':
        case 'send_email_smtp':
            bodyContent = `
                <p><strong>Action:</strong> Send Emails (${job.params?.provider || 'Unknown'})</p>
                <p><strong>Emails Sent:</strong> ${job.processed_items || 0} / ${job.total_items || 0}</p>
            `;
            break;
        case 'generate_users':
            bodyContent = `
                <p><strong>Action:</strong> Generate Users</p>
                <p><strong>Domain:</strong> ${job.params?.domain || 'N/A'}</p>
                <p><strong>Users Generated:</strong> ${job.processed_items || 0}</p>
            `;
            break;
        default:
            bodyContent = `
                <p><strong>Action:</strong> ${job.type}</p>
                <p><strong>Items Processed:</strong> ${job.processed_items || 0} / ${job.total_items || 0}</p>
            `;
    }

    const errorSection = job.error_message ? `
        <div style="background-color: #fee2e2; padding: 12px; border-radius: 4px; margin-top: 12px;">
            <p style="margin: 0; color: #991b1b;"><strong>Error:</strong> ${job.error_message}</p>
        </div>
    ` : '';

    return {
        subject: `Job ${statusText}: ${job.type}`,
        body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: ${statusColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0;">Job ${statusText}</h2>
                </div>
                <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px;">
                    <p><strong>Job ID:</strong> ${job.id}</p>
                    ${bodyContent}
                    <p><strong>Started:</strong> ${job.started_at ? new Date(job.started_at).toLocaleString() : 'N/A'}</p>
                    <p><strong>Completed:</strong> ${job.completed_at ? new Date(job.completed_at).toLocaleString() : 'N/A'}</p>
                    ${errorSection}
                </div>
                <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
                    <p>This is an automated notification from GAdmin-Toolkit</p>
                </div>
            </div>
        `
    };
}

module.exports = {
    sendAdminNotification,
    formatJobNotification
};
