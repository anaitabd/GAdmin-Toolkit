# Google Workspace Management Guide

Complete guide for managing Google Workspace users with GAdmin-Toolkit.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup](#setup)
3. [Creating Google Workspace Users](#creating-google-workspace-users)
4. [Deleting Google Workspace Users](#deleting-google-workspace-users)
5. [Detecting Bounced Emails](#detecting-bounced-emails)
6. [Credential Management](#credential-management)
7. [Tracking Links](#tracking-links)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Google Cloud Console Setup

1. **Create a Service Account:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Navigate to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Give it a name (e.g., "workspace-admin")
   - Grant it appropriate roles (not required for domain-wide delegation)
   - Create and download the JSON key file

2. **Enable Required APIs:**
   - Admin SDK API
   - Gmail API (for bounce detection)

3. **Configure Domain-Wide Delegation:**
   - In Google Cloud Console, go to your service account
   - Click "Show Domain-Wide Delegation"
   - Enable domain-wide delegation
   - Note the Client ID

4. **Authorize in Google Workspace Admin:**
   - Go to [Google Admin Console](https://admin.google.com)
   - Navigate to Security > API Controls > Domain-wide Delegation
   - Click "Add new"
   - Enter the Client ID from step 3
   - Add the following OAuth scopes:
     ```
     https://www.googleapis.com/auth/admin.directory.user
     https://mail.google.com/
     ```
   - Click "Authorize"

### Database Setup

Ensure your PostgreSQL database is running with the schema from `main/api/db/schema.sql`.

---

## Setup

### Option 1: Store Credentials in Database (Recommended)

Use the API to store your service account credentials:

```bash
# Read your service account JSON file
SERVICE_ACCOUNT_JSON=$(cat path/to/service-account.json)

# Store it in the database
curl -X POST http://localhost:3000/api/credentials \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Production Service Account\",
    \"domain\": \"your-domain.com\",
    \"cred_json\": $SERVICE_ACCOUNT_JSON,
    \"active\": true
  }"
```

### Option 2: Use Environment Variable

Alternatively, encode your service account JSON as base64:

```bash
# Encode service account JSON
base64 -w 0 path/to/service-account.json

# Set environment variable
export GOOGLE_CRED_JSON_B64="<base64-encoded-json>"
```

### Configure Admin Email

Set the default admin email in settings:

```bash
curl -X PUT http://localhost:3000/api/settings/admin_email \
  -H "Content-Type: application/json" \
  -d '{
    "value": "admin@your-domain.com"
  }'
```

---

## Creating Google Workspace Users

### Step 1: Prepare User Data

Add users to the database using one of these methods:

**Method A: Bulk Insert via API**

```bash
curl -X POST http://localhost:3000/api/jobs/bulk-users \
  -H "Content-Type: application/json" \
  -d '{
    "users": [
      {
        "email": "john.doe@your-domain.com",
        "password": "TempPass123!",
        "given_name": "John",
        "family_name": "Doe"
      },
      {
        "email": "jane.smith@your-domain.com",
        "password": "TempPass456!",
        "given_name": "Jane",
        "family_name": "Smith"
      }
    ]
  }'
```

**Method B: Generate Random Users**

```bash
curl -X POST http://localhost:3000/api/jobs/generate-users \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "your-domain.com",
    "num_records": 100
  }'
```

This will create a job that generates random users. Monitor the job progress:

```bash
curl http://localhost:3000/api/jobs/1
```

**Method C: Insert Individual Users**

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@your-domain.com",
    "password": "SecurePass123!",
    "given_name": "First",
    "family_name": "Last"
  }'
```

### Step 2: Create Users in Google Workspace

Once users are in the database, create them in Google Workspace:

```bash
curl -X POST http://localhost:3000/api/jobs/create-google-users \
  -H "Content-Type: application/json" \
  -d '{
    "admin_email": "admin@your-domain.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "type": "create_google_users",
    "status": "pending",
    "progress": 0,
    "total_items": 0,
    "processed_items": 0,
    "params": {
      "admin_email": "admin@your-domain.com",
      "totalUsers": 100
    },
    "created_at": "2026-02-08T18:00:00.000Z"
  }
}
```

### Step 3: Monitor Progress

**Option A: Poll Job Status**

```bash
# Check job status every few seconds
curl http://localhost:3000/api/jobs/1
```

**Option B: Stream Real-Time Updates (SSE)**

```javascript
const eventSource = new EventSource('http://localhost:3000/api/jobs/1/stream');

eventSource.onmessage = (event) => {
  const job = JSON.parse(event.data);
  console.log(`Status: ${job.status}`);
  console.log(`Progress: ${job.progress}%`);
  console.log(`Processed: ${job.processed_items}/${job.total_items}`);
  
  if (['completed', 'failed', 'cancelled'].includes(job.status)) {
    console.log('Job finished!');
    eventSource.close();
  }
};

eventSource.onerror = (error) => {
  console.error('SSE Error:', error);
  eventSource.close();
};
```

**Option C: Using curl with SSE**

```bash
curl -N http://localhost:3000/api/jobs/1/stream
```

### What Happens During Creation

1. Job is created with status `pending`
2. Job worker process starts and changes status to `running`
3. For each user in the database:
   - Creates the user in Google Workspace via Admin SDK API
   - Sets the password (no password change required at first login)
   - Updates progress (processed_items and progress percentage)
   - Waits 250ms between requests (rate limiting)
4. Job completes with status `completed` or `failed`

### Handling Errors

If some users fail to create:
- Check the job's `error_message` field
- Common issues:
  - User already exists (not an error, skipped)
  - Invalid email format
  - Insufficient permissions
  - Rate limit exceeded

```bash
# View job details to see errors
curl http://localhost:3000/api/jobs/1
```

---

## Deleting Google Workspace Users

**⚠️ WARNING:** This will delete ALL users in your Google Workspace domain except the specified admin email. Use with extreme caution!

### Step 1: Start Deletion Job

```bash
curl -X POST http://localhost:3000/api/jobs/delete-google-users \
  -H "Content-Type: application/json" \
  -d '{
    "admin_email": "admin@your-domain.com"
  }'
```

The `admin_email` will be preserved. All other users will be deleted.

### Step 2: Monitor Progress

```bash
# Check status
curl http://localhost:3000/api/jobs/2

# Or stream real-time updates
curl -N http://localhost:3000/api/jobs/2/stream
```

### What Happens During Deletion

1. Lists all users in the domain (paginated, 100 per page)
2. Filters out the admin email
3. Deletes each user one by one
4. Waits 250ms between deletions (rate limiting)
5. Updates progress in real-time

### Best Practices

1. **Always specify the correct admin email** - Double-check before running
2. **Test on a non-production domain first** - This operation cannot be undone
3. **Backup important data** - Ensure you have backups before mass deletion
4. **Use for cleanup only** - This is typically used for:
   - Development/testing environments
   - Bulk cleanup of old accounts
   - Resetting a domain

### Cancelling a Deletion Job

If you started a deletion by mistake:

```bash
curl -X POST http://localhost:3000/api/jobs/2/cancel
```

This will stop the job, but users already deleted cannot be restored.

---

## Detecting Bounced Emails

Scan all user inboxes for bounced email notifications and log them for future reference.

### Step 1: Start Bounce Detection

```bash
curl -X POST http://localhost:3000/api/jobs/detect-bounces
```

No parameters required - it will scan all users in the database.

### Step 2: Monitor Progress

```bash
# Check status
curl http://localhost:3000/api/jobs/3

# Or stream updates
curl -N http://localhost:3000/api/jobs/3/stream
```

### Step 3: View Bounced Emails

Once the job completes, view the bounce logs:

```bash
# Get all bounce logs
curl http://localhost:3000/api/bounce-logs

# Get bounce statistics
curl http://localhost:3000/api/bounce-logs/stats/summary

# Filter by email
curl 'http://localhost:3000/api/bounce-logs?email=bounced@example.com'
```

### What Gets Detected

The system looks for emails from "Mail Delivery Subsystem" that contain:
- Bounce notifications
- Undeliverable messages
- Email delivery failures

It extracts the bounced email addresses from the message snippets and stores them in the `bounce_logs` table.

### Using Bounce Data

Bounced emails indicate:
- Invalid email addresses
- Full mailboxes
- Blocked domains
- Temporary delivery failures

Use this data to:
1. Clean up your recipient lists
2. Avoid sending to invalid addresses
3. Improve email deliverability
4. Track email quality

```bash
# Get unique bounced emails
curl http://localhost:3000/api/bounce-logs | jq -r '.data[].email' | sort -u

# Count bounces per email
curl http://localhost:3000/api/bounce-logs | jq -r '.data[].email' | sort | uniq -c
```

---

## Credential Management

### List All Credentials

```bash
curl http://localhost:3000/api/credentials
```

### Get Active Credential

```bash
curl http://localhost:3000/api/credentials/active
```

### Add a New Credential

```bash
curl -X POST http://localhost:3000/api/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Service Account",
    "domain": "your-domain.com",
    "cred_json": {
      "type": "service_account",
      "project_id": "your-project",
      "private_key_id": "...",
      "private_key": "...",
      "client_email": "...",
      "client_id": "...",
      "auth_uri": "...",
      "token_uri": "...",
      "auth_provider_x509_cert_url": "...",
      "client_x509_cert_url": "..."
    },
    "active": true
  }'
```

### Update a Credential

```bash
curl -X PUT http://localhost:3000/api/credentials/1 \
  -H "Content-Type: application/json" \
  -d '{
    "active": true
  }'
```

### Delete a Credential

```bash
curl -X DELETE http://localhost:3000/api/credentials/1
```

### Switch Active Credential

To switch to a different credential:

1. Set the old one to inactive:
```bash
curl -X PUT http://localhost:3000/api/credentials/1 \
  -H "Content-Type: application/json" \
  -d '{"active": false}'
```

2. Set the new one to active:
```bash
curl -X PUT http://localhost:3000/api/credentials/2 \
  -H "Content-Type: application/json" \
  -d '{"active": true}'
```

3. Clear the credentials cache (restart the server or use the API if available)

---

## Tracking Links

Generate tracking links that redirect to target URLs while recording clicks.

### Create a Single Tracking Link

```bash
curl -X POST http://localhost:3000/api/tracking-links \
  -H "Content-Type: application/json" \
  -d '{
    "original_url": "https://example.com/offer",
    "to_email": "customer@example.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "track_id": "550e8400-e29b-41d4-a716-446655440000",
    "original_url": "https://example.com/offer",
    "tracking_url": "http://localhost:3000/t/c/550e8400-e29b-41d4-a716-446655440000",
    "to_email": "customer@example.com",
    "clicked": false,
    "created_at": "2026-02-08T18:00:00.000Z"
  }
}
```

### Create Multiple Tracking Links

```bash
curl -X POST http://localhost:3000/api/tracking-links/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "links": [
      {
        "original_url": "https://example.com/product1",
        "to_email": "user1@example.com"
      },
      {
        "original_url": "https://example.com/product2",
        "to_email": "user2@example.com"
      },
      "https://example.com/product3"
    ]
  }'
