const { EC2Client, RunInstancesCommand, DescribeInstancesCommand, TerminateInstancesCommand } = require('@aws-sdk/client-ec2');
const { query } = require('../../db');
const logger = require('../../utils/logger');

class EC2Service {
  constructor() {
    this.ec2Client = new EC2Client({
      region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
  }

  /**
   * Get user data script for EC2 instance initialization
   * @returns {string} - Base64 encoded user data script
   */
  getUserDataScript() {
    const script = `#!/bin/bash
set -e

# Update system
apt-get update
apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install Nginx
apt-get install -y nginx

# Install Certbot for Let's Encrypt
apt-get install -y certbot python3-certbot-nginx

# Create tracking app directory
mkdir -p /opt/tracking-app
cd /opt/tracking-app

# Create simple tracking server
cat > server.js << 'EOF'
const http = require('http');
const fs = require('fs');

const PORT = 3000;

const server = http.createServer((req, res) => {
  console.log(\`\${new Date().toISOString()} - \${req.method} \${req.url}\`);
  
  if (req.url.startsWith('/track/open/')) {
    // Tracking pixel
    const token = req.url.split('/')[3];
    // Log open event (would send to main API in production)
    console.log(\`Open tracked: \${token}\`);
    
    // Return 1x1 transparent pixel
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, { 'Content-Type': 'image/gif' });
    res.end(pixel);
  } else if (req.url.startsWith('/offer/') || req.url.startsWith('/click/')) {
    // Click tracking and redirect
    const token = req.url.split('/')[2];
    console.log(\`Click tracked: \${token}\`);
    
    // Serve redirect page (would be customized per campaign)
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<html><head><meta http-equiv="refresh" content="0;url=https://example.com"></head></html>');
  } else if (req.url.startsWith('/unsubscribe/')) {
    // Unsubscribe tracking
    const token = req.url.split('/')[2];
    console.log(\`Unsubscribe: \${token}\`);
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<html><body><h1>You have been unsubscribed</h1></body></html>');
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(\`Tracking server running on port \${PORT}\`);
});
EOF

# Install dependencies and start server
npm init -y
npm install pm2 -g

# Start tracking server with PM2
pm2 start server.js --name tracking-server
pm2 startup
pm2 save

# Configure Nginx as reverse proxy
cat > /etc/nginx/sites-available/tracking << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_cache_bypass \\$http_upgrade;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/tracking /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "EC2 tracking instance setup complete"
`;

    return Buffer.from(script).toString('base64');
  }

  /**
   * Create EC2 instance for a campaign
   * @param {number} campaignId - Campaign ID
   * @param {Object} config - Instance configuration
   * @returns {Object} - Instance details
   */
  async createInstanceForCampaign(campaignId, config = {}) {
    try {
      const instanceType = config.instanceType || process.env.EC2_INSTANCE_TYPE || 't2.micro';
      const region = config.region || process.env.AWS_DEFAULT_REGION || 'us-east-1';
      const securityGroupId = config.securityGroupId || process.env.AWS_SECURITY_GROUP_ID;
      const keyPairName = config.keyPairName || process.env.AWS_KEY_PAIR_NAME;
      const amiId = config.amiId || 'ami-0c55b159cbfafe1f0'; // Ubuntu 22.04 LTS

      // Create database record
      const dbResult = await query(
        `INSERT INTO ec2_instances 
         (campaign_id, instance_type, region, security_group_id, key_pair_name, status)
         VALUES ($1, $2, $3, $4, $5, 'creating')
         RETURNING id`,
        [campaignId, instanceType, region, securityGroupId, keyPairName]
      );

      const dbInstanceId = dbResult.rows[0].id;

      // Launch EC2 instance
      const runCommand = new RunInstancesCommand({
        ImageId: amiId,
        InstanceType: instanceType,
        MinCount: 1,
        MaxCount: 1,
        SecurityGroupIds: [securityGroupId],
        KeyName: keyPairName,
        UserData: this.getUserDataScript(),
        TagSpecifications: [
          {
            ResourceType: 'instance',
            Tags: [
              { Key: 'Name', Value: `tracking-campaign-${campaignId}` },
              { Key: 'CampaignId', Value: campaignId.toString() },
              { Key: 'ManagedBy', Value: 'GAdmin-Toolkit' }
            ]
          }
        ]
      });

      const response = await this.ec2Client.send(runCommand);
      const instance = response.Instances[0];

      // Update database with AWS instance ID
      await query(
        `UPDATE ec2_instances 
         SET instance_id = $1, private_ip = $2, launched_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [instance.InstanceId, instance.PrivateIpAddress, dbInstanceId]
      );

      logger.info('EC2 instance created', { 
        campaignId, 
        instanceId: instance.InstanceId,
        dbId: dbInstanceId
      });

      return {
        id: dbInstanceId,
        instanceId: instance.InstanceId,
        status: 'creating'
      };

    } catch (error) {
      logger.error('Failed to create EC2 instance', { 
        error: error.message, 
        campaignId 
      });
      
      // Update database with error
      await query(
        'UPDATE ec2_instances SET status = $1, creation_error = $2 WHERE campaign_id = $3',
        ['failed', error.message, campaignId]
      );
      
      throw error;
    }
  }

  /**
   * Wait for instance to get public IP
   * @param {string} instanceId - AWS instance ID
   * @param {number} maxWaitTime - Maximum wait time in seconds
   * @returns {string} - Public IP address
   */
  async waitForPublicIP(instanceId, maxWaitTime = 300) {
    const startTime = Date.now();
    const pollInterval = 10000; // 10 seconds

    while (Date.now() - startTime < maxWaitTime * 1000) {
      try {
        const command = new DescribeInstancesCommand({
          InstanceIds: [instanceId]
        });

        const response = await this.ec2Client.send(command);
        const instance = response.Reservations[0]?.Instances[0];

        if (instance && instance.PublicIpAddress) {
          logger.info('Public IP assigned', { 
            instanceId, 
            publicIp: instance.PublicIpAddress 
          });

          // Update database
          await query(
            `UPDATE ec2_instances 
             SET public_ip = $1, status = 'running'
             WHERE instance_id = $2`,
            [instance.PublicIpAddress, instanceId]
          );

          return instance.PublicIpAddress;
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));

      } catch (error) {
        logger.error('Error checking instance status', { 
          error: error.message, 
          instanceId 
        });
      }
    }

    throw new Error(`Timeout waiting for public IP for instance ${instanceId}`);
  }

  /**
   * Get instance status
   * @param {string} instanceId - AWS instance ID
   * @returns {Object} - Instance status
   */
  async getInstanceStatus(instanceId) {
    try {
      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      });

      const response = await this.ec2Client.send(command);
      const instance = response.Reservations[0]?.Instances[0];

      return {
        state: instance.State.Name,
        publicIp: instance.PublicIpAddress,
        privateIp: instance.PrivateIpAddress,
        launchTime: instance.LaunchTime
      };
    } catch (error) {
      logger.error('Failed to get instance status', { 
        error: error.message, 
        instanceId 
      });
      throw error;
    }
  }

  /**
   * Terminate EC2 instance
   * @param {string} instanceId - AWS instance ID
   */
  async terminateInstance(instanceId) {
    try {
      const command = new TerminateInstancesCommand({
        InstanceIds: [instanceId]
      });

      await this.ec2Client.send(command);

      // Update database
      await query(
        `UPDATE ec2_instances 
         SET status = 'terminated', terminated_at = CURRENT_TIMESTAMP
         WHERE instance_id = $1`,
        [instanceId]
      );

      logger.info('EC2 instance terminated', { instanceId });
    } catch (error) {
      logger.error('Failed to terminate instance', { 
        error: error.message, 
        instanceId 
      });
      throw error;
    }
  }

  /**
   * Health check for instance
   * @param {string} publicIp - Public IP address
   * @returns {boolean} - Health status
   */
  async healthCheck(publicIp) {
    try {
      const axios = require('axios');
      const response = await axios.get(`http://${publicIp}/health`, { 
        timeout: 5000 
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new EC2Service();
