# GAdmin Toolkit - G Suite JWT Integration Deployment Guide

## Overview

This guide covers the deployment and configuration of the GAdmin Toolkit with JWT Service Account authentication for Google Workspace (G Suite), EC2 VPS tracking, and Docker-based deployment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Google Workspace Configuration](#google-workspace-configuration)
4. [AWS Configuration](#aws-configuration)
5. [Database Setup](#database-setup)
6. [Docker Deployment](#docker-deployment)
7. [G Suite Domain Setup](#g-suite-domain-setup)
8. [User Management](#user-management)
9. [Campaign with EC2 Tracking](#campaign-with-ec2-tracking)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Accounts & Services

- Google Workspace (G Suite) account with admin access
- AWS account with EC2, Route53 access
- Domain name for tracking (configured in Route53)
- Server with Docker and Docker Compose installed

### Required Software

- Docker (version 20.x or higher)
- Docker Compose (version 2.x or higher)
- Git

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/anaitabd/GAdmin-Toolkit.git
cd GAdmin-Toolkit
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
nano .env
```

Required environment variables:

```bash
# Database
DB_PASSWORD=your_secure_database_password

# JWT & Encryption (MUST be exactly 32 characters)
JWT_SECRET=your_jwt_secret_32_characters_min
ENCRYPTION_KEY=your_32_character_encryption_key

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_DEFAULT_REGION=us-east-1
AWS_SECURITY_GROUP_ID=sg-xxxxxxxxx
AWS_KEY_PAIR_NAME=your-keypair-name
AWS_ROUTE53_HOSTED_ZONE_ID=Z1234567890ABC

# Application
BASE_URL=https://api.yourdomain.com
TRACKING_BASE_DOMAIN=tracking.yourdomain.com
TRACKING_SECRET=your_tracking_secret_32_chars
```

## Google Workspace Configuration

### 1. Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable APIs:
   - Admin SDK API
   - Gmail API
4. Create Service Account:
   - IAM & Admin → Service Accounts → Create Service Account
   - Name: `gadmin-toolkit-service`
   - Grant roles: None needed at project level
5. Create Key:
   - Click on the service account
   - Keys → Add Key → Create New Key
   - Choose JSON format
   - **Save this file securely** (you'll need it later)

### 2. Enable Domain-Wide Delegation

1. In the service account details:
   - Enable "Domain-wide delegation"
   - Note the "Client ID" (you'll need this)
2. Go to your Google Workspace Admin Console
3. Security → API Controls → Domain-wide Delegation
4. Add new:
   - Client ID: (from service account)
   - OAuth Scopes:
     ```
     https://www.googleapis.com/auth/admin.directory.user
     https://mail.google.com/
     https://www.googleapis.com/auth/gmail.send
     ```

### 3. Get Domain Information

You'll need:
- Domain name (e.g., `example.com`)
- Customer ID (found in Admin Console → Account → Account Settings)
- Admin email (e.g., `admin@example.com`)

## AWS Configuration

### 1. Create Security Group

```bash
aws ec2 create-security-group \
  --group-name gadmin-tracking \
  --description "Security group for tracking servers"

# Allow HTTP
aws ec2 authorize-security-group-ingress \
  --group-name gadmin-tracking \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

# Allow HTTPS
aws ec2 authorize-security-group-ingress \
  --group-name gadmin-tracking \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Allow SSH (from your IP only)
aws ec2 authorize-security-group-ingress \
  --group-name gadmin-tracking \
  --protocol tcp \
  --port 22 \
  --cidr YOUR_IP/32
```

Note the Security Group ID (e.g., `sg-xxxxxxxxx`) and add it to your `.env` file.

### 2. Create Key Pair

```bash
aws ec2 create-key-pair \
  --key-name gadmin-tracking-key \
  --query 'KeyMaterial' \
  --output text > ~/.ssh/gadmin-tracking-key.pem

chmod 400 ~/.ssh/gadmin-tracking-key.pem
```

Add the key pair name to your `.env` file: `AWS_KEY_PAIR_NAME=gadmin-tracking-key`

### 3. Configure Route53

1. Create or use existing hosted zone for your tracking domain
2. Note the Hosted Zone ID (e.g., `Z1234567890ABC`)
3. Add to `.env`: `AWS_ROUTE53_HOSTED_ZONE_ID=Z1234567890ABC`

## Database Setup

The database will be automatically initialized when you start Docker Compose. All migrations will run automatically.

To manually run migrations:

```bash
docker-compose exec api node src/db/migrate.js
```

## Docker Deployment

### 1. Build and Start Services

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f
```

### 2. Verify Services

```bash
# Check service status
docker-compose ps

# Test health endpoint
curl http://localhost:3000/health
```

### 3. Create Admin User

```bash
docker-compose exec api node src/scripts/createAdmin.js
```

Follow the prompts to create an admin account.

## G Suite Domain Setup

### 1. Add Domain via API

```bash
curl -X POST http://localhost:3000/api/gsuite/domains \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "domain": "example.com",
    "customer_id": "C1234567",
    "admin_email": "admin@example.com",
    "max_users": 10000
  }'
```

### 2. Upload Service Account Credentials

```bash
curl -X POST http://localhost:3000/api/gsuite/domains/1/service-accounts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "credJson=@/path/to/service-account-key.json"
```

### 3. Test Authentication

```bash
curl -X POST http://localhost:3000/api/gsuite/test-auth \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "credJson=@/path/to/service-account-key.json" \
  -F "impersonateUser=admin@example.com"
```

## User Management

### 1. Generate Users

```bash
curl -X POST http://localhost:3000/api/gsuite/domains/1/users/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "count": 100,
    "password": "Password123@"
  }'
```

### 2. Create Users in Google Workspace

```bash
curl -X POST http://localhost:3000/api/gsuite/domains/1/users/bulk-create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

This starts a background job that creates users with a 250ms rate limit between each request.

### 3. Create Sender Accounts

```bash
curl -X POST http://localhost:3000/api/gsuite/domains/1/create-senders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

This creates `sender_accounts` entries for all active G Suite users.

### 4. Monitor User Creation

```bash
# List users
curl http://localhost:3000/api/gsuite/domains/1/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Check logs
docker-compose logs -f api | grep "User created"
```

## Campaign with EC2 Tracking

### 1. Create Campaign with EC2

```bash
curl -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Black Friday Campaign",
    "subject": "Black Friday Deals!",
    "html_template": "<p>Check our deals at {{offer_link}}</p>",
    "use_ec2_tracking": true,
    "real_offer_url": "https://sponsor.com/blackfriday"
  }'
```

This will:
1. Create the campaign
2. Launch an EC2 instance (5-10 minutes)
3. Configure DNS in Route53
4. Install SSL certificate (Let's Encrypt)
5. Deploy tracking pages

### 2. Monitor EC2 Provisioning

```bash
# Check campaign status
curl http://localhost:3000/api/campaigns/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Check EC2 status
curl http://localhost:3000/api/campaigns/1/ec2 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Check DNS status
curl http://localhost:3000/api/campaigns/1/dns \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Send Emails

Once the campaign status is `ready`:

```bash
curl -X POST http://localhost:3000/api/campaigns/1/enqueue \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "emails": [
      {"recipient": "user1@example.com"},
      {"recipient": "user2@example.com"}
    ]
  }'
```

## Monitoring

### Docker Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f orchestrator
docker-compose logs -f postgres
```

### Database Access

```bash
docker-compose exec postgres psql -U gadmin -d gadmin_toolkit

# Example queries
SELECT * FROM gsuite_domains;
SELECT * FROM gsuite_users WHERE status = 'pending';
SELECT * FROM ec2_instances;
```

### Application Logs

```bash
# View application logs
docker-compose exec api tail -f /app/logs/combined.log
```

## Troubleshooting

### Service Account Authentication Fails

1. Verify domain-wide delegation is enabled
2. Check that all required OAuth scopes are added
3. Ensure the admin email exists and has proper permissions
4. Test with the `/api/gsuite/test-auth` endpoint

### EC2 Instance Creation Fails

1. Check AWS credentials in `.env`
2. Verify security group allows required ports
3. Check AWS account limits (EC2 instances)
4. Review application logs: `docker-compose logs -f api`

### DNS Not Resolving

1. Verify Route53 hosted zone ID is correct
2. Check that tracking domain is properly configured
3. Wait for DNS propagation (can take 5-15 minutes)
4. Test with: `dig track123.yourdomain.com`

### SSL Certificate Installation Fails

1. Ensure DNS is properly configured first
2. Check that port 80 and 443 are accessible
3. Verify email for Let's Encrypt is valid
4. Check EC2 instance logs

### Users Not Creating in Google

1. Check service account credentials are valid
2. Verify rate limiting (250ms between requests)
3. Check password meets Google Workspace requirements
4. Review API logs for specific errors

## Maintenance

### Backup Database

```bash
docker-compose exec postgres pg_dump -U gadmin gadmin_toolkit > backup.sql
```

### Update Application

```bash
git pull
docker-compose build
docker-compose up -d
```

### Cleanup Old EC2 Instances

```bash
# List terminated instances
curl http://localhost:3000/api/ec2/terminated \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Renew SSL Certificates

SSL certificates auto-renew via cron. To manually renew:

```bash
curl -X POST http://localhost:3000/api/ssl/renew \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Security Best Practices

1. **Encryption Key**: Use a strong 32-character encryption key
2. **Database Password**: Use a complex password for PostgreSQL
3. **JWT Secret**: Use a strong secret for JWT tokens
4. **Service Account Keys**: Store securely, never commit to git
5. **AWS Keys**: Use IAM roles when possible
6. **Security Groups**: Restrict SSH access to specific IPs
7. **SSL/TLS**: Always use HTTPS in production
8. **Rate Limiting**: Keep API rate limiting enabled

## Support

For issues or questions:
- GitHub Issues: https://github.com/anaitabd/GAdmin-Toolkit/issues
- Documentation: See README.md and other guides