```

### Use Tracking Links in Emails

Replace original URLs with tracking URLs in your email content:

**Before:**
```html
<a href="https://example.com/offer">Click here</a>
```

**After:**
```html
<a href="http://localhost:3000/t/c/550e8400-e29b-41d4-a716-446655440000">Click here</a>
```

When a user clicks the link:
1. The click is recorded in the database
2. The user is redirected to the original URL
3. The redirect happens instantly (302 redirect)

### Monitor Clicks

**Get all clicks:**
```bash
curl 'http://localhost:3000/api/tracking-links?clicked=true'
```

**Get clicks for a specific email:**
```bash
curl 'http://localhost:3000/api/tracking-links?to_email=customer@example.com'
```

**Get tracking link details:**
```bash
curl http://localhost:3000/api/tracking-links/550e8400-e29b-41d4-a716-446655440000
```

### Calculate Click-Through Rate (CTR)

For campaigns with jobs:

```bash
curl http://localhost:3000/api/jobs/1/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "job_id": 1,
    "sent": 1000,
    "failed": 50,
    "total_clicks": 250,
    "unique_clickers": 200,
    "ctr": 20.0
  }
}
```

---

## Troubleshooting

### Common Issues

#### 1. "No Google credentials found"

**Problem:** Service account credentials not configured.

**Solutions:**
- Add credentials via `/api/credentials` API
- Or set `GOOGLE_CRED_JSON_B64` environment variable
- Ensure credentials are valid JSON

#### 2. "Insufficient permissions"

**Problem:** Service account doesn't have domain-wide delegation.

**Solutions:**
- Enable domain-wide delegation in Google Cloud Console
- Authorize the service account in Google Admin Console
- Ensure correct OAuth scopes are granted

#### 3. "User already exists"

**Problem:** Trying to create a user that already exists.

**Solution:** This is not an error - the system skips existing users. Check Google Admin Console to verify.

#### 4. "Rate limit exceeded"

**Problem:** Making too many API requests too quickly.

**Solutions:**
- The system automatically delays requests (250ms between operations)
- For very large operations, jobs may take longer
- Consider reducing batch sizes

#### 5. Job stuck in "running" status

**Problem:** Job process may have crashed.

**Solutions:**
- Check server logs for errors
- Cancel the job: `curl -X POST http://localhost:3000/api/jobs/:id/cancel`
- Restart the API server
- Check database connections

