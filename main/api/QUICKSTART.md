# Quick Start Guide - GAdmin-Toolkit API

This guide will help you get started with the GAdmin-Toolkit REST API.

## Prerequisites

1. **Node.js** - Version 14 or higher
2. **PostgreSQL** - Running instance with the schema set up
3. **Environment Variables** - Database connection details

## Step 1: Install Dependencies

```bash
cd main
npm install
```

## Step 2: Set Up Database

### Configure Environment Variables

Create a `.env` file or export these variables:

```bash
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE=gadmin_toolkit
export PGUSER=your_username
export PGPASSWORD=your_password
export PGSSL=false  # or true for SSL connections
export PORT=3000    # Optional: API server port (default: 3000)
```

### Create Database Schema

```bash
psql "$PGDATABASE" -f api/db/schema.sql
```

### Import Initial Data (Optional)

```bash
node api/db/import.js
```

## Step 3: Start the API Server

### Option A: Using npm script (recommended)

```bash
npm start
```

### Option B: Using the start script

```bash
cd api
./start-server.sh
```

### Option C: Direct node command

```bash
cd api
node server.js
```

### For Development (with auto-reload)

```bash
npm run dev
```

## Step 4: Verify the API is Running

Open your browser or use curl:

```bash
curl http://localhost:3000/
```

You should see:

```json
{
  "message": "GAdmin-Toolkit API",
  "version": "1.0.0",
  "endpoints": {
    "users": "/api/users",
    "emailData": "/api/email-data",
    ...
  }
}
```

## Step 5: Test the API

Run the comprehensive test script:

```bash
npm run test-api
```

Or manually test specific endpoints:

```bash
# Get all users
curl http://localhost:3000/api/users

# Create a new user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","given_name":"John","family_name":"Doe","password":"Test123"}'

# Get user by ID
curl http://localhost:3000/api/users/1

# Update a user
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"given_name":"Jane"}'

# Delete a user
curl -X DELETE http://localhost:3000/api/users/1
```

## Common Use Cases

### 1. Managing Users

```bash
# List all users
curl http://localhost:3000/api/users

# Add a new user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123",
    "given_name": "New",
    "family_name": "User"
  }'
```

### 2. Managing Email Templates

```bash
# Get active template
curl http://localhost:3000/api/email-templates/active

# Create a new template
curl -X POST http://localhost:3000/api/email-templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Welcome Email",
    "html_content": "<h1>Welcome to our service!</h1>",
    "active": true
  }'
```

### 3. Viewing Email Logs

```bash
# Get recent email logs
curl http://localhost:3000/api/email-logs?limit=10

# Get failed emails only
curl http://localhost:3000/api/email-logs?status=failed

# Get email statistics
curl http://localhost:3000/api/email-logs/stats/summary
```

### 4. Managing Email Recipients

```bash
# Add email recipients
curl -X POST http://localhost:3000/api/email-data \
  -H "Content-Type: application/json" \
  -d '{"to_email": "recipient@example.com"}'

# List all recipients
curl http://localhost:3000/api/email-data
```

## Full Documentation

For complete API documentation, see:
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Comprehensive API reference
- [README.md](../../README.md) - Project overview

## Troubleshooting

### Database Connection Issues

If you see "ECONNREFUSED" errors:
1. Verify PostgreSQL is running
2. Check your environment variables are set correctly
3. Verify database exists and schema is loaded
4. Check firewall/network settings

### Port Already in Use

If port 3000 is already in use:
```bash
PORT=8080 npm start
```

### Module Not Found

If you see "Cannot find module" errors:
```bash
cd main
npm install
```

## Next Steps

1. Read the [API Documentation](API_DOCUMENTATION.md) for detailed endpoint information
2. Explore the existing scripts in `main/api/` for Google Workspace automation
3. Customize the API for your specific needs
4. Set up proper authentication/authorization for production use

## Support

For issues or questions:
- Check the [README.md](../../README.md) for general project information
- Review the [API Documentation](API_DOCUMENTATION.md) for endpoint details
- Submit an issue on GitHub for bugs or feature requests
