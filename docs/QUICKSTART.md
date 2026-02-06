# Quick Start Guide: Database-Based Credential Management

This guide will help you quickly set up and start using the new database-based credential management system.

## Prerequisites

- Node.js installed
- Google Service Account credentials (cred.json)
- Admin access to G Suite / Google Workspace

## Step 1: Install Dependencies

```bash
cd main/api
npm install
```

## Step 2: Enable Database Mode

Edit `main/api/.env` and set:
```bash
USE_DATABASE=true
```

## Step 3: Migrate Existing Data

Run the migration script to import your existing `.env` and `cred.json`:

```bash
cd main/api
node db/migrate.js migrate
```

You should see output like:
```
Starting migration from .env and cred.json...
Migrating .env configuration...
  ✓ Migrated PORT -> port: 3000
  ✓ Migrated DEFAULT_DOMAIN -> default_domain: example.com
  ✓ Created default credential (ID: 1)
    - client_email: service@project.iam.gserviceaccount.com
  ✓ Created default G Suite account (ID: 1)
    - admin_email: admin@example.com
    - domain: example.com
Migration complete!
```

## Step 4: Start the API Server

```bash
cd main/api
npm start
```

The server will start on port 3000 (or the port specified in your config).

## Step 5: Test the API

Test with curl (replace `your-api-key` with the API_KEY from your .env):

```bash
# Check health
curl -H "x-api-key: your-api-key" http://localhost:3000/api/health

# List configurations
curl -H "x-api-key: your-api-key" http://localhost:3000/api/configs

# List credentials
curl -H "x-api-key: your-api-key" http://localhost:3000/api/credentials

# List G Suite accounts
curl -H "x-api-key: your-api-key" http://localhost:3000/api/gsuite-accounts
```

## Common Tasks

### Add a New Credential

```bash
curl -X POST http://localhost:3000/api/credentials \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "europe-cred",
    "clientEmail": "europe@project.iam.gserviceaccount.com",
    "privateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----",
    "projectId": "my-project-eu"
  }'
```

### Add a G Suite Account with Geographical Data

```bash
curl -X POST http://localhost:3000/api/gsuite-accounts \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "credentialId": 1,
    "adminEmail": "admin@europe.example.com",
    "domain": "europe.example.com",
    "country": "FR",
    "region": "Ile-de-France",
    "city": "Paris",
    "timezone": "Europe/Paris"
  }'
```

### List Accounts by Country

```bash
curl -H "x-api-key: your-api-key" \
  "http://localhost:3000/api/gsuite-accounts?country=FR"
```

### Import Additional Credentials from File

```bash
cd main/api
node db/migrate.js import /path/to/another-cred.json europe-credential
```

## Verification

Check that your database was created:

```bash
ls -la main/api/data/gadmin.db
```

View database content (requires sqlite3):

```bash
cd main/api
sqlite3 data/gadmin.db "SELECT name, client_email FROM credentials;"
sqlite3 data/gadmin.db "SELECT admin_email, domain, country FROM gsuite_accounts;"
```

## Next Steps

1. Read the full [Database Documentation](DATABASE.md) for advanced features
2. Set up multiple G Suite accounts for different regions
3. Configure credential rotation policies
4. Explore the complete API reference

## Troubleshooting

### Server won't start
- Check that port 3000 is available
- Verify `.env` file exists and USE_DATABASE=true
- Check npm install completed successfully

### Migration fails
- Ensure `.env` file exists with valid configuration
- Check that `cred.json` exists if you want to migrate credentials
- Run with: `node db/migrate.js migrate` to see detailed errors

### API returns 401 Unauthorized
- Make sure you're sending the `x-api-key` header
- Verify the API key matches the one in your `.env` file

### Database doesn't exist
- The database is created automatically on first use
- Run migration to initialize: `node db/migrate.js migrate`
- Check that `main/api/data/` directory was created

## Getting Help

- Full documentation: [DATABASE.md](DATABASE.md)
- API endpoint reference: See DATABASE.md "API Endpoints" section
- GitHub Issues: Report bugs or request features

## What's Next?

Now that you have the database set up, you can:
- ✅ Manage multiple Google Service Account credentials
- ✅ Organize G Suite accounts by geography
- ✅ Configure per-account quotas and rate limits
- ✅ Use the API to dynamically manage credentials
- ✅ Rotate credentials without restarting the server

Enjoy your improved credential management system!
