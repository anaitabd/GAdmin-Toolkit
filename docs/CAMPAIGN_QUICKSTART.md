# Campaign Management Quick Start

This guide will help you quickly get started with the new campaign management features.

## Setup (For Existing Installations)

If you have an existing GAdmin-Toolkit installation, run the migration:

```bash
# Backup your database first!
pg_dump $PGDATABASE > backup_$(date +%Y%m%d).sql

# Run migration
psql $PGDATABASE -f main/api/db/migrations/add_campaigns.sql

# Restart API server
cd main/api && pm2 restart server
```

For new installations, the schema already includes these tables.

## Using the Campaign API

### 1. Create a Campaign

```bash
curl -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Sale 2024",
    "from_name": "Sales Team",
    "subject": "50% Off Summer Collection",
    "html_content": "<h1>Summer Sale!</h1>",
    "provider": "gmail_api",
    "list_name": "customers"
  }'
```

### 2. Launch a Campaign

```bash
curl -X POST http://localhost:3000/api/jobs/send-campaign \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_id": 1,
    "provider": "gmail_api",
    "from_name": "Sales Team",
    "subject": "50% Off",
    "html_content": "<h1>Sale!</h1>",
    "list_name": "customers"
  }'
```

### 3. Get Campaign Statistics

```bash
curl http://localhost:3000/api/campaigns/1/stats
```

Returns:
```json
{
  "success": true,
  "data": {
    "campaign_id": 1,
    "sent": 1250,
    "failed": 15,
    "total_clicks": 342,
    "unique_clickers": 298,
    "ctr": 23.84
  }
}
```

### 4. Clone a Campaign

```bash
curl -X POST http://localhost:3000/api/campaigns/1/clone
```

## Best Practices

### Campaign Naming
- Use descriptive names with dates
- Example: "Black Friday 2024 - Electronics"

### Testing
Always send test emails first:
```bash
curl -X POST http://localhost:3000/api/jobs/send-test-email \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gmail_api",
    "test_email": "test@example.com",
    "from_name": "Test",
    "subject": "Test",
    "html_content": "<p>Test</p>"
  }'
```

## Next Steps

- Read [EMAIL_PLATFORMS.md](EMAIL_PLATFORMS.md) for provider recommendations
- Read [SCALING_GUIDE.md](SCALING_GUIDE.md) for scaling strategies
- Check [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for details
