const { Route53Client, ChangeResourceRecordSetsCommand, GetChangeCommand, ListHostedZonesByNameCommand } = require('@aws-sdk/client-route53');
const { query } = require('../../db');
const logger = require('../../utils/logger');

class Route53Service {
  constructor() {
    this.route53Client = new Route53Client({
      region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
  }

  /**
   * Create A record for tracking domain
   * @param {string} domain - Full domain name
   * @param {string} ipAddress - IP address to point to
   * @param {string} hostedZoneId - Route53 hosted zone ID
   * @returns {Object} - Change info
   */
  async createARecord(domain, ipAddress, hostedZoneId) {
    try {
      const command = new ChangeResourceRecordSetsCommand({
        HostedZoneId: hostedZoneId,
        ChangeBatch: {
          Comment: `Create A record for tracking domain ${domain}`,
          Changes: [
            {
              Action: 'UPSERT',
              ResourceRecordSet: {
                Name: domain,
                Type: 'A',
                TTL: 300,
                ResourceRecords: [
                  { Value: ipAddress }
                ]
              }
            }
          ]
        }
      });

      const response = await this.route53Client.send(command);
      
      logger.info('A record created', { 
        domain, 
        ipAddress, 
        changeId: response.ChangeInfo.Id 
      });

      return {
        changeId: response.ChangeInfo.Id,
        status: response.ChangeInfo.Status
      };

    } catch (error) {
      logger.error('Failed to create A record', { 
        error: error.message, 
        domain, 
        ipAddress 
      });
      throw error;
    }
  }

  /**
   * Setup DNS for campaign
   * @param {number} campaignId - Campaign ID
   * @param {string} subdomain - Subdomain prefix
   * @returns {Object} - DNS setup details
   */
  async setupDNSForCampaign(campaignId, subdomain = null) {
    try {
      // Get campaign and EC2 instance details
      const result = await query(
        `SELECT e.public_ip, e.id as ec2_id
         FROM ec2_instances e
         WHERE e.campaign_id = $1 AND e.status = 'running'`,
        [campaignId]
      );

      if (result.rows.length === 0) {
        throw new Error(`No running EC2 instance found for campaign ${campaignId}`);
      }

      const { public_ip, ec2_id } = result.rows[0];

      if (!public_ip) {
        throw new Error('EC2 instance does not have a public IP yet');
      }

      // Get tracking base domain from environment
      const baseDomain = process.env.TRACKING_BASE_DOMAIN;
      if (!baseDomain) {
        throw new Error('TRACKING_BASE_DOMAIN environment variable not set');
      }

      // Generate subdomain if not provided
      const actualSubdomain = subdomain || `track${campaignId}`;
      const fullDomain = `${actualSubdomain}.${baseDomain}`;

      // Get hosted zone ID from environment
      const hostedZoneId = process.env.AWS_ROUTE53_HOSTED_ZONE_ID;
      if (!hostedZoneId) {
        throw new Error('AWS_ROUTE53_HOSTED_ZONE_ID environment variable not set');
      }

      // Create tracking domain record in database
      const domainResult = await query(
        `INSERT INTO tracking_domains 
         (domain, subdomain, campaign_id, ec2_instance_id, hosted_zone_id, 
          route53_record_name, route53_record_value, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'dns_creating')
         RETURNING id`,
        [baseDomain, actualSubdomain, campaignId, ec2_id, hostedZoneId, fullDomain, public_ip]
      );

      const trackingDomainId = domainResult.rows[0].id;

      // Create A record in Route53
      const dnsResult = await this.createARecord(fullDomain, public_ip, hostedZoneId);

      // Update tracking domain status
      await query(
        `UPDATE tracking_domains 
         SET status = 'dns_active'
         WHERE id = $1`,
        [trackingDomainId]
      );

      logger.info('DNS setup complete for campaign', { 
        campaignId, 
        fullDomain, 
        publicIp: public_ip 
      });

      return {
        trackingDomainId,
        fullDomain,
        publicIp: public_ip,
        changeId: dnsResult.changeId
      };

    } catch (error) {
      logger.error('Failed to setup DNS for campaign', { 
        error: error.message, 
        campaignId 
      });
      throw error;
    }
  }

  /**
   * Wait for DNS propagation
   * @param {string} changeId - Route53 change ID
   * @param {number} maxWaitTime - Maximum wait time in seconds
   * @returns {boolean} - True if propagated
   */
  async waitForDNSPropagation(changeId, maxWaitTime = 300) {
    const startTime = Date.now();
    const pollInterval = 10000; // 10 seconds

    while (Date.now() - startTime < maxWaitTime * 1000) {
      try {
        const command = new GetChangeCommand({ Id: changeId });
        const response = await this.route53Client.send(command);

        if (response.ChangeInfo.Status === 'INSYNC') {
          logger.info('DNS propagation complete', { changeId });
          return true;
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));

      } catch (error) {
        logger.error('Error checking DNS propagation', { 
          error: error.message, 
          changeId 
        });
      }
    }

    logger.warn('DNS propagation timeout', { changeId });
    return false;
  }

  /**
   * Delete DNS record
   * @param {string} domain - Domain name
   * @param {string} ipAddress - IP address
   * @param {string} hostedZoneId - Hosted zone ID
   */
  async deleteDNSRecord(domain, ipAddress, hostedZoneId) {
    try {
      const command = new ChangeResourceRecordSetsCommand({
        HostedZoneId: hostedZoneId,
        ChangeBatch: {
          Comment: `Delete A record for ${domain}`,
          Changes: [
            {
              Action: 'DELETE',
              ResourceRecordSet: {
                Name: domain,
                Type: 'A',
                TTL: 300,
                ResourceRecords: [
                  { Value: ipAddress }
                ]
              }
            }
          ]
        }
      });

      await this.route53Client.send(command);
      
      logger.info('DNS record deleted', { domain, ipAddress });

    } catch (error) {
      logger.error('Failed to delete DNS record', { 
        error: error.message, 
        domain 
      });
      throw error;
    }
  }

  /**
   * Verify DNS record
   * @param {string} domain - Domain to verify
   * @param {string} expectedIp - Expected IP address
   * @returns {boolean} - True if verified
   */
  async verifyDNSRecord(domain, expectedIp) {
    try {
      const dns = require('dns').promises;
      const addresses = await dns.resolve4(domain);
      
      const verified = addresses.includes(expectedIp);
      
      if (verified) {
        logger.info('DNS record verified', { domain, expectedIp });
      } else {
        logger.warn('DNS record mismatch', { domain, expectedIp, actualIps: addresses });
      }

      return verified;

    } catch (error) {
      logger.error('DNS verification failed', { 
        error: error.message, 
        domain 
      });
      return false;
    }
  }
}

module.exports = new Route53Service();
