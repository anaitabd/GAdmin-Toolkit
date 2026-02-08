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

### make_tracking_links_standalone.sql
Enables standalone tracking links (not tied to campaigns):
- Makes `job_id` and `to_email` nullable in `click_tracking` table
- Adds `name`, `description`, and `tags` columns
- Adds indexes for searching by name and tags

**When to run**: If you have an existing database and want to use standalone tracking links via `/api/tracking-links`.

**Safe to rerun**: Yes, uses `IF NOT EXISTS` and `ALTER COLUMN` safely

## Migration Order
1. add_campaigns.sql
2. make_tracking_links_standalone.sql (current)

## Verifying Migrations

After running migrations, verify with:
```bash
psql "$PGDATABASE" -c "\dt"
```

For tracking links migration specifically:
```bash
psql "$PGDATABASE" -c "\d click_tracking"
```

You should see the updated click_tracking table with nullable job_id and to_email columns, plus name, description, and tags columns.