#### 6. Tracking links return 404

**Problem:** Tracking link doesn't exist or was deleted.

**Solutions:**
- Verify the track_id is correct
- Check if the link exists: `curl http://localhost:3000/api/tracking-links/:trackId`
- Ensure the database contains the click_tracking record

### Debug Mode

Enable debug logging:

```bash
export NODE_ENV=development
node main/api/server.js
```

This will include stack traces in error responses.

### Getting Help

1. Check the API documentation: `main/api/API_DOCUMENTATION.md`
2. Review server logs for detailed error messages
3. Test with curl/Postman to isolate issues
4. Verify database connectivity and schema
5. Ensure all required environment variables are set

---

## Performance Optimization

### For Large-Scale Operations

**Creating 1000+ users:**
- Expected time: ~4-5 minutes (250ms delay per user)
- Monitor via SSE for real-time progress
- Consider breaking into smaller batches

**Deleting 1000+ users:**
- Expected time: ~4-5 minutes
- Cannot be parallelized due to API limits
- Use with caution

**Detecting bounces:**
- Time depends on number of users and emails
- Each user's inbox is checked sequentially
- Can take 10-30 minutes for 1000 users

### Scaling Tips

1. **Use job-based operations** - All heavy operations run as background jobs
2. **Monitor progress** - Use SSE for real-time updates instead of polling
3. **Clean up old jobs** - Delete completed jobs to keep database clean
4. **Optimize credentials** - Store credentials in database for faster access
5. **Use indexes** - Ensure database indexes are created (from schema.sql)

