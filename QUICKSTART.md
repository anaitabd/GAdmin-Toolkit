# Quick Start Guide

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/email_platform

# JWT Secret
JWT_SECRET=your-secret-key-here

# Server
PORT=3000
NODE_ENV=production

# Worker Configuration
WORKER_BATCH_SIZE=10
WORKER_DELAY_MS=1000
MAX_WORKER_RESTARTS=5
HEALTH_CHECK_INTERVAL_MS=30000

# Tracking
TRACKING_BASE_URL=https://yourdomain.com

# Logging
LOG_LEVEL=info
LOG_DIR=logs
LOG_RETENTION_DAYS=90

# Database Pool
DB_POOL_MAX=20
```

### 3. Setup Database

Run migrations to create all tables:

```bash
npm run migrate
```

### 4. Create Admin User

Create your first admin user:

```bash
npm run create-admin
```

Follow the prompts to enter username and password.

## Running the Application

### Development Mode

Run API server with auto-reload:

```bash
npm run dev
```

### Production Mode

#### Option 1: Using PM2 (Recommended)

Start all services:

```bash
pm2 start ecosystem.config.js
```

View logs:

```bash
pm2 logs
```

Monitor services:

```bash
pm2 monit
```

Stop services:

```bash
pm2 stop all
```

#### Option 2: Manual Start

Start each service in separate terminals:

Terminal 1 - API Server:
```bash
npm start
```

Terminal 2 - Orchestrator:
```bash
npm run orchestrator
```

Terminal 3 - Cron Scheduler:
```bash
npm run cron
```

## Testing the Installation

### 1. Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-02-04T18:00:00.000Z",
    "uptime": 123.456
  }
}
```

### 2. Admin Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-password"
  }'
```

Save the returned token for subsequent requests.

### 3. Add a Sender Account

```bash
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "sender@example.com",
    "provider": "smtp",
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "smtp_secure": false,
    "smtp_username": "sender@example.com",
    "smtp_password": "app-password"
  }'
```

### 4. Create a Campaign

```bash
curl -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Campaign",
    "description": "First campaign"
  }'
```

### 5. Queue Emails

```bash
curl -X POST http://localhost:3000/api/queue/enqueue \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "campaign_id": 1,
    "emails": [
      {
        "recipient_email": "test@example.com",
        "subject": "Test Email",
        "html_body": "<h1>Hello!</h1><p>This is a test.</p>",
        "text_body": "Hello! This is a test."
      }
    ]
  }'
```

### 6. Check Queue Status

```bash
curl http://localhost:3000/api/queue/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## API Documentation

### Authentication

All admin API endpoints require JWT authentication:

```
Authorization: Bearer YOUR_TOKEN
```

### Key Endpoints

#### Accounts Management
- `GET /api/accounts` - List all accounts
- `GET /api/accounts/:id` - Get account details
- `POST /api/accounts` - Create new account
- `PATCH /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Archive account

#### Campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns` - List campaigns
- `GET /api/campaigns/:id` - Campaign details
- `DELETE /api/campaigns/:id` - Cancel campaign

#### Queue Management
- `POST /api/queue/enqueue` - Add emails to queue
- `GET /api/queue/status` - View queue status
- `POST /api/queue/clear-failed` - Clear failed emails
- `POST /api/queue/retry-failed` - Retry failed emails

#### Analytics
- `GET /api/analytics/overview` - System overview
- `GET /api/analytics/campaigns/:id` - Campaign stats
- `GET /api/analytics/accounts/:id` - Account stats

#### Tracking (No auth required)
- `GET /track/open/:token` - Open tracking pixel
- `GET /track/click/:token?url=...` - Click tracking redirect
- `GET /track/unsubscribe/:token` - Unsubscribe page

## Monitoring

### View Logs

Application logs:
```bash
tail -f logs/combined.log
```

Error logs:
```bash
tail -f logs/error.log
```

PM2 logs:
```bash
pm2 logs email-api
pm2 logs orchestrator
pm2 logs cron-scheduler
```

### Database Queries

Check active sender accounts:
```sql
SELECT id, email, status, emails_sent_today, current_daily_limit
FROM sender_accounts
WHERE archived = false;
```

Check queue status:
```sql
SELECT status, COUNT(*) as count
FROM email_queue
GROUP BY status;
```

View recent sends:
```sql
SELECT sl.*, sa.email as sender_email
FROM send_logs sl
JOIN sender_accounts sa ON sa.id = sl.sender_account_id
ORDER BY sl.created_at DESC
LIMIT 20;
```

## Troubleshooting

### Workers not starting
- Check orchestrator logs: `pm2 logs orchestrator`
- Verify accounts are in 'active' or 'warming_up' status
- Check database connection

### Emails not sending
- Verify account credentials are correct
- Check account status (not paused/suspended)
- Verify daily limit not reached
- Check worker logs for errors

### High bounce rate
- Accounts automatically pause at >5% bounce rate
- Review email content and recipient list quality
- Check SPF/DKIM/DMARC configuration

### Authentication failures
- Accounts automatically suspended on auth failure
- Verify Gmail API credentials or SMTP password
- Check if app password is still valid

## Production Deployment

For full production deployment instructions, see:
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Complete deployment guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md) - Implementation guide

## Support

For issues or questions:
1. Check the documentation in `/docs`
2. Review logs in `/logs` directory
3. Check database state
4. Review the implementation roadmap

## License

MIT
