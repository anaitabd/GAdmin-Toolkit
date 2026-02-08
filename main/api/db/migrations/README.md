# Database Migrations

This directory contains database migration scripts for upgrading existing databases.

## Running Migrations

### Using psql command line
```bash
psql "$PGDATABASE" -f add_campaigns.sql
```

### Using environment variables
```bash
PGHOST=your-host PGPORT=5432 PGDATABASE=your-db PGUSER=your-user PGPASSWORD=your-pass psql -f add_campaigns.sql
```

## Available Migrations

### add_campaigns.sql
Adds campaign management features:
- `campaigns` table - Track email campaigns
- `campaign_templates` table - Reusable campaign configurations
- `unsubscribes` table - Opt-out management
- Related indexes for performance

**When to run**: If you have an existing database from before campaign management was added.

**Safe to rerun**: Yes, uses `CREATE TABLE IF NOT EXISTS`

## Migration Order
1. add_campaigns.sql (current)

## Verifying Migrations

After running migrations, verify with:
```bash
psql "$PGDATABASE" -c "\dt"
```

You should see the new tables: campaigns, campaign_templates, unsubscribes
