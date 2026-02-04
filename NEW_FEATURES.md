# GAdmin Toolkit - New Features Overview

## 🆕 JWT Service Account Integration for Google Workspace

### What's New

The GAdmin Toolkit now supports **JWT Service Account authentication** for Google Workspace (G Suite), enabling powerful multi-domain email management at scale.

### Key Capabilities

#### Multi-Domain Management
- Manage multiple G Suite domains from a single interface
- Each domain can have its own service account credentials
- Support for thousands of users per domain
- Domain-level configuration and monitoring

#### Service Account Authentication
- **Domain-Wide Delegation**: Service accounts can impersonate any user in your domain
- **No OAuth Required**: No need for per-user OAuth tokens
- **Automatic Authentication**: JWT tokens generated on-demand
- **Secure Storage**: All credentials encrypted with AES-256

#### Bulk User Operations
- **Generate Users**: Create fake users for testing (with realistic names)
- **Bulk Creation**: Create hundreds of users in Google Workspace with rate limiting
- **Bulk Deletion**: Delete users in bulk (with admin protection)
- **Synchronization**: Sync users from Google Workspace to local database
- **Status Tracking**: Monitor user creation/deletion progress in real-time

#### Sender Account Integration
- Automatically convert G Suite users to sender accounts
- One-click setup for all domain users
- JWT authentication for sending emails
- Full integration with existing worker system

### Technical Implementation

```javascript
// Service Account JWT Authentication
const jwtClient = new google.auth.JWT(
    serviceAccount.client_email,
    null,
    serviceAccount.private_key,
    ['https://mail.google.com/'],
    'user@domain.com'  // User to impersonate
);

await jwtClient.authorize();
```

### Database Schema

New tables:
- `gsuite_domains` - G Suite domain management
- `gsuite_service_accounts` - Encrypted service account credentials
- `gsuite_users` - User records with sync status
- Modified `sender_accounts` - Added JWT support

### API Endpoints

```
POST   /api/gsuite/domains                         - Add domain
POST   /api/gsuite/domains/:id/service-accounts    - Upload credentials
POST   /api/gsuite/domains/:id/users/generate      - Generate users
POST   /api/gsuite/domains/:id/users/bulk-create   - Create in Google
DELETE /api/gsuite/domains/:id/users/bulk-delete   - Delete from Google
POST   /api/gsuite/domains/:id/sync                - Sync from Google
POST   /api/gsuite/domains/:id/create-senders      - Create sender accounts
```

---

## 🆕 EC2 VPS Tracking System

### What's New

Automated EC2 instance provisioning for campaign-specific tracking, providing isolated, dedicated tracking infrastructure for each campaign.

### Key Capabilities

#### Automated EC2 Provisioning
- **One Instance Per Campaign**: Each campaign gets its own tracking server
- **Automatic Launch**: EC2 instance created when campaign is created
- **User Data Script**: Pre-configured with Node.js, Nginx, and Certbot
- **Health Monitoring**: Automatic health checks and status updates
- **Auto-Termination**: Optionally terminate instances after campaign completion

#### DNS Management (Route53)
- **Automatic DNS Creation**: A records created automatically
- **Subdomain Generation**: Unique subdomain per campaign (e.g., track123.domain.com)
- **DNS Verification**: Verify DNS propagation before proceeding
- **Cleanup Support**: Remove DNS records when campaign ends

#### SSL Certificate Installation
- **Let's Encrypt Integration**: Automatic SSL certificate installation
- **Auto-Renewal**: Certificates auto-renew before expiration
- **HTTPS Enforcement**: All tracking served over HTTPS
- **Multi-Domain Support**: Handle multiple tracking domains

#### Custom Redirect Pages
- **HTML Redirects**: Beautiful redirect pages with customizable design
- **Configurable Delays**: Control redirect timing (instant or delayed)
- **Visit Tracking**: Count visits to each redirect page
- **Dynamic Updates**: Update redirect URLs without redeployment

### Technical Implementation

#### EC2 Instance Launch
```javascript
const instance = await ec2Service.createInstanceForCampaign(campaignId, {
    instanceType: 't2.micro',
    region: 'us-east-1',
    securityGroupId: 'sg-xxx',
    keyPairName: 'gadmin-key'
});
```

#### DNS Configuration
```javascript
const dns = await route53Service.setupDNSForCampaign(campaignId, 'track123');
// Creates: track123.yourdomain.com → EC2 public IP
```

#### SSL Installation
```javascript
const cert = await letsEncryptService.installCertificate(
    domain,
    publicIp,
    'admin@domain.com'
);
```

### Tracking Flow

1. **Campaign Creation**: User creates campaign with `use_ec2_tracking: true`
2. **EC2 Launch**: Background job launches EC2 instance (5-10 minutes)
3. **DNS Setup**: Route53 A record created and verified
4. **SSL Installation**: Let's Encrypt certificate installed
5. **Page Deployment**: Redirect pages deployed to instance
6. **Ready**: Campaign status changes to `ready`, emails can be sent

### Database Schema

New tables:
- `ec2_instances` - EC2 instance tracking
- `tracking_domains` - DNS records and tracking domains
- `ssl_certificates` - SSL certificate management
- `vps_redirect_pages` - Redirect page configurations

### Tracking Endpoints

Hosted on each EC2 instance:

```
GET https://track123.domain.com/track/open/:token     - Open tracking pixel
GET https://track123.domain.com/offer/:token          - Offer redirect
GET https://track123.domain.com/click/:token          - Click tracking
GET https://track123.domain.com/unsubscribe/:token    - Unsubscribe
```

---

## 🆕 Docker Deployment

### What's New

Complete Docker-based deployment with multi-container architecture for production environments.

### Services

