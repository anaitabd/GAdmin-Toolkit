# GAdmin-Toolkit API Documentation

## Overview

The GAdmin-Toolkit API provides comprehensive REST endpoints for managing all database entities in the Google Workspace Automation Toolkit. This API allows you to create, read, update, and delete (CRUD) operations on users, email data, templates, and more.

## Getting Started

### Prerequisites

1. Node.js installed
2. PostgreSQL database configured with the schema from `main/api/db/schema.sql`
3. Required environment variables set:
   - `PGHOST` - PostgreSQL host
   - `PGPORT` - PostgreSQL port (default: 5432)
   - `PGDATABASE` - Database name
   - `PGUSER` - Database user
   - `PGPASSWORD` - Database password
   - `PGSSL` - SSL mode (true/false)
   - `PORT` - API server port (default: 3000)

### Starting the API Server

```bash
cd main/api
node server.js
```

The API will be available at `http://localhost:3000` by default.

## API Endpoints

### Health Check

**GET /health**

Returns the health status of the API.

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-07T18:00:00.000Z"
}
```

### Root Endpoint

**GET /**

Returns API information and available endpoints.

Response:
```json
{
  "message": "GAdmin-Toolkit API",
  "version": "1.0.0",
  "endpoints": {
    "users": "/api/users",
    "emailData": "/api/email-data",
    "emailInfo": "/api/email-info",
    "emailTemplates": "/api/email-templates",
    "names": "/api/names",
    "credentials": "/api/credentials",
    "emailLogs": "/api/email-logs (read-only)",
    "bounceLogs": "/api/bounce-logs (read-only)",
    "health": "/health"
  }
}
```

---

## Users API

Manage Google Workspace users.

### Get All Users

**GET /api/users**

Returns all users in the database.

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "password": "Password123",
      "given_name": "John",
      "family_name": "Doe",
      "created_at": "2026-02-07T18:00:00.000Z"
    }
  ],
  "count": 1
}
```

### Get User by ID

**GET /api/users/:id**

Returns a specific user by ID.

### Create User

**POST /api/users**

Creates a new user.

Request Body:
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "given_name": "John",
  "family_name": "Doe"
}
```

Required fields:
- `email` (string, unique)

Optional fields:
- `password` (string)
- `given_name` (string)
- `family_name` (string)

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "password": "Password123",
    "given_name": "John",
    "family_name": "Doe",
    "created_at": "2026-02-07T18:00:00.000Z"
  }
}
```

### Update User

**PUT /api/users/:id**

Updates an existing user. Only provided fields will be updated.

Request Body:
```json
{
  "email": "newemail@example.com",
  "given_name": "Jane"
}
```

### Delete User

**DELETE /api/users/:id**

Deletes a user by ID.

Response:
```json
{
  "success": true,
  "message": "User deleted",
  "data": {
    "id": 1,
    "email": "user@example.com",
    ...
  }
}
```

---

## Email Data API

Manage recipient email addresses.

### Get All Email Data

**GET /api/email-data**

Returns all email data records.

### Get Email Data by ID

**GET /api/email-data/:id**

Returns a specific email data record by ID.

### Create Email Data

**POST /api/email-data**

Creates a new email data record.

Request Body:
```json
{
  "to_email": "recipient@example.com"
}
```

Required fields:
- `to_email` (string)

### Update Email Data

**PUT /api/email-data/:id**

Updates an existing email data record.

### Delete Email Data

**DELETE /api/email-data/:id**

Deletes an email data record by ID.

---

## Email Info API

Manage email sender information and subjects.

### Get All Email Info

**GET /api/email-info**

Returns all email info records, ordered by creation date (newest first).

### Get Active Email Info

**GET /api/email-info/active**

Returns the currently active email info (most recent active record).

### Get Email Info by ID

**GET /api/email-info/:id**

Returns a specific email info record by ID.

### Create Email Info

**POST /api/email-info**

Creates a new email info record.

Request Body:
```json
{
  "from_name": "Admin Team",
  "subject": "Important Update",
  "active": true
}
```

