# Database-Based Credential Management

This document describes the new database-based credential and configuration management system.

## Overview

The system has been migrated from static configuration files (`.env` and `cred.json`) to a SQLite database for better management of:
- Multiple Google Service Account credentials
- Configuration settings
- Multiple G Suite accounts with geographical data

## Features

### 1. Database Storage
- **SQLite** database for lightweight, serverless storage
- **Automatic schema initialization** on first run
- **Migration script** to import existing `.env` and `cred.json` files

### 2. Multiple Credentials Support
- Store multiple Google Service Account credentials
- Each credential can be activated/deactivated
- Support for metadata (JSON storage for additional data)

### 3. G Suite Accounts with Geographical Data
- Associate multiple G Suite accounts with credentials
- Store geographical information (country, region, city, timezone)
- Configure per-account quota limits and request rates
- Filter accounts by country or domain

### 4. Dynamic Configuration
- Store application configuration in database
- Override with environment variables for flexibility
- API endpoints for runtime configuration changes

## Database Schema

### Tables

#### `configurations`
Stores application configuration settings.
```sql
- id: INTEGER (primary key)
- key: TEXT (unique)
- value: TEXT
- description: TEXT
- created_at: DATETIME
- updated_at: DATETIME
```

#### `credentials`
Stores Google Service Account credentials.
```sql
- id: INTEGER (primary key)
- name: TEXT (unique)
- client_email: TEXT
- private_key: TEXT
- project_id: TEXT
- type: TEXT (default: 'service_account')
- is_active: INTEGER (1=active, 0=inactive)
- metadata: TEXT (JSON)
- created_at: DATETIME
- updated_at: DATETIME
```

#### `gsuite_accounts`
Stores G Suite account configurations with geographical data.
```sql
- id: INTEGER (primary key)
- credential_id: INTEGER (foreign key -> credentials.id)
- admin_email: TEXT
- domain: TEXT
- country: TEXT
- region: TEXT
- city: TEXT
- timezone: TEXT
- quota_limit: INTEGER (default: 1200000)
- requests_per_email: INTEGER (default: 300)
- is_active: INTEGER (1=active, 0=inactive)
- metadata: TEXT (JSON)
- created_at: DATETIME
- updated_at: DATETIME
```

## Setup

### 1. Install Dependencies
```bash
cd main/api
npm install
```

### 2. Initialize Database
The database is automatically initialized on first run. The database file is created at `main/api/data/gadmin.db`.

### 3. Migrate Existing Data
To import existing `.env` and `cred.json` files:
```bash
cd main/api
node db/migrate.js migrate
```

### 4. Import Additional Credentials
To import a new credential file:
```bash
cd main/api
node db/migrate.js import /path/to/cred.json credential-name
```

## API Endpoints

All endpoints require authentication via the `x-api-key` header.

### Statistics Endpoints

#### GET `/api/stats`
Get system statistics including credential counts, account counts, and geographical distribution.

**Response:**
```json
{
  "success": true,
  "data": {
    "credentials": {
      "active": 2,
      "total": 3,
      "inactive": 1
    },
    "gsuiteAccounts": {
      "active": 5,
      "total": 7,
      "inactive": 2
    },
    "geographicalDistribution": [
      { "country": "US", "count": 3 },
      { "country": "FR", "count": 2 }
    ],
    "domainDistribution": [
      { "domain": "example.com", "count": 3 },
      { "domain": "test.com", "count": 2 }
    ]
  }
}
```

#### GET `/api/stats/countries`
Get all available countries with account counts.

**Response:**
```json
{
  "success": true,
  "data": [
    { "country": "US", "account_count": 3 },
    { "country": "FR", "account_count": 2 }
  ]
}
```

### Account Selection Endpoints

#### POST `/api/account-selection/select`
Select the best G Suite account based on criteria.

**Request body:**
```json
{
  "country": "US",
  "region": "California",
  "domain": "example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "credential_id": 1,
    "admin_email": "admin@example.com",
    "domain": "example.com",
    "country": "US",
    "region": "California",
    "quota_limit": 1200000,
    "credential_name": "us-west-cred"
  }
}
```

#### POST `/api/account-selection/match`
Get all G Suite accounts matching criteria.

**Request body:**
```json
{
  "country": "US",
  "domain": "example.com"
}
```

#### GET `/api/account-selection/:id/with-credentials`
Get a G Suite account with full credential information (including private key).

**Warning:** This endpoint returns sensitive credential data. Use with caution.

#### POST `/api/account-selection/load-balanced`
Get a load-balanced G Suite account for the given criteria.

**Request body:**
```json
{
  "country": "US",
  "domain": "example.com"
}
```

### Configuration Endpoints

#### GET `/api/configs`
Get all configuration settings.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "key": "port",
      "value": "3000",
      "description": "Server port"
    }
  ]
}
```

#### GET `/api/configs/:key`
Get a specific configuration value.

#### PUT `/api/configs/:key`
Set or update a configuration value.

**Request body:**
```json
{
  "value": "3000",
  "description": "Server port"
}
```

### Credential Endpoints

#### GET `/api/credentials`
Get all active credentials (without private keys).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "default",
      "client_email": "service@project.iam.gserviceaccount.com",
      "project_id": "my-project",
      "is_active": 1
    }
  ]
}
```