#### PostgreSQL (postgres)
- **Database**: Primary data store
- **Persistence**: Volume-mounted data directory
- **Health Checks**: Automatic readiness checks
- **Initialization**: Auto-run migrations on startup

#### Redis (redis)
- **Caching**: Session and cache storage
- **Queue Management**: Future job queue support
- **Persistence**: AOF (Append-Only File) enabled

#### API Server (api)
- **Express.js**: Main API server
- **Port 3000**: Web interface and REST API
- **Health Endpoint**: `/health` for monitoring
- **Auto-Restart**: Restart on failure

#### Orchestrator (orchestrator)
- **Worker Management**: Manages send workers
- **Account Monitoring**: Monitors account health
- **Limit Enforcement**: Enforces daily limits
- **Auto-Recovery**: Restarts failed workers

#### Scheduler (scheduler)
- **Cron Jobs**: Scheduled tasks (daily resets, SSL renewal)
- **Maintenance**: Database cleanup, log rotation
- **Monitoring**: System health checks

### Configuration

#### docker-compose.yml
```yaml
services:
  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U gadmin"]

  api:
    build: .
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "3000:3000"

  orchestrator:
    build: .
    command: node src/workers/orchestrator.js
    depends_on:
      postgres:
        condition: service_healthy
```

### Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Scale workers (if needed)
docker-compose up -d --scale orchestrator=3

# Update and restart
docker-compose pull
docker-compose up -d --build
```

### Advantages

- **Isolation**: Each service runs in its own container
- **Portability**: Deploy anywhere Docker runs
- **Consistency**: Same environment dev to prod
- **Scaling**: Easy horizontal scaling
- **Monitoring**: Centralized logging and health checks

---

## Integration Example

### Complete Workflow

```bash
# 1. Add G Suite Domain
curl -X POST http://localhost:3000/api/gsuite/domains \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com", "customer_id": "C123", "admin_email": "admin@example.com"}'

# 2. Upload Service Account
curl -X POST http://localhost:3000/api/gsuite/domains/1/service-accounts \
  -F "credJson=@creds.json"

# 3. Generate 100 Users
curl -X POST http://localhost:3000/api/gsuite/domains/1/users/generate \
  -d '{"count": 100, "password": "Password123@"}'

# 4. Create Users in Google Workspace
curl -X POST http://localhost:3000/api/gsuite/domains/1/users/bulk-create

# 5. Create Sender Accounts
curl -X POST http://localhost:3000/api/gsuite/domains/1/create-senders

# 6. Create Campaign with EC2 Tracking
curl -X POST http://localhost:3000/api/campaigns \
  -d '{
    "name": "Black Friday",
    "subject": "Amazing Deals!",
    "html_template": "<p>Click here: {{offer_link}}</p>",
    "use_ec2_tracking": true,
    "real_offer_url": "https://sponsor.com/deals"
  }'

# 7. Wait for EC2 Provisioning (5-10 minutes)
# Check status: GET /api/campaigns/1/ec2

# 8. Send Emails
curl -X POST http://localhost:3000/api/campaigns/1/enqueue \
  -d '{"emails": [{"recipient": "user@example.com"}]}'
```

---

## Security Features

### Encryption
- **AES-256-CBC**: All credentials encrypted at rest
- **Secure Key Management**: Environment-based encryption keys
- **No Plain Text**: Service account keys never stored unencrypted

### AWS Security
- **IAM Roles**: Support for instance roles (recommended)
- **Security Groups**: Restricted port access
- **Key Pairs**: SSH key management
- **SSL/TLS**: All tracking over HTTPS

### Rate Limiting
- **API Protection**: 100 requests per 15 minutes
- **Authentication**: 5 login attempts per 15 minutes
- **Bulk Operations**: 250ms delay between Google API calls

### Account Protection
- **Daily Limits**: Configurable per-account limits
- **Warmup Schedules**: Gradual volume increases
- **Admin Exclusion**: Protect admin users from bulk deletion
- **Status Tracking**: Monitor account health

---

## Performance

### Scalability
- **Horizontal Scaling**: Add more workers/instances
- **Database Pooling**: Connection pooling enabled
- **Async Operations**: Background jobs for long-running tasks
- **Caching**: Redis for session and data caching

### Efficiency
- **Batch Processing**: Process emails in configurable batches
- **Rate Limiting**: Respect Google API quotas
- **Connection Reuse**: Persistent Gmail/SMTP connections
- **Query Optimization**: Indexed database queries

---

## Monitoring & Logging

### Application Logs
- **Winston Logger**: Structured logging
- **Log Levels**: DEBUG, INFO, WARN, ERROR
- **Log Rotation**: Automatic log file rotation
- **Centralized**: All logs accessible via Docker

### Health Checks
- **API Health**: `/health` endpoint
- **Database**: Connection status
- **EC2 Instances**: Instance health monitoring
- **SSL Certificates**: Expiration monitoring

### Metrics
- **Campaign Stats**: Open rate, click rate, bounce rate
- **Account Stats**: Daily sent, success rate, response time
- **System Stats**: Uptime, memory usage, CPU usage

---

## Migration from Previous Version

### Database
1. Run new migrations (006-013)
2. Existing tables remain unchanged
3. New columns added to `sender_accounts`

### Code
1. New services are additive
2. Existing services remain compatible
3. Update environment variables (add encryption key, AWS config)

### Deployment
1. Old deployment methods still work
2. Docker is optional but recommended
3. Can run alongside existing setup

---

## Documentation

- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Full API reference
- [README.md](README.md) - Project overview
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture

---

## Support & Contributing

For issues, questions, or contributions:
- GitHub Issues: https://github.com/anaitabd/GAdmin-Toolkit/issues
- Pull Requests: https://github.com/anaitabd/GAdmin-Toolkit/pulls

