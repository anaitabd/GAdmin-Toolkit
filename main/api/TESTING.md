# API Testing Examples

This document provides curl commands to test the GAdmin Toolkit API endpoints.

## Prerequisites

1. Start MongoDB: `mongod --dbpath /path/to/data`
2. Start the server: `cd main && npm start`
3. Setup admin user (first time only)

## Setup Admin User (First Time Only)

```bash
# Using the setup script
cd main/api
node setup-admin.js admin YourSecurePassword123!

# Or via API endpoint
curl -X POST http://localhost:3000/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "YourSecurePassword123!"
  }'
```

## Authentication

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "YourSecurePassword123!"
  }'
```

Save the token from the response for use in subsequent requests.

### Change Password
```bash
TOKEN="your-jwt-token-here"

curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "currentPassword": "YourSecurePassword123!",
    "newPassword": "NewSecurePassword456!"
  }'
```

## User Management

### Generate User List
```bash
TOKEN="your-jwt-token-here"

curl -X POST http://localhost:3000/api/users/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "domain": "yourdomain.com",
    "numRecords": 50
  }'
```

### Create Google Workspace Users
```bash
TOKEN="your-jwt-token-here"

curl -X POST http://localhost:3000/api/users/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

### Delete Google Workspace Users
```bash
TOKEN="your-jwt-token-here"

curl -X DELETE http://localhost:3000/api/users/delete \
  -H "Authorization: Bearer $TOKEN"
```

### Get Generated Users
```bash
TOKEN="your-jwt-token-here"

# Get first page (default 50 per page)
curl -X GET "http://localhost:3000/api/users?page=1&limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

## Email Operations

### Send Email via Gmail API
```bash
TOKEN="your-jwt-token-here"

curl -X POST http://localhost:3000/api/emails/send-api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "recipients": ["user1@example.com", "user2@example.com"],
    "from": "Your Name",
    "subject": "Test Email",
    "htmlContent": "<h1>Hello</h1><p>This is a test email.</p>"
  }'
```

### Send Email via SMTP
```bash
TOKEN="your-jwt-token-here"

curl -X POST http://localhost:3000/api/emails/send-smtp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "recipients": ["user1@example.com", "user2@example.com"],
    "from": "Your Name",
    "subject": "Test Email",
    "htmlContent": "<h1>Hello</h1><p>This is a test email.</p>"
  }'
```

### Get Bounced Emails
```bash
TOKEN="your-jwt-token-here"

curl -X GET http://localhost:3000/api/emails/bounced \
  -H "Authorization: Bearer $TOKEN"
```

### Get Email Logs
```bash
TOKEN="your-jwt-token-here"

curl -X GET "http://localhost:3000/api/emails/logs?page=1&limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

## Health Check

### Check Server Status
```bash
curl -X GET http://localhost:3000/health
```

### Get API Info
```bash
curl -X GET http://localhost:3000/
```

## Testing Workflow

1. **Setup**: Create admin user
   ```bash
   node setup-admin.js admin MyPassword123!
   ```

2. **Login**: Get authentication token
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"MyPassword123!"}'
   ```

3. **Use Token**: Export token for convenience
   ```bash
   export TOKEN="eyJhbGc..."
   ```

4. **Test Endpoints**: Use the token in requests
   ```bash
   curl -X GET http://localhost:3000/api/users \
     -H "Authorization: Bearer $TOKEN"
   ```

## Notes

- Replace `localhost:3000` with your server address
- Replace `$TOKEN` with your actual JWT token
- Ensure MongoDB is running before making database-dependent requests
- Ensure `cred.json` is present for Google API operations
- All authenticated endpoints return 401 without a valid token
- Tokens expire after 24 hours (configurable in .env)
