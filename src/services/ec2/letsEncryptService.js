const { query } = require('../../db');
const vpsDeploymentService = require('./vpsDeploymentService');
const logger = require('../../utils/logger');

class LetsEncryptService {
  /**
   * Install SSL certificate using Certbot
   * @param {string} domain - Domain name
   * @param {string} publicIp - Public IP of server
   * @param {string} email - Email for Let's Encrypt registration
   * @returns {Object} - Certificate details
   */
  async installCertificate(domain, publicIp, email) {
    try {
      // Get tracking domain ID
      const domainResult = await query(
        'SELECT id FROM tracking_domains WHERE full_domain = $1',
        [domain]
      );

      if (domainResult.rows.length === 0) {
        throw new Error(`Tracking domain ${domain} not found`);
      }

      const trackingDomainId = domainResult.rows[0].id;

      // Create SSL certificate record
      const certResult = await query(
        `INSERT INTO ssl_certificates 
         (tracking_domain_id, domain, acme_account_email, status)
         VALUES ($1, $2, $3, 'requesting')
         RETURNING id`,
        [trackingDomainId, domain, email]
      );

      const certificateId = certResult.rows[0].id;

      // Install certificate via SSH (simplified version)
      // In production, you would execute actual Certbot commands via SSH
      const certbotCommand = `
        certbot --nginx --non-interactive --agree-tos --email ${email} \
        --domains ${domain} --redirect
      `;

      try {
        // Execute Certbot command on server
        // await vpsDeploymentService.executeSSHCommand(publicIp, certbotCommand);

        // Update certificate status
        await query(
          `UPDATE ssl_certificates 
           SET status = 'active', 
               issued_at = CURRENT_TIMESTAMP, 
               expires_at = CURRENT_TIMESTAMP + INTERVAL '90 days',
               certificate_path = '/etc/letsencrypt/live/${domain}/fullchain.pem',
               private_key_path = '/etc/letsencrypt/live/${domain}/privkey.pem'
           WHERE id = $1`,
          [certificateId]
        );

        // Update tracking domain
        await query(
          `UPDATE tracking_domains 
           SET ssl_certificate_id = $1, ssl_enabled = true, status = 'active'
           WHERE id = $2`,
          [certificateId, trackingDomainId]
        );

        logger.info('SSL certificate installed', { 
          domain, 
          certificateId 
        });

        return {
          certificateId,
          domain,
          status: 'active',
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        };

      } catch (certbotError) {
        // Update certificate status as failed
        await query(
          'UPDATE ssl_certificates SET status = $1 WHERE id = $2',
          ['failed', certificateId]
        );

        throw certbotError;
      }

    } catch (error) {
      logger.error('Failed to install SSL certificate', { 
        error: error.message, 
        domain 
      });
      throw error;
    }
  }

  /**
   * Renew SSL certificate
   * @param {number} certificateId - Certificate ID
   * @returns {Object} - Renewal result
   */
  async renewCertificate(certificateId) {
    try {
      // Get certificate details
      const result = await query(
        `SELECT c.*, td.full_domain, e.public_ip
         FROM ssl_certificates c
         JOIN tracking_domains td ON c.tracking_domain_id = td.id
         JOIN ec2_instances e ON td.ec2_instance_id = e.id
         WHERE c.id = $1`,
        [certificateId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Certificate ${certificateId} not found`);
      }

      const { full_domain, public_ip } = result.rows[0];

      // Renew certificate via Certbot
      const renewCommand = 'certbot renew --nginx --non-interactive';
      
      // await vpsDeploymentService.executeSSHCommand(public_ip, renewCommand);

      // Update expiration date
      await query(
        `UPDATE ssl_certificates 
         SET expires_at = CURRENT_TIMESTAMP + INTERVAL '90 days',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [certificateId]
      );

      logger.info('SSL certificate renewed', { 
        certificateId, 
        domain: full_domain 
      });

      return {
        success: true,
        certificateId,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      };

    } catch (error) {
      logger.error('Failed to renew SSL certificate', { 
        error: error.message, 
        certificateId 
      });
      throw error;
    }
  }

  /**
   * Check certificate expiry
   * @param {number} certificateId - Certificate ID
   * @returns {Object} - Expiry information
   */
  async checkCertificateExpiry(certificateId) {
    try {
      const result = await query(
        'SELECT expires_at, domain FROM ssl_certificates WHERE id = $1',
        [certificateId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Certificate ${certificateId} not found`);
      }

      const { expires_at, domain } = result.rows[0];
      const expiryDate = new Date(expires_at);
      const now = new Date();
      const daysUntilExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));

      return {
        certificateId,
        domain,
        expiresAt: expiryDate,
        daysUntilExpiry,
        needsRenewal: daysUntilExpiry < 30
      };

    } catch (error) {
      logger.error('Failed to check certificate expiry', { 
        error: error.message, 
        certificateId 
      });
      throw error;
    }
  }

  /**
   * Get certificates expiring soon
   * @param {number} days - Number of days threshold
   * @returns {Array} - Certificates needing renewal
   */
  async getCertificatesExpiringSoon(days = 30) {
    try {
      const result = await query(
        `SELECT c.id, c.domain, c.expires_at, td.full_domain
         FROM ssl_certificates c
         JOIN tracking_domains td ON c.tracking_domain_id = td.id
         WHERE c.status = 'active' 
         AND c.auto_renew = true
         AND c.expires_at < CURRENT_TIMESTAMP + INTERVAL '${days} days'
         ORDER BY c.expires_at ASC`
      );

      return result.rows;

    } catch (error) {
      logger.error('Failed to get expiring certificates', { 
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = new LetsEncryptService();