Required fields:
- `from_name` (string)
- `subject` (string)

Optional fields:
- `active` (boolean, default: true)

### Update Email Info

**PUT /api/email-info/:id**

Updates an existing email info record.

### Delete Email Info

**DELETE /api/email-info/:id**

Deletes an email info record by ID.

---

## Email Templates API

Manage email HTML templates.

### Get All Email Templates

**GET /api/email-templates**

Returns all email templates, ordered by creation date (newest first).

### Get Active Email Template

**GET /api/email-templates/active**

Returns the currently active email template (most recent active record).

### Get Email Template by ID

**GET /api/email-templates/:id**

Returns a specific email template by ID.

### Create Email Template

**POST /api/email-templates**

Creates a new email template.

Request Body:
```json
{
  "name": "Welcome Email",
  "html_content": "<html><body><h1>Welcome!</h1></body></html>",
  "active": true
}
```

Required fields:
- `name` (string)
- `html_content` (string)

Optional fields:
- `active` (boolean, default: true)

### Update Email Template

**PUT /api/email-templates/:id**

Updates an existing email template.

### Delete Email Template

**DELETE /api/email-templates/:id**

Deletes an email template by ID.

---

## Names API

Manage first and last names for user generation.

### Get All Names

**GET /api/names**

Returns all name records.

### Get Name by ID

**GET /api/names/:id**

Returns a specific name record by ID.

### Create Name

**POST /api/names**

Creates a new name record.

Request Body:
```json
{
  "given_name": "John",
  "family_name": "Doe"
}
```

Required fields:
- `given_name` (string)
- `family_name` (string)

### Update Name

**PUT /api/names/:id**

Updates an existing name record.

### Delete Name

**DELETE /api/names/:id**

Deletes a name record by ID.

---

## Credentials API

Manage Google API credentials stored in the database.

### Get All Credentials

**GET /api/credentials**

Returns all credentials in the database.

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "google-workspace-creds",
      "cred_json": {
        "type": "service_account",
        "project_id": "example-project",
        "client_email": "service@example.iam.gserviceaccount.com",
        "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
      },
      "active": true,
      "created_at": "2026-02-07T18:00:00.000Z",
      "updated_at": "2026-02-07T18:00:00.000Z"
    }
  ],
  "count": 1
}
```

### Get Active Credential

**GET /api/credentials/active**

Returns the currently active credential (most recent active record).

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "google-workspace-creds",
    "cred_json": { ... },
    "active": true,
    "created_at": "2026-02-07T18:00:00.000Z",
    "updated_at": "2026-02-07T18:00:00.000Z"
  }
}
```

### Get Credential by ID

**GET /api/credentials/:id**

Returns a specific credential by ID.

### Create Credential

**POST /api/credentials**

Creates a new credential record.

Request Body:
```json
{
  "name": "google-workspace-creds",
  "cred_json": {
    "type": "service_account",
    "project_id": "example-project",
    "client_email": "service@example.iam.gserviceaccount.com",
    "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
  },
  "active": true
}
```

Required fields:
- `name` (string, unique) - A unique identifier for this credential
- `cred_json` (object or string) - The credential JSON object

Optional fields:
- `active` (boolean, default: true) - Whether this credential is active

**Note:** The `cred_json` field can be provided as either a JSON object or a JSON string. It will be validated and stored as JSONB in the database.

### Update Credential

**PUT /api/credentials/:id**

Updates an existing credential. Only provided fields will be updated.

Request Body:
```json
{
  "active": false
}
```

### Delete Credential

**DELETE /api/credentials/:id**

Deletes a credential by ID.

Response:
```json
{
  "success": true,
  "message": "Credential deleted",
  "data": {
    "id": 1,
    "name": "google-workspace-creds",
    ...
  }
}
```

---

## Email Logs API (Read-Only)

View email sending logs and statistics.

### Get Email Logs

**GET /api/email-logs**

Returns email logs with optional filtering and pagination.

