# Deployment Guide

## Overview

This guide walks through deploying the email delivery platform to production on AWS EC2 or Azure VM. The stack includes:
- Node.js application server
- PostgreSQL database
- PM2 process manager
- Nginx reverse proxy
- SSL/TLS certificates

## Prerequisites

- AWS EC2 instance or Azure VM (t3.medium or larger)
- Ubuntu 20.04 LTS or later
- Domain name with DNS access
- Google Workspace admin access (for Gmail API)
- SSH access to server

## Step 1: Provision Server

### AWS EC2

```bash
# Launch instance via AWS CLI
aws ec2 run-instances \
    --image-id ami-0c55b159cbfafe1f0 \  # Ubuntu 20.04 LTS
    --instance-type t3.medium \
    --key-name your-key-pair \
    --security-group-ids sg-xxxxxx \
    --subnet-id subnet-xxxxxx \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=email-platform}]'

# Configure security group
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxx \
    --protocol tcp --port 22 --cidr 0.0.0.0/0  # SSH
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxx \
    --protocol tcp --port 80 --cidr 0.0.0.0/0  # HTTP
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxx \
    --protocol tcp --port 443 --cidr 0.0.0.0/0  # HTTPS
```

### Azure VM

```bash
# Create VM via Azure CLI
az vm create \
    --resource-group email-platform-rg \
    --name email-platform-vm \
    --image UbuntuLTS \
    --size Standard_B2s \
    --admin-username azureuser \
    --ssh-key-values ~/.ssh/id_rsa.pub

# Open ports
az vm open-port --port 22 --resource-group email-platform-rg --name email-platform-vm
az vm open-port --port 80 --resource-group email-platform-rg --name email-platform-vm
az vm open-port --port 443 --resource-group email-platform-rg --name email-platform-vm
```

## Step 2: Initial Server Setup

SSH into your server:

```bash
ssh ubuntu@your-server-ip
```

### Update system

```bash
sudo apt update
sudo apt upgrade -y
```

### Create application user

```bash
sudo adduser --disabled-password --gecos "" emailapp
sudo usermod -aG sudo emailapp
```

### Set up firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Step 3: Install Dependencies

### Install Node.js 18+

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should be v18.x or higher
```

### Install PostgreSQL 14+

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo -u postgres psql --version
```

### Install PM2

```bash
sudo npm install -g pm2
pm2 --version
```

### Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Install Certbot (for SSL)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

## Step 4: Set Up Database

### Create database and user

```bash
sudo -u postgres psql
```

```sql
-- Create database
CREATE DATABASE emaildb;

-- Create user
CREATE USER emailapp WITH ENCRYPTED PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE emaildb TO emailapp;

-- Exit
\q
```

### Configure PostgreSQL

```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

Optimize settings:

```conf
# Memory
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 4MB

# Connections
max_connections = 100

# Query planner
random_page_cost = 1.1  # For SSD
effective_io_concurrency = 200

# WAL
wal_buffers = 16MB
min_wal_size = 1GB
max_wal_size = 4GB

# Logging
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_min_duration_statement = 1000  # Log slow queries (>1s)
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

## Step 5: Deploy Application

### Clone repository

```bash
sudo su - emailapp
cd ~
git clone https://github.com/yourusername/GAdmin-Toolkit.git
cd GAdmin-Toolkit
```

### Install dependencies

```bash
npm install --production
```

### Set up environment variables

```bash
nano .env
```

```env
# Server
NODE_ENV=production
PORT=3000
BASE_URL=https://yourdomain.com

# Database
DATABASE_URL=postgresql://emailapp:your_secure_password@localhost/emaildb

# Authentication
JWT_SECRET=your_jwt_secret_here_use_strong_random_string

# Gmail API
GMAIL_SERVICE_ACCOUNT_PATH=/home/emailapp/GAdmin-Toolkit/cred.json

# Tracking
TRACKING_SECRET=your_tracking_secret_here

# Monitoring (optional)
SENTRY_DSN=https://...  # If using Sentry

# Email
SMTP_POOL_MAX=5

# Rate Limiting
MAX_WORKERS=50
WORKER_RESTART_DELAY=5000
```

