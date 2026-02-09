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

### Send Test Email

**POST /api/email-send/test-email**

Sends a test email to verify email configuration and inbox delivery. This endpoint is rate-limited to 5 requests per 10 minutes per IP.

**Request Body:**
```json
{
  "provider": "smtp",
  "test_email": "test@example.com",
  "from_name": "Test Sender",
  "subject": "Test Email Subject",
  "html_content": "<h1>Test Email</h1><p>This is a test.</p>"
}
```

**Required fields:**
- `provider` (string) - Either "gmail_api" or "smtp"
- `test_email` (string) - Valid email address to receive the test

**Optional fields (uses active email_info/template if not provided):**
- `from_name` (string) - Sender display name
- `subject` (string) - Email subject line
- `html_content` (string) - HTML content of the email

**Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully to test@example.com via smtp",
  "details": {
    "testId": 1707512345678,
    "provider": "smtp",
    "from": "Test Sender <sender@gmail.com>",
    "to": "test@example.com",
    "subject": "Test Email Subject",
    "sentAt": "2024-02-09T21:45:45.678Z"
  },
  "inboxVerification": {
    "note": "Please check your inbox/spam folder for the test email.",
    "tips": [
      "Check spam/junk folder if not in inbox",
      "Mark as 'Not Spam' to improve future deliverability",
      "Add sender to contacts for better inbox placement",
      "Check email headers for authentication results (SPF, DKIM, DMARC)"
    ],
    "testId": 1707512345678
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

**Use Case:**
Test email configuration and verify inbox placement before sending bulk campaigns. The test email includes a unique test ID for tracking and verification purposes.

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

## Tracking Links API

Complete API for creating and managing standalone tracking links. See [Tracking Links Guide](../../docs/TRACKING_LINKS.md) for full documentation.

### Overview

The Tracking Links API allows you to create tracking URLs that:
- Redirect to any destination URL
- Track click events
- Generate HTML snippets for easy insertion
- Support organization with names, descriptions, and tags

### Quick Start Example

**1. Create a tracking link:**
```bash
curl -X POST http://localhost:3000/api/tracking-links \
  -H "Content-Type: application/json" \
  -d '{
    "original_url": "https://example.com/offer",
    "name": "Summer Sale",
    "tags": ["sale", "2024"]
  }'
```

**2. Get HTML snippet:**
```bash
curl "http://localhost:3000/api/tracking-links/1/html?linkText=Shop%20Now"
```

**3. Use in your website:**
```html
<a href="http://localhost:3000/t/c/550e8400-e29b-41d4-a716-446655440000" target="_blank">Shop Now</a>
```

### Endpoints

**GET /api/tracking-links** - Get all tracking links
- Query params: `search`, `tag`, `limit`, `offset`, `includeJobLinks`

**GET /api/tracking-links/:id** - Get specific tracking link

**POST /api/tracking-links** - Create new tracking link
- Body: `{ original_url, name?, description?, tags? }`

**POST /api/tracking-links/batch** - Create multiple tracking links
- Body: `{ links: [{ original_url, name?, description?, tags? }] }`

**PUT /api/tracking-links/:id** - Update tracking link
- Body: `{ name?, description?, tags?, original_url? }`

**DELETE /api/tracking-links/:id** - Delete tracking link

**GET /api/tracking-links/:id/html** - Get HTML snippet
- Query params: `linkText`, `target`, `style`

**GET /api/tracking-links/:id/stats** - Get click statistics

**GET /t/c/:trackId** - Click tracking redirect endpoint

### Testing

Run the tracking links test suite:
```bash
cd main/api
./test-tracking-links.sh
```

### See Also

- [Tracking Links Guide](../../docs/TRACKING_LINKS.md) - Complete documentation with examples
- [Database Migration](db/migrations/make_tracking_links_standalone.sql) - Schema updates for existing databases