Query Parameters:
- `user_email` (string) - Filter by sender email
- `status` (string) - Filter by status: 'sent' or 'failed'
- `provider` (string) - Filter by provider: 'gmail_api' or 'smtp'
- `limit` (number) - Results per page (default: 100)
- `offset` (number) - Offset for pagination (default: 0)

Example:
```
GET /api/email-logs?status=failed&limit=50
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_email": "sender@example.com",
      "to_email": "recipient@example.com",
      "message_index": 0,
      "status": "sent",
      "provider": "gmail_api",
      "error_message": null,
      "sent_at": "2026-02-07T18:00:00.000Z"
    }
  ],
  "count": 1,
  "limit": 100,
  "offset": 0
}
```

### Get Email Log by ID

**GET /api/email-logs/:id**

Returns a specific email log by ID.

### Get Email Statistics

**GET /api/email-logs/stats/summary**

Returns summary statistics for email logs.

Response:
```json
{
  "success": true,
  "data": {
    "total_emails": 1000,
    "successful_emails": 950,
    "failed_emails": 50,
    "gmail_api_emails": 800,
    "smtp_emails": 200
  }
}
```

---

## Bounce Logs API (Read-Only)

View email bounce logs and statistics.

### Get Bounce Logs

**GET /api/bounce-logs**

Returns bounce logs with optional filtering and pagination.

Query Parameters:
- `email` (string) - Filter by email address
- `limit` (number) - Results per page (default: 100)
- `offset` (number) - Offset for pagination (default: 0)

### Get Bounce Log by ID

**GET /api/bounce-logs/:id**

Returns a specific bounce log by ID.

### Get Bounce Statistics

**GET /api/bounce-logs/stats/summary**

Returns summary statistics for bounce logs.

Response:
```json
{
  "success": true,
  "data": {
    "total_bounces": 25,
    "unique_bounced_emails": 20
  }
}
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `201` - Created (for POST requests)
- `400` - Bad Request (validation error)
- `404` - Not Found
- `409` - Conflict (e.g., duplicate email)
- `500` - Internal Server Error

Error Response Format:
```json
{
  "success": false,
  "error": "Error message description"
}
```

---

## Testing the API

Use the provided test script to verify all endpoints:

```bash
cd main/api
./test-api.sh
```

Or test individual endpoints using curl:

```bash
# Get all users
curl http://localhost:3000/api/users

# Create a new user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","given_name":"Test","family_name":"User"}'

# Update a user
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"given_name":"Updated"}'

# Delete a user
curl -X DELETE http://localhost:3000/api/users/1

# Get all credentials
curl http://localhost:3000/api/credentials

# Create a new credential
curl -X POST http://localhost:3000/api/credentials \
  -H "Content-Type: application/json" \
  -d '{"name":"my-creds","cred_json":{"type":"service_account","project_id":"test"},"active":true}'

# Get active credential
curl http://localhost:3000/api/credentials/active

# Update a credential
curl -X PUT http://localhost:3000/api/credentials/1 \
  -H "Content-Type: application/json" \
  -d '{"active":false}'

# Delete a credential
curl -X DELETE http://localhost:3000/api/credentials/1
```

---

## Integration Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const API_BASE = 'http://localhost:3000';

// Get all users
async function getUsers() {
  const response = await axios.get(`${API_BASE}/api/users`);
  return response.data;
}

// Create a user
async function createUser(userData) {
  const response = await axios.post(`${API_BASE}/api/users`, userData);
  return response.data;
}

// Update a user
async function updateUser(id, userData) {
  const response = await axios.put(`${API_BASE}/api/users/${id}`, userData);
  return response.data;
}

// Delete a user
async function deleteUser(id) {
  const response = await axios.delete(`${API_BASE}/api/users/${id}`);
  return response.data;
}

// Get all credentials
async function getCredentials() {
  const response = await axios.get(`${API_BASE}/api/credentials`);
  return response.data;
}

// Create a credential
async function createCredential(credData) {
  const response = await axios.post(`${API_BASE}/api/credentials`, credData);
  return response.data;
}

// Update a credential
async function updateCredential(id, credData) {
  const response = await axios.put(`${API_BASE}/api/credentials/${id}`, credData);
  return response.data;
}

// Delete a credential
async function deleteCredential(id) {
  const response = await axios.delete(`${API_BASE}/api/credentials/${id}`);
  return response.data;
}
```

