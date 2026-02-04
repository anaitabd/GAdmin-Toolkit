const { Client } = require('ssh2');
const { query } = require('../../db');
const logger = require('../../utils/logger');

class VPSDeploymentService {
  /**
   * Generate HTML redirect page
   * @param {string} destinationUrl - URL to redirect to
   * @param {number} delay - Delay in milliseconds
   * @returns {string} - HTML content
   */
  generateRedirectHTML(destinationUrl, delay = 0) {
    const delaySeconds = delay / 1000;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="${delaySeconds};url=${destinationUrl}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redirecting...</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        .spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 4px solid white;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        h1 {
            margin: 0;
            font-size: 24px;
        }
        p {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
        }
    </style>
    ${delay === 0 ? '<script>window.location.href="' + destinationUrl + '";</script>' : ''}
</head>
<body>
    <div class="container">
        <h1>Please wait...</h1>
        <div class="spinner"></div>
        <p>You will be redirected shortly</p>
    </div>
</body>
</html>`;
  }

  /**
   * Deploy redirect pages to VPS
   * @param {number} ec2InstanceId - EC2 instance ID
   * @param {Array} pages - Array of page objects
   * @returns {Object} - Deployment results
   */
  async deployRedirectPages(ec2InstanceId, pages) {
    try {
      // Get EC2 instance details
      const result = await query(
        'SELECT public_ip, key_pair_name FROM ec2_instances WHERE id = $1',
        [ec2InstanceId]
      );

      if (result.rows.length === 0) {
        throw new Error(`EC2 instance ${ec2InstanceId} not found`);
      }

      const { public_ip } = result.rows[0];

      // Save redirect pages to database
      const savedPages = [];
      for (const page of pages) {
        const html = this.generateRedirectHTML(page.realUrl, page.redirectDelay || 0);
        
        const pageResult = await query(
          `INSERT INTO vps_redirect_pages 
           (campaign_id, ec2_instance_id, tracking_domain_id, page_type, 
            page_slug, real_url, html_content, redirect_delay_ms, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
           RETURNING *`,
          [
            page.campaignId,
            ec2InstanceId,
            page.trackingDomainId,
            page.pageType,
            page.pageSlug,
            page.realUrl,
            html,
            page.redirectDelay || 0
          ]
        );

        savedPages.push(pageResult.rows[0]);
      }

      logger.info('Redirect pages deployed', { 
        ec2InstanceId, 
        count: savedPages.length,
        publicIp: public_ip
      });

      return {
        success: true,
        pagesDeployed: savedPages.length,
        pages: savedPages
      };

    } catch (error) {
      logger.error('Failed to deploy redirect pages', { 
        error: error.message, 
        ec2InstanceId 
      });
      throw error;
    }
  }

  /**
   * Update redirect page
   * @param {number} pageId - Page ID
   * @param {string} newUrl - New destination URL
   */
  async updateRedirectPage(pageId, newUrl) {
    try {
      // Get current page
      const result = await query(
        'SELECT redirect_delay_ms FROM vps_redirect_pages WHERE id = $1',
        [pageId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Page ${pageId} not found`);
      }

      const { redirect_delay_ms } = result.rows[0];

      // Generate new HTML
      const html = this.generateRedirectHTML(newUrl, redirect_delay_ms);

      // Update database
      await query(
        `UPDATE vps_redirect_pages 
         SET real_url = $1, html_content = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [newUrl, html, pageId]
      );

      logger.info('Redirect page updated', { pageId, newUrl });

    } catch (error) {
      logger.error('Failed to update redirect page', { 
        error: error.message, 
        pageId 
      });
      throw error;
    }
  }

  /**
   * Get redirect page by slug
   * @param {number} trackingDomainId - Tracking domain ID
   * @param {string} pageSlug - Page slug
   * @returns {Object} - Page details
   */
  async getRedirectPage(trackingDomainId, pageSlug) {
    try {
      const result = await query(
        `SELECT * FROM vps_redirect_pages 
         WHERE tracking_domain_id = $1 AND page_slug = $2 AND status = 'active'`,
        [trackingDomainId, pageSlug]
      );

      if (result.rows.length === 0) {
        return null;
      }

      // Increment visit count
      await query(
        'UPDATE vps_redirect_pages SET total_visits = total_visits + 1 WHERE id = $1',
        [result.rows[0].id]
      );

      return result.rows[0];

    } catch (error) {
      logger.error('Failed to get redirect page', { 
        error: error.message, 
        trackingDomainId, 
        pageSlug 
      });
      throw error;
    }
  }

  /**
   * Execute SSH command on EC2 instance
   * @param {string} host - Host IP
   * @param {string} command - Command to execute
   * @returns {string} - Command output
   */
  async executeSSHCommand(host, command) {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      let output = '';

      conn.on('ready', () => {
        conn.exec(command, (err, stream) => {
          if (err) {
            conn.end();
            return reject(err);
          }

          stream.on('close', (code) => {
            conn.end();
            if (code === 0) {
              resolve(output);
            } else {
              reject(new Error(`Command exited with code ${code}`));
            }
          });

          stream.on('data', (data) => {
            output += data.toString();
          });

          stream.stderr.on('data', (data) => {
            output += data.toString();
          });
        });
      });

      conn.on('error', (err) => {
        reject(err);
      });

      // Connect with key from environment or file
      conn.connect({
        host,
        port: 22,
        username: 'ubuntu',
        privateKey: process.env.AWS_SSH_PRIVATE_KEY || require('fs').readFileSync(process.env.AWS_KEY_PAIR_PATH)
      });
    });
  }
}

module.exports = new VPSDeploymentService();