#### GET `/api/credentials/:id`
Get a specific credential.

**Query parameters:**
- `includePrivateKey=true`: Include the private key in the response (use with caution)

#### POST `/api/credentials`
Create a new credential.

**Request body:**
```json
{
  "name": "my-credential",
  "clientEmail": "service@project.iam.gserviceaccount.com",
  "privateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----",
  "projectId": "my-project",
  "metadata": {
    "description": "Production credential"
  }
}
```

#### PATCH `/api/credentials/:id`
Update a credential.

#### DELETE `/api/credentials/:id`
Delete a credential permanently.

#### POST `/api/credentials/:id/deactivate`
Deactivate a credential (soft delete).

### G Suite Account Endpoints

#### GET `/api/gsuite-accounts`
Get all active G Suite accounts.

**Query parameters:**
- `country`: Filter by country
- `domain`: Filter by domain

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "credential_id": 1,
      "admin_email": "admin@example.com",
      "domain": "example.com",
      "country": "US",
      "region": "California",
      "city": "San Francisco",
      "timezone": "America/Los_Angeles",
      "quota_limit": 1200000,
      "requests_per_email": 300,
      "credential_name": "default",
      "client_email": "service@project.iam.gserviceaccount.com"
    }
  ]
}
```

#### GET `/api/gsuite-accounts/country/:country`
Get all G Suite accounts in a specific country.

#### GET `/api/gsuite-accounts/:id`
Get a specific G Suite account.

#### POST `/api/gsuite-accounts`
Create a new G Suite account.

**Request body:**
```json
{
  "credentialId": 1,
  "adminEmail": "admin@example.com",
  "domain": "example.com",
  "country": "US",
  "region": "California",
  "city": "San Francisco",
  "timezone": "America/Los_Angeles",
  "quotaLimit": 1200000,
  "requestsPerEmail": 300,
  "metadata": {
    "datacenter": "us-west"
  }
}
```

#### PATCH `/api/gsuite-accounts/:id`
Update a G Suite account.

#### DELETE `/api/gsuite-accounts/:id`
Delete a G Suite account permanently.

#### POST `/api/gsuite-accounts/:id/deactivate`
Deactivate a G Suite account (soft delete).

## Environment Variables

The system supports both database-backed and environment variable configuration:

```bash
# Database mode (set to 'true' to use database)
USE_DATABASE=true

# These are used as fallbacks if database is not available
PORT=3000
ADMIN_EMAIL=admin@example.com
CRED_PATH=./cred.json
DEFAULT_DOMAIN=example.com
QUOTA_LIMIT=1200000
REQUESTS_PER_EMAIL=300
API_KEY=your-api-key
```

## Usage Examples

### Example 1: Managing Multiple G Suite Accounts by Geography

```bash
# Create credentials for different regions
curl -X POST http://localhost:3000/api/credentials \
  -H "x-api-key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "us-west-cred",
    "clientEmail": "us-west@project.iam.gserviceaccount.com",
    "privateKey": "...",
    "projectId": "my-project-us"
  }'

# Create G Suite account for US West
curl -X POST http://localhost:3000/api/gsuite-accounts \
  -H "x-api-key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "credentialId": 1,
    "adminEmail": "admin@us.example.com",
    "domain": "us.example.com",
    "country": "US",
    "region": "California",
    "city": "San Francisco",
    "timezone": "America/Los_Angeles"
  }'

# List all US accounts
curl -H "x-api-key: your-key" \
  "http://localhost:3000/api/gsuite-accounts?country=US"
```

### Example 2: Credential Rotation

```bash
# Deactivate old credential
curl -X POST http://localhost:3000/api/credentials/1/deactivate \
  -H "x-api-key: your-key"

# Create and activate new credential
curl -X POST http://localhost:3000/api/credentials \
  -H "x-api-key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "new-credential",
    "clientEmail": "new@project.iam.gserviceaccount.com",
    "privateKey": "..."
  }'
```

## Backward Compatibility

The system maintains backward compatibility with file-based configuration:
- Set `USE_DATABASE=false` in `.env` to use file-based configuration
- When database mode fails, the system falls back to file-based credentials
- Existing code continues to work without modifications

## Security Considerations

1. **Database File**: The database file (`data/gadmin.db`) is excluded from git via `.gitignore`
2. **Private Keys**: Private keys are not returned in list endpoints by default
3. **API Authentication**: All endpoints require API key authentication
4. **Encryption**: Consider encrypting the database file in production environments

## Troubleshooting

### Database not initializing
```bash
# Manually initialize the database
cd main/api
node -e "require('./db').getDatabase()"
```

### Migration fails
```bash
# Check if .env and cred.json files exist
ls -la main/api/.env main/api/cred.json

# Run migration with verbose output
cd main/api
node db/migrate.js migrate
```

### Verify database content
```bash
cd main/api
sqlite3 data/gadmin.db "SELECT * FROM configurations;"
sqlite3 data/gadmin.db "SELECT * FROM credentials;"
sqlite3 data/gadmin.db "SELECT * FROM gsuite_accounts;"
```

## Future Enhancements

- Database encryption for sensitive data
- Credential rotation policies
- Audit logging for credential access
- Multi-tenancy support
- Credential expiration and renewal tracking