### Python

```python
import requests

API_BASE = 'http://localhost:3000'

# Get all users
def get_users():
    response = requests.get(f'{API_BASE}/api/users')
    return response.json()

# Create a user
def create_user(user_data):
    response = requests.post(f'{API_BASE}/api/users', json=user_data)
    return response.json()

# Update a user
def update_user(user_id, user_data):
    response = requests.put(f'{API_BASE}/api/users/{user_id}', json=user_data)
    return response.json()

# Delete a user
def delete_user(user_id):
    response = requests.delete(f'{API_BASE}/api/users/{user_id}')
    return response.json()

# Get all credentials
def get_credentials():
    response = requests.get(f'{API_BASE}/api/credentials')
    return response.json()

# Create a credential
def create_credential(cred_data):
    response = requests.post(f'{API_BASE}/api/credentials', json=cred_data)
    return response.json()

# Update a credential
def update_credential(cred_id, cred_data):
    response = requests.put(f'{API_BASE}/api/credentials/{cred_id}', json=cred_data)
    return response.json()

# Delete a credential
def delete_credential(cred_id):
    response = requests.delete(f'{API_BASE}/api/credentials/{cred_id}')
    return response.json()
```

---

## Email Sending API

Send emails in bulk using Gmail API or SMTP, generate users, and manage email operations.

### Send Emails via Gmail API

**POST /api/email-send/gmail-api**

Starts sending emails in bulk using the Gmail API. This operation runs in the background and returns immediately.

**Prerequisites:**
- Active users in the database
- Email recipients in email_data table
- Active email_info record
- Active email_templates record

Response:
```json
{
  "success": true,
  "message": "Email sending started via Gmail API",
  "details": {
    "totalUsers": 100,
    "totalRecipients": 5000,
    "fromName": "Admin Team",
    "subject": "Important Update",
    "templateName": "Newsletter Template"
  },
  "note": "Email sending is running in the background. Check email_logs table for status."
}
```

### Send Emails via SMTP

**POST /api/email-send/smtp**

Starts sending emails in bulk using SMTP. This operation runs in the background and returns immediately.

**Prerequisites:**
- Active users in the database
- Email recipients in email_data table
- Active email_info record
- Active email_templates record

Response:
```json
{
  "success": true,
  "message": "Email sending started via SMTP",
  "details": {
    "totalUsers": 50,
    "totalRecipients": 1000,
    "fromName": "Support Team",
    "subject": "Newsletter",
    "templateName": "Welcome Email"
  },
  "note": "Email sending is running in the background. Check email_logs table for status."
}
```

### Generate Users

**POST /api/email-send/generate-users**

Generates random users and inserts them into the database. This operation runs in the background.

Request Body:
```json
{
  "domain": "example.com",
  "numRecords": 100
}
```

Required fields:
- `domain` (string) - Domain for generated email addresses
- `numRecords` (number) - Number of users to generate (positive integer)

Response:
```json
{
  "success": true,
  "message": "User generation started",
  "details": {
    "domain": "example.com",
    "numRecords": 100
  },
  "note": "User generation is running in the background. Check users table for results."
}
```

### Bulk Add Email Recipients

**POST /api/email-send/bulk-recipients**

Adds multiple email recipients to the email_data table in bulk.

Request Body:
```json
{
  "emails": [
    "user1@example.com",
    "user2@example.com",
    "user3@example.com"
  ]
}
```

Required fields:
- `emails` (array of strings) - Array of email addresses to add

