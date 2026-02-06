# Quick Start Guide: Database-Based Credential Management

This guide will help you quickly set up and start using the database-based credential management system with both the API and Web UI.

## Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose (optional, for containerized deployment)
- Google Service Account credentials (cred.json)
- Admin access to G Suite / Google Workspace

## Step 1: Choose Your Deployment Method

### Option A: Docker (Recommended)

The easiest way to get started with both frontend and backend:

```bash
# Clone the repository
git clone https://github.com/anaitabd/GAdmin-Toolkit.git
cd GAdmin-Toolkit

# Build and start all services
./run.sh up
```

Your application will be available at:
- **Frontend (Web UI)**: http://localhost:3000
- **API**: http://localhost:3001/api

Skip to **Step 4: Configure the Web UI** below.

### Option B: Manual Setup (Development)

If you prefer to run services separately for development:

## Step 1: Install Dependencies

**Backend:**
```bash
cd main/api
npm install
```

**Frontend:**
```bash
cd frontend
npm install
cd ..
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

## Step 4: Start the Servers

**Backend (API):**
```bash
cd main/api
npm start
```

The API server will start on port 3000.

**Frontend (in a new terminal):**
```bash
cd frontend
npm run dev
```

The frontend will start on port 5173.

Access the application:
- **Frontend**: http://localhost:5173
- **API**: http://localhost:3000/api

## Step 5: Configure the Web UI

1. Open http://localhost:5173 (or http://localhost:3000 if using Docker)
2. Go to the **Settings** page
3. Enter your API key (from the `.env` file's `API_KEY` variable)
4. Click **Save API Key**
5. You should see a green checkmark indicating successful connection

## Step 6: Explore the Web UI

The Web UI provides an easy interface to manage your system:

### Dashboard
- View system statistics (credentials, accounts, geographical distribution)
- See domain distribution charts
- Monitor active vs inactive resources

### Credentials Page
- View all Google Service Account credentials
- Add new credentials with a simple form
- Activate/deactivate or delete credentials

### G Suite Accounts Page
- View all G Suite accounts with their geographical information
- Filter accounts by country
- Add new accounts and associate them with credentials
- Configure quota limits and request rates per account

### Settings Page
- Configure your API key
- View system configurations
- Check API connection status

## Alternative: Test with API Only

## Alternative: Test with API Only

If you prefer to use the API directly without the Web UI:

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