### Upload Google service account credentials

```bash
# On your local machine
scp /path/to/cred.json emailapp@your-server-ip:~/GAdmin-Toolkit/cred.json

# On server, set permissions
chmod 600 ~/GAdmin-Toolkit/cred.json
```

### Run database migrations

```bash
npm run migrate
```

This should create all required tables (sender_accounts, email_queue, send_logs, etc.)

## Step 6: Configure PM2

Create PM2 ecosystem file:

```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
    apps: [
        {
            name: 'email-api',
            script: './src/server.js',
            instances: 2,
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production'
            },
            error_file: './logs/api-error.log',
            out_file: './logs/api-out.log',
            time: true,
            max_memory_restart: '500M'
        },
        {
            name: 'orchestrator',
            script: './src/workers/orchestrator.js',
            instances: 1,
            exec_mode: 'fork',
            env: {
                NODE_ENV: 'production'
            },
            error_file: './logs/orchestrator-error.log',
            out_file: './logs/orchestrator-out.log',
            time: true,
            max_memory_restart: '300M',
            restart_delay: 5000
        },
        {
            name: 'cron-scheduler',
            script: './src/cron/scheduler.js',
            instances: 1,
            exec_mode: 'fork',
            env: {
                NODE_ENV: 'production'
            },
            error_file: './logs/cron-error.log',
            out_file: './logs/cron-out.log',
            time: true
        }
    ]
};
```

Create logs directory:

```bash
mkdir -p logs
```

Start applications:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

The last command will output a command to run with sudo - execute it to enable PM2 startup on boot.

## Step 7: Configure Nginx

### Create Nginx configuration

```bash
sudo nano /etc/nginx/sites-available/email-platform
```

```nginx
upstream api_backend {
    least_conn;
    server 127.0.0.1:3000;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (will be configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Logging
    access_log /var/log/nginx/email-platform-access.log;
    error_log /var/log/nginx/email-platform-error.log;

    # Max upload size
    client_max_body_size 10M;

    # API endpoints
    location /api/ {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Tracking endpoints
    location /track/ {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Cache tracking pixel
        location /track/open/ {
            proxy_pass http://api_backend;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }

    # Unsubscribe endpoint
    location /unsubscribe/ {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin dashboard (if applicable)
    location / {
        root /home/emailapp/GAdmin-Toolkit/public;
        try_files $uri $uri/ /index.html;
    }
}
```

### Enable site

```bash
sudo ln -s /etc/nginx/sites-available/email-platform /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

## Step 8: Set Up SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts. Certbot will automatically:
- Obtain SSL certificate from Let's Encrypt
- Update Nginx configuration
- Set up automatic renewal

Test automatic renewal:

```bash
sudo certbot renew --dry-run
```

## Step 9: Configure DNS

Add these DNS records:

```
A      yourdomain.com             -> your-server-ip
CNAME  www.yourdomain.com         -> yourdomain.com
TXT    yourdomain.com             -> v=spf1 include:_spf.google.com ~all
TXT    google._domainkey          -> v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY
TXT    _dmarc.yourdomain.com      -> v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

For multiple sending domains (mail1, mail2, etc.), repeat for each:

```
A      mail1.yourdomain.com       -> your-server-ip
TXT    mail1.yourdomain.com       -> v=spf1 include:_spf.google.com ~all
TXT    google._domainkey.mail1    -> v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY
```

## Step 10: Set Up Monitoring

### Install Prometheus (optional)

```bash
# Download and install Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
tar xvfz prometheus-*.tar.gz
sudo mv prometheus-*/prometheus /usr/local/bin/
sudo mv prometheus-*/promtool /usr/local/bin/
```