Response:
```json
{
  "success": true,
  "message": "Bulk email recipients added",
  "inserted": 3,
  "duplicatesSkipped": 0,
  "data": [
    {
      "id": 1,
      "to_email": "user1@example.com"
    },
    {
      "id": 2,
      "to_email": "user2@example.com"
    },
    {
      "id": 3,
      "to_email": "user3@example.com"
    }
  ]
}
```

### Get Email Sending Status

**GET /api/email-send/status**

Returns statistics about email sending operations and recent logs.

Response:
```json
{
  "success": true,
  "statistics": {
    "totalEmails": 5000,
    "sentCount": 4850,
    "failedCount": 150,
    "lastSentAt": "2026-02-07T18:00:00.000Z"
  },
  "recentLogs": [
    {
      "id": 5000,
      "user_email": "sender@example.com",
      "to_email": "recipient@example.com",
      "status": "sent",
      "provider": "gmail_api",
      "sent_at": "2026-02-07T18:00:00.000Z",
      "error_message": null
    }
  ]
}
```

---

## Notes

- All timestamps are in ISO 8601 format with timezone (UTC)
- Email addresses must be unique in the users table
- The `active` flag in email_info and email_templates indicates which record is currently in use
- Email logs and bounce logs are read-only and created automatically by the email sending process
- All responses include a `success` field indicating whether the operation succeeded
- Email sending operations run in the background to avoid blocking the API
- Use the `/api/email-send/status` endpoint to monitor email sending progress

---

## Google Workspace Management API

Manage Google Workspace users through the Admin SDK with job-based operations.

### Create Google Users

**POST /api/jobs/create-google-users**

Creates all users from the database in Google Workspace. This operation runs as a background job.

**Prerequisites:**
- Users in the database (users table)
- Active Google service account credentials (via `/api/credentials` or `GOOGLE_CRED_JSON_B64` env var)
- Admin email with domain-wide delegation enabled

Request Body:
```json
{
  "admin_email": "admin@example.com"
}
```

Optional fields:
- `admin_email` (string) - Admin email address with domain-wide delegation. If not provided, uses the value from settings table (key: 'admin_email')

Response:
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
      "admin_email": "admin@example.com",
      "totalUsers": 100
    },
    "created_at": "2026-02-08T18:00:00.000Z",
    "started_at": null,
    "completed_at": null
  }
}
```

**Job Lifecycle:**
1. Job is created with status `pending`
2. Job transitions to `running` when processing starts
3. Progress is updated in real-time (0-100%)
4. Job completes with status `completed` or `failed`

**Monitor Job Progress:**
- Use `GET /api/jobs/:id` to check job status
- Use `GET /api/jobs/:id/stream` for real-time Server-Sent Events (SSE)

### Delete Google Users

**POST /api/jobs/delete-google-users**

Deletes all non-admin users from Google Workspace. This operation runs as a background job.

**WARNING:** This will delete ALL users except the specified admin email. Use with caution!

**Prerequisites:**
- Active Google service account credentials
- Admin email with domain-wide delegation enabled

Request Body:
```json
{
  "admin_email": "admin@example.com"
}
```

Required fields:
- `admin_email` (string) - Admin email address to preserve (all other users will be deleted)

Response:
```json
{
  "success": true,
  "data": {
    "id": 2,
    "type": "delete_google_users",
    "status": "pending",
    "progress": 0,
    "total_items": 0,
    "processed_items": 0,
    "params": {
      "admin_email": "admin@example.com"
    },
    "created_at": "2026-02-08T18:00:00.000Z"
  }
}
```

### Detect Bounced Emails

**POST /api/jobs/detect-bounces**

Scans all user inboxes for bounced emails from "Mail Delivery Subsystem" and logs them to the bounce_logs table.

**Prerequisites:**
- Users in the database (users table)
- Active Google service account credentials with Gmail API access
- Users must have Gmail enabled

Request Body: None required

Response:
```json
{
  "success": true,
  "data": {
    "id": 3,
    "type": "detect_bounces",
    "status": "pending",
    "progress": 0,
    "total_items": 0,
    "processed_items": 0,
    "params": {
      "totalUsers": 100
    },
    "created_at": "2026-02-08T18:00:00.000Z"
  }
}
```

**What it does:**
- Checks each user's inbox for bounced email notifications
- Extracts the bounced email addresses from the message snippets
- Stores bounced emails in the `bounce_logs` table
- Results can be viewed via `GET /api/bounce-logs`

### Jobs Management

#### Get All Jobs

**GET /api/jobs**

Returns a list of all jobs (recent 50 by default).

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "create_google_users",
      "status": "completed",
      "progress": 100,
      "total_items": 100,
      "processed_items": 100,
      "error_message": null,
      "params": { "admin_email": "admin@example.com" },
      "created_at": "2026-02-08T18:00:00.000Z",
      "started_at": "2026-02-08T18:00:05.000Z",
      "completed_at": "2026-02-08T18:05:00.000Z"
    }
  ],
  "count": 1
}
```

