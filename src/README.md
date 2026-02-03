# GAdmin-Toolkit - PostgreSQL Implementation

This is a PostgreSQL-based implementation of the GAdmin-Toolkit with email workers for parallel processing.

## Architecture

- **Database**: PostgreSQL with connection pooling
- **Server**: Express.js REST API
- **Email Service**: Nodemailer with SMTP
- **Workers**: Parallel email processing with queue management
- **Logging**: Winston-based structured logging (console fallback)

## Project Structure

```
src/
├── config/           # Configuration management
│   └── index.js
├── db/              # Database layer
│   ├── connection.js    # PostgreSQL connection pool
│   └── migrate.js       # Database migrations
├── services/        # Business services
│   └── email/
│       └── smtp.js      # SMTP email service
├── workers/         # Email worker system
│   ├── sendWorker.js    # Individual email worker
│   └── workerManager.js # Worker orchestration
├── routes/          # API routes
│   ├── email.js         # Email endpoints
│   ├── user.js          # User endpoints
│   └── worker.js        # Worker endpoints
├── utils/           # Utilities
│   └── logger.js        # Logging utility
├── server.js        # Main server entry point
├── .env.example     # Environment variables template
└── package.json     # Dependencies
```

## Setup

### 1. Install Dependencies

```bash
cd src
npm install
```

### 2. Setup PostgreSQL

Make sure PostgreSQL is installed and running:

```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql

# Create database
sudo -u postgres createdb gadmin_toolkit
```

### 3. Configure Environment

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gadmin_toolkit
DB_USER=postgres
DB_PASSWORD=your_password

SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 4. Run Database Migrations

```bash
npm run migrate
```

This creates the following tables:
- `users` - User management
- `email_logs` - Email sending logs
- `bounced_emails` - Bounced email tracking
- `admin_users` - Admin authentication
- `email_queue` - Email processing queue
- `worker_stats` - Worker performance tracking

### 5. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on http://localhost:3001

## API Endpoints

### Email Endpoints

- **POST /api/emails/send** - Send an email immediately
- **POST /api/emails/queue** - Add email to queue
- **GET /api/emails/logs** - Get email logs
- **GET /api/emails/queue/status** - Get queue statistics
- **GET /api/emails/bounced** - Get bounced emails

### User Endpoints

- **GET /api/users** - List all users
- **GET /api/users/:id** - Get user by ID
- **POST /api/users** - Create new user
- **PUT /api/users/:id** - Update user
- **DELETE /api/users/:id** - Delete user
- **GET /api/users/stats/overview** - Get user statistics

### Worker Endpoints

- **POST /api/workers/start** - Start email workers
- **POST /api/workers/stop** - Stop all workers
- **GET /api/workers/status** - Get worker status
- **GET /api/workers/stats** - Get worker statistics

### Health Check

- **GET /health** - Server health check

## Usage Examples

### Send an Email Immediately

```bash
curl -X POST http://localhost:3001/api/emails/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "subject": "Test Email",
    "body": "This is a test email"
  }'
```

### Queue an Email for Worker Processing

```bash
curl -X POST http://localhost:3001/api/emails/queue \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "subject": "Queued Email",
    "body": "This email will be processed by workers",
    "priority": 5
  }'
```

### Start Email Workers

```bash
curl -X POST http://localhost:3001/api/workers/start \
  -H "Content-Type: application/json" \
  -d '{
    "count": 5,
    "emailsPerWorker": 100
  }'
```

### Create a User

```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

## Worker System

The worker system processes emails from the queue in parallel:

1. **Email Queue**: Emails are added to `email_queue` table
2. **Workers**: Multiple workers run concurrently (default: 5)
3. **Processing**: Each worker processes up to N emails (default: 100)
4. **Retry Logic**: Failed emails are retried up to 3 times
5. **Logging**: All attempts are logged to `email_logs`
6. **Statistics**: Worker performance tracked in `worker_stats`

### Worker Configuration

Configure in `.env`:

```env
CONCURRENT_WORKERS=5      # Number of parallel workers
EMAILS_PER_WORKER=100     # Emails per worker per run
RETRY_ATTEMPTS=3          # Max retry attempts
RETRY_DELAY=5000         # Delay between retries (ms)
```

## Database Management

### Run Migrations

```bash
npm run migrate
```

### Rollback (Drop all tables)

```bash
npm run migrate:rollback
```

⚠️ **Warning**: Rollback will delete all data!

## Logging

Logs are output to console with the following levels:
- `error` - Error messages
- `warn` - Warning messages
- `info` - Informational messages
- `debug` - Debug messages

Configure log level in `.env`:

```env
LOG_LEVEL=info
```

## Development

### Adding New Routes

1. Create route file in `src/routes/`
2. Import in `server.js`
3. Add to app: `app.use('/api/endpoint', routeFile)`

### Adding New Services

1. Create service file in `src/services/`
2. Export service functions or class
3. Import in routes or workers

### Database Queries

Use the query function from `db/connection.js`:

```javascript
const { query } = require('../db/connection');

const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
```

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use a process manager like PM2:

```bash
npm install -g pm2
pm2 start server.js --name gadmin-toolkit
pm2 save
pm2 startup
```

3. Setup PostgreSQL with proper credentials
4. Use environment variables for sensitive data
5. Setup reverse proxy (nginx) for HTTPS
6. Configure firewall rules
7. Setup monitoring and logging

## Differences from main/api Implementation

This implementation differs from the existing `main/api` MongoDB implementation:

- **Database**: PostgreSQL instead of MongoDB
- **Workers**: Queue-based parallel processing
- **Architecture**: Separate from existing codebase
- **Email Queue**: Persistent queue in PostgreSQL
- **Worker Stats**: Detailed worker performance tracking

## Next Steps

- [ ] Add JWT authentication middleware
- [ ] Add input validation middleware
- [ ] Add rate limiting
- [ ] Add Gmail API service (alongside SMTP)
- [ ] Add analytics endpoints
- [ ] Add cron jobs for maintenance
- [ ] Add comprehensive tests
- [ ] Add API documentation (Swagger/OpenAPI)

## License

MIT