### Configure log rotation

```bash
sudo nano /etc/logrotate.d/email-platform
```

```
/home/emailapp/GAdmin-Toolkit/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 emailapp emailapp
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

## Step 11: Set Up Cron Jobs

```bash
crontab -e
```

```cron
# Reset daily counters at midnight UTC
0 0 * * * curl -X POST http://localhost:3000/api/cron/reset-daily-counters

# Progress warm-up stages daily
0 1 * * * curl -X POST http://localhost:3000/api/cron/progress-warmup

# Check bounce rates hourly
0 * * * * curl -X POST http://localhost:3000/api/cron/check-bounce-rates

# Archive old data monthly
0 2 1 * * curl -X POST http://localhost:3000/api/cron/archive-old-data

# Database backup daily
0 3 * * * pg_dump -U emailapp emaildb | gzip > /backups/emaildb-$(date +\%Y\%m\%d).sql.gz

# Clean old backups (keep 30 days)
0 4 * * * find /backups -name "emaildb-*.sql.gz" -mtime +30 -delete
```

## Step 12: Initial Configuration

### Create admin user

```bash
npm run create-admin
```

### Add first sender account

```bash
curl -X POST http://localhost:3000/api/admin/accounts \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sender1@yourdomain.com",
    "auth_type": "gmail",
    "warmup": true
  }'
```

## Step 13: Verify Deployment

### Check services

```bash
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql
```

### Test API

```bash
curl https://yourdomain.com/api/health
```

Should return:

```json
{
    "status": "healthy",
    "database": "connected",
    "workers": 2
}
```

### Monitor logs

```bash
pm2 logs
tail -f logs/api-out.log
tail -f /var/log/nginx/email-platform-access.log
```

## Backup and Recovery

### Database backup

```bash
# Manual backup
pg_dump -U emailapp emaildb > /backups/emaildb-backup.sql

# Restore
psql -U emailapp emaildb < /backups/emaildb-backup.sql
```

### Application backup

```bash
# Backup configuration
tar -czf /backups/app-config-$(date +%Y%m%d).tar.gz \
    .env \
    cred.json \
    ecosystem.config.js

# Backup database and config
tar -czf /backups/full-backup-$(date +%Y%m%d).tar.gz \
    /backups/emaildb-$(date +%Y%m%d).sql.gz \
    /home/emailapp/GAdmin-Toolkit/.env \
    /home/emailapp/GAdmin-Toolkit/cred.json
```

## Scaling Up

### Add more capacity

1. Create new Gmail accounts via Admin SDK
2. Add accounts via API:
   ```bash
   curl -X POST https://yourdomain.com/api/admin/accounts \
     -H "Authorization: Bearer TOKEN" \
     -d '{"email":"sender10@yourdomain.com","warmup":true}'
   ```
3. Orchestrator automatically spawns workers

### Horizontal scaling (multiple servers)

1. Set up second EC2 instance
2. Point to same PostgreSQL (use RDS for multi-AZ)
3. Use load balancer (ALB or nginx) for API traffic
4. Workers on both instances will coordinate via database

## Troubleshooting

### Workers not starting

```bash
pm2 logs orchestrator
# Check for errors in database connection or account configuration
```

### High bounce rate

```bash
# Check bounce list
psql -U emailapp emaildb -c "SELECT email, bounce_type, bounce_reason FROM bounce_list ORDER BY last_bounced_at DESC LIMIT 10;"

# Pause account
curl -X PATCH https://yourdomain.com/api/admin/accounts/1 \
  -H "Authorization: Bearer TOKEN" \
  -d '{"status":"paused"}'
```

### Database slow

```bash
# Check slow queries
sudo -u postgres psql emaildb -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Vacuum database
sudo -u postgres psql emaildb -c "VACUUM ANALYZE;"
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-03  
**Author**: Principal Backend Architect