#### Get Job by ID

**GET /api/jobs/:id**

Returns details of a specific job.

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "type": "create_google_users",
    "status": "running",
    "progress": 45,
    "total_items": 100,
    "processed_items": 45,
    "error_message": null,
    "params": { "admin_email": "admin@example.com" },
    "created_at": "2026-02-08T18:00:00.000Z",
    "started_at": "2026-02-08T18:00:05.000Z",
    "completed_at": null
  }
}
```

#### Stream Job Progress (SSE)

**GET /api/jobs/:id/stream**

Opens a Server-Sent Events (SSE) stream for real-time job updates.

```javascript
const eventSource = new EventSource('http://localhost:3000/api/jobs/1/stream');
eventSource.onmessage = (event) => {
  const job = JSON.parse(event.data);
  console.log(`Progress: ${job.progress}%, Status: ${job.status}`);
  if (['completed', 'failed', 'cancelled'].includes(job.status)) {
    eventSource.close();
  }
};
```

#### Cancel a Job

**POST /api/jobs/:id/cancel**

Cancels a running or paused job.

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "cancelled",
    "completed_at": "2026-02-08T18:10:00.000Z"
  }
}
```

#### Pause a Job

**POST /api/jobs/:id/pause**

Pauses a running job (only works for jobs that support pausing).

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "paused"
  }
}
```

#### Resume a Job

**POST /api/jobs/:id/resume**

Resumes a paused job.

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "running"
  }
}
```

#### Delete a Job

**DELETE /api/jobs/:id**

Deletes a completed, failed, or cancelled job. Active jobs cannot be deleted.

Response:
```json
{
  "success": true,
  "message": "Job deleted"
}
```

---

## Tracking Links API

Generate and manage tracking links that redirect to offer/target URLs with click tracking.

### Generate a Tracking Link

**POST /api/tracking-links**

Creates a single tracking link that redirects to the specified URL.

Request Body:
```json
{
  "original_url": "https://example.com/offer",
  "to_email": "recipient@example.com",
  "job_id": 1
}
```

Required fields:
- `original_url` (string) - The target URL to redirect to (must be a valid URL)

Optional fields:
- `to_email` (string) - Email address of the intended recipient
- `job_id` (number) - Associate with a specific job for analytics

