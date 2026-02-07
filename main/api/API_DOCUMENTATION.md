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

## Notes

- All timestamps are in ISO 8601 format with timezone (UTC)
- Email addresses must be unique in the users table
- The `active` flag in email_info and email_templates indicates which record is currently in use
- Email logs and bounce logs are read-only and created automatically by the email sending process
- All responses include a `success` field indicating whether the operation succeeded