---

## Security Best Practices

1. **Protect service account credentials:**
   - Store in database with appropriate access controls
   - Use environment variables only in secure environments
   - Consider encrypting credentials at rest
   - Never commit credentials to version control

2. **Limit admin access:**
   - Only grant necessary permissions
   - Use separate admin accounts for different operations
   - Regularly audit admin activities

3. **Monitor job activities:**
   - Review job logs regularly
   - Set up alerts for failed jobs
   - Track unusual deletion patterns

4. **Secure tracking links:**
   - Use HTTPS in production (set BASE_URL)
   - Don't expose track_ids publicly
   - Consider adding authentication for sensitive links

5. **Database security:**
   - Use SSL for database connections
   - Restrict database access to API server only
   - Regular backups
   - Keep credentials rotated

---

## Production Deployment

### Environment Configuration

```bash
# Database
export PGHOST=your-db-host
export PGPORT=5432
export PGDATABASE=gadmin_toolkit
export PGUSER=api_user
export PGPASSWORD=secure_password
export PGSSL=true

# API
export PORT=3000
export NODE_ENV=production

# Tracking
export BASE_URL=https://your-domain.com
```

### Using Docker

```bash
docker-compose up -d
```

### Systemd Service

Create `/etc/systemd/system/gadmin-toolkit.service`:

```ini
[Unit]
Description=GAdmin Toolkit API
After=network.target postgresql.service

[Service]
Type=simple
User=api
WorkingDirectory=/opt/gadmin-toolkit/main/api
ExecStart=/usr/bin/node server.js
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=/etc/gadmin-toolkit/env

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable gadmin-toolkit
sudo systemctl start gadmin-toolkit
sudo systemctl status gadmin-toolkit
```

---

## API Reference

For complete API documentation, see:
- [API Documentation](../main/api/API_DOCUMENTATION.md)
- [Quick Start Guide](../main/api/QUICKSTART.md)

## Support

For issues and questions:
1. Check this guide and API documentation
2. Review server logs
3. Test endpoints with curl
4. Open an issue on GitHub