Response:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "track_id": "550e8400-e29b-41d4-a716-446655440000",
    "original_url": "https://example.com/offer",
    "tracking_url": "http://localhost:3000/t/c/550e8400-e29b-41d4-a716-446655440000",
    "to_email": "recipient@example.com",
    "clicked": false,
    "created_at": "2026-02-08T18:00:00.000Z"
  }
}
```

**Usage:**
Share the `tracking_url` instead of the original URL. When clicked, it will:
1. Record the click in the database
2. Redirect the user to the `original_url`

### Generate Multiple Tracking Links

**POST /api/tracking-links/bulk**

Creates multiple tracking links in a single request.

Request Body:
```json
{
  "links": [
    {
      "original_url": "https://example.com/offer1",
      "to_email": "user1@example.com"
    },
    {
      "original_url": "https://example.com/offer2",
      "to_email": "user2@example.com"
    },
    "https://example.com/offer3"
  ],
  "job_id": 1
}
```

Required fields:
- `links` (array) - Array of URLs (strings) or objects with `original_url` and optional `to_email`

Optional fields:
- `job_id` (number) - Associate all links with a specific job

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 124,
      "track_id": "550e8400-e29b-41d4-a716-446655440001",
      "original_url": "https://example.com/offer1",
      "tracking_url": "http://localhost:3000/t/c/550e8400-e29b-41d4-a716-446655440001",
      "to_email": "user1@example.com",
      "clicked": false,
      "created_at": "2026-02-08T18:00:00.000Z"
    },
    {
      "id": 125,
      "track_id": "550e8400-e29b-41d4-a716-446655440002",
      "original_url": "https://example.com/offer2",
      "tracking_url": "http://localhost:3000/t/c/550e8400-e29b-41d4-a716-446655440002",
      "to_email": "user2@example.com",
      "clicked": false,
      "created_at": "2026-02-08T18:00:00.000Z"
    }
  ],
  "count": 2
}
```

### Get Tracking Link Details

**GET /api/tracking-links/:trackId**

Returns details about a specific tracking link.

Response:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "track_id": "550e8400-e29b-41d4-a716-446655440000",
    "original_url": "https://example.com/offer",
    "tracking_url": "http://localhost:3000/t/c/550e8400-e29b-41d4-a716-446655440000",
    "to_email": "recipient@example.com",
    "job_id": 1,
    "clicked": true,
    "clicked_at": "2026-02-08T18:05:00.000Z",
    "created_at": "2026-02-08T18:00:00.000Z"
  }
}
```

### List Tracking Links

**GET /api/tracking-links**

Returns a list of tracking links with optional filtering.

Query Parameters:
- `job_id` (number) - Filter by job ID
- `to_email` (string) - Filter by recipient email
- `clicked` (boolean) - Filter by click status (true/false)
- `limit` (number) - Maximum results to return (default: 100, max: 1000)
- `offset` (number) - Pagination offset (default: 0)

Example:
```
GET /api/tracking-links?job_id=1&clicked=true&limit=50
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "track_id": "550e8400-e29b-41d4-a716-446655440000",
      "original_url": "https://example.com/offer",
      "tracking_url": "http://localhost:3000/t/c/550e8400-e29b-41d4-a716-446655440000",
      "to_email": "recipient@example.com",
      "job_id": 1,
      "clicked": true,
      "clicked_at": "2026-02-08T18:05:00.000Z",
      "created_at": "2026-02-08T18:00:00.000Z"
    }
  ],
  "count": 1
}
```

### Delete a Tracking Link

**DELETE /api/tracking-links/:trackId**

Deletes a tracking link (it will no longer redirect).

Response:
```json
{
  "success": true,
  "message": "Tracking link deleted",
  "data": {
    "id": 123,
    "track_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Click Tracking Redirect

**GET /t/c/:trackId**

This is the actual redirect endpoint. When users click a tracking URL, they hit this endpoint.

**What happens:**
1. The click is recorded (sets `clicked = true` and `clicked_at = NOW()`)
2. User is redirected (302) to the `original_url`
3. If tracking link doesn't exist, returns 404

**Note:** This endpoint is not meant to be called via API - it's the URL users click.

---

## Complete Workflow Examples

### Workflow 1: Create Google Workspace Users

1. **Add credentials** (if not using environment variable):
```bash
curl -X POST http://localhost:3000/api/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Service Account",
    "domain": "example.com",
    "cred_json": { ... service account JSON ... },
    "active": true
  }'
```

2. **Add users to database**:
```bash
curl -X POST http://localhost:3000/api/jobs/bulk-users \
  -H "Content-Type: application/json" \
  -d '{
    "users": [
      {
        "email": "user1@example.com",
        "password": "TempPass123",
        "given_name": "John",
        "family_name": "Doe"
      },
      {
        "email": "user2@example.com",
        "password": "TempPass456",
        "given_name": "Jane",
        "family_name": "Smith"
      }
    ]
  }'
```

3. **Create users in Google Workspace**:
```bash
curl -X POST http://localhost:3000/api/jobs/create-google-users \
  -H "Content-Type: application/json" \
  -d '{
    "admin_email": "admin@example.com"
  }'
```

4. **Monitor progress**:
```bash
# Get job status
curl http://localhost:3000/api/jobs/1

# Or use SSE for real-time updates
curl -N http://localhost:3000/api/jobs/1/stream
```

### Workflow 2: Detect Bounced Emails

1. **Start bounce detection**:
```bash
curl -X POST http://localhost:3000/api/jobs/detect-bounces
```

2. **Monitor progress**:
```bash
curl http://localhost:3000/api/jobs/2
```

3. **View bounced emails**:
```bash
curl http://localhost:3000/api/bounce-logs
```

### Workflow 3: Generate Tracking Links for Campaign

1. **Create tracking links for your offers**:
```bash
curl -X POST http://localhost:3000/api/tracking-links/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "links": [
      {
        "original_url": "https://example.com/product1",
        "to_email": "customer1@example.com"
      },
      {
        "original_url": "https://example.com/product2",
        "to_email": "customer2@example.com"
      }
    ]
  }'
```

2. **Use the tracking URLs in your emails**:
```
Instead of: https://example.com/product1
Use: http://localhost:3000/t/c/550e8400-e29b-41d4-a716-446655440000
```

3. **Monitor clicks**:
```bash
# Get all clicked links
curl 'http://localhost:3000/api/tracking-links?clicked=true'

# Get clicks for specific email
curl 'http://localhost:3000/api/tracking-links?to_email=customer1@example.com'
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource (e.g., email already exists)
- `500 Internal Server Error` - Server error

---

## Environment Variables

### Required
- `PGHOST` - PostgreSQL host
- `PGPORT` - PostgreSQL port
- `PGDATABASE` - Database name
- `PGUSER` - Database user
- `PGPASSWORD` - Database password

### Optional
- `PORT` - API server port (default: 3000)
- `PGSSL` - Enable SSL for PostgreSQL (true/false)
- `GOOGLE_CRED_JSON_B64` - Base64-encoded Google service account JSON (fallback if no DB credentials)
- `KMS_KEY_ID` - Google Cloud KMS key ID for decrypting credentials
- `BASE_URL` - Base URL for tracking links (default: http://localhost:3000)

---

## Best Practices

### Credentials Management
1. **Use the database for credentials** - Store credentials via `/api/credentials` API instead of environment variables for better management
2. **Keep one credential active** - Only one credential should have `active = true` at a time
3. **Domain-wide delegation** - Ensure your service account has domain-wide delegation enabled in Google Workspace

### Job Management
1. **Monitor long-running jobs** - Use SSE (`/api/jobs/:id/stream`) for real-time progress
2. **Handle failures gracefully** - Check `error_message` field when job status is `failed`
3. **Clean up old jobs** - Delete completed jobs periodically to keep the database clean

### Tracking Links
1. **Use meaningful job_id** - Associate tracking links with jobs for better analytics
2. **Include to_email** - Helps track which recipient clicked which link
3. **Set BASE_URL** - Configure `BASE_URL` environment variable for production deployments
4. **Monitor CTR** - Use `/api/jobs/:id/stats` to calculate click-through rates for campaigns

### Rate Limiting
- Google Workspace API has rate limits - the system includes automatic delays (250ms between operations)
- For large operations (1000+ users), expect jobs to take several minutes
- Monitor job progress via SSE to track completion

---

## Testing

Test all API endpoints using the provided test script:

```bash
cd main/api
bash test-api.sh
```

Or test individual endpoints with curl:

```bash
# Health check
curl http://localhost:3000/health

# Get all users
curl http://localhost:3000/api/users

# Create a tracking link
curl -X POST http://localhost:3000/api/tracking-links \
  -H "Content-Type: application/json" \
  -d '{
    "original_url": "https://example.com"
  }'
```
