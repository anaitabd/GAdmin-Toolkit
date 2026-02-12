# Quick Start Guide - Data & Sponsor Management API

## Getting Started

### 1. Apply Database Migration

```bash
# For existing database
psql $DATABASE_URL -f main/api/db/migrations/add_data_sponsor_management.sql

# OR for fresh install
psql $DATABASE_URL -f main/api/db/schema.sql
```

### 2. Start the Server

```bash
cd main
npm install  # if not already done
npm start
```

### 3. Verify API is Running

```bash
curl http://localhost:3000/
```

## Common Use Cases

### Use Case 1: Setting Up an Affiliate Network

```bash
# 1. Create a vertical (category)
curl -X POST http://localhost:3000/api/verticals \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Health & Wellness",
    "status": "active"
  }'

# 2. Create an affiliate network
curl -X POST http://localhost:3000/api/affiliate-networks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MaxBounty",
    "api_url": "https://api.maxbounty.com",
    "api_key": "your-api-key",
    "api_type": "hasoffers",
    "status": "active"
  }'

# 3. Fetch offers from the network (replace :id with network ID)
curl -X POST http://localhost:3000/api/affiliate-networks/1/fetch-offers
```

### Use Case 2: Creating a Data List

```bash
# 1. Create a data provider
curl -X POST http://localhost:3000/api/data-providers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Data Source",
    "status": "active"
  }'

# 2. Create a data list
curl -X POST http://localhost:3000/api/data-lists \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q1 2024 Buyers",
    "data_provider_id": 1,
    "total_count": 0,
    "status": "active"
  }'

# 3. Add emails to the list
curl -X POST http://localhost:3000/api/email-data \
  -H "Content-Type: application/json" \
  -d '{
    "to_email": "user@example.com",
    "data_list_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "geo": "US",
    "is_clean": true,
    "is_fresh": true
  }'

# 4. Recount list total
curl -X POST http://localhost:3000/api/data-lists/1/recount
```

### Use Case 3: Setting Up Blacklists

```bash
# 1. Create a blacklist
curl -X POST http://localhost:3000/api/blacklists \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hard Bounces",
    "status": "active"
  }'

# 2. Add emails in bulk
curl -X POST http://localhost:3000/api/blacklists/1/emails/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "emails": [
      "bounce1@example.com",
      "bounce2@example.com",
      "bounce3@example.com"
    ]
  }'

# 3. Check if an email is blacklisted
curl -X POST http://localhost:3000/api/blacklists/1/check \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

### Use Case 4: Creating an Offer with Rotation

```bash
# 1. Create an offer (with network and vertical)
curl -X POST http://localhost:3000/api/offers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Weight Loss Trial",
    "subject": "Lose 10 Pounds Fast",
    "from_name": "Health Tips",
    "html_content": "<p>Try our program: [click_url]</p>",
    "click_url": "https://network.com/click/12345",
    "unsub_url": "https://network.com/unsub/12345",
    "affiliate_network_id": 1,
    "vertical_id": 1,
    "payout": 2.50,
    "status": "active"
  }'

# 2. Add creatives for rotation
curl -X POST http://localhost:3000/api/creatives \
  -H "Content-Type: application/json" \
  -d '{
    "offer_id": 1,
    "subject": "Weight Loss Breakthrough",
    "from_name": "Dr. Smith",
    "html_content": "<p>Revolutionary method: [click_url]</p>",
    "status": "active"
  }'

# 3. Add from names for rotation
curl -X POST http://localhost:3000/api/from-names \
  -H "Content-Type: application/json" \
  -d '{
    "offer_id": 1,
    "value": "Health Expert",
    "status": "active"
  }'

curl -X POST http://localhost:3000/api/from-names \
  -H "Content-Type: application/json" \
  -d '{
    "offer_id": 1,
    "value": "Wellness Coach",
    "status": "active"
  }'

# 4. Get a random from name (for rotation)
curl http://localhost:3000/api/from-names/random/1
```

### Use Case 5: Managing Suppressions

```bash
# 1. Add suppressions in bulk
curl -X POST http://localhost:3000/api/suppression-emails/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "offer_id": 1,
    "emails": [
      "suppressed1@example.com",
      "suppressed2@example.com"
    ]
  }'

# 2. Check if email is suppressed for an offer
curl -X POST http://localhost:3000/api/suppression-emails/check \
  -H "Content-Type: application/json" \
  -d '{
    "offer_id": 1,
    "email": "test@example.com"
  }'

# 3. Fetch suppressions from network API
curl -X POST http://localhost:3000/api/suppression-processes/start \
  -H "Content-Type: application/json" \
  -d '{
    "affiliate_network_id": 1,
    "offer_id": 1
  }'
```

### Use Case 6: Tracking Leads

```bash
# 1. Record a lead (typically from postback)
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "offer_id": 1,
    "campaign_id": 1,
    "affiliate_network_id": 1,
    "to_email": "customer@example.com",
    "payout": 2.50,
    "ip_address": "192.168.1.1",
    "geo": "US"
  }'

# 2. Get lead statistics
curl http://localhost:3000/api/leads/stats

# 3. Get leads for specific offer
curl http://localhost:3000/api/leads/by-offer/1
```

### Use Case 7: Viewing Audit Logs

```bash
# 1. Get recent audit logs
curl http://localhost:3000/api/audit-logs?limit=50

# 2. Filter by record type
curl http://localhost:3000/api/audit-logs?record_type=offer

# 3. Get audit logs for specific record
curl http://localhost:3000/api/audit-logs/by-record/offer/1
```

## Using the Send Filters Library

### In Your Code

```javascript
const {
    filterRecipients,
    pickCreative,
    pickFromName,
    pickSubject,
    getOfferLinks,
    replacePlaceholders
} = require('./lib/sendFilters');

// Example: Preparing to send for an offer
async function prepareOfferSend(offerId, emailDataRows) {
    // 1. Filter out blocked recipients
    const validRecipients = await filterRecipients(emailDataRows, offerId);
    
    // 2. Pick random creative (or use offer defaults)
    const creative = await pickCreative(offerId);
    
    // 3. Pick random from name
    const fromName = await pickFromName(offerId) || creative.from_name;
    
    // 4. Pick random subject
    const subject = await pickSubject(offerId) || creative.subject;
    
    // 5. Get offer links
    const { clickUrl, unsubUrl } = await getOfferLinks(offerId, creative.id);
    
    // 6. For each recipient, personalize content
    for (const recipient of validRecipients) {
        let html = creative.html_content;
        
        // Replace placeholders
        html = replacePlaceholders(html, recipient);
        
        // Replace URLs
        html = html.replace(/\[click_url\]/g, clickUrl);
        html = html.replace(/\[unsub_url\]/g, unsubUrl);
        
        // Send email...
    }
}
```

## API Response Format

All API endpoints return consistent JSON responses:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "count": 10
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message here"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "count": 50,
  "total": 500,
  "limit": 50,
  "offset": 0
}
```

## Common Query Parameters

Most list endpoints support these parameters:

- `limit` - Number of records to return (default: 50, max: 100)
- `offset` - Number of records to skip (for pagination)
- `search` - Text search (searches name/email fields)
- `status` - Filter by status (active/inactive/deleted)

Example:
```bash
curl "http://localhost:3000/api/offers?limit=20&offset=0&status=active&search=weight"
```

## Testing the API

### Check All Routes Are Registered

```bash
curl http://localhost:3000/ | jq '.endpoints'
```

### Test Health Endpoint

```bash
curl http://localhost:3000/health
```

## Environment Variables

Make sure these are set:

```bash
# Database
PGHOST=localhost
PGPORT=5432
PGDATABASE=gadmin
PGUSER=postgres
PGPASSWORD=your-password

# Server
PORT=3000

# Optional: Database pool settings
DB_POOL_MAX=20
DB_POOL_MIN=2
```

## Troubleshooting

### Migration fails with "relation already exists"

The migration uses `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ADD COLUMN IF NOT EXISTS`, so it's safe to run multiple times. If you see errors, check if tables were partially created.

### API returns 404 for new routes

Make sure the server was restarted after adding the new route files:
```bash
pkill -f "node.*server.js"
npm start
```

### Can't connect to database

Check your PostgreSQL connection:
```bash
psql $DATABASE_URL -c "SELECT 1"
```

### Import fails with foreign key constraint

Make sure parent records exist first (e.g., create data_provider before creating data_list that references it).

## Next Steps

1. **Test the API**: Use the examples above to test each endpoint
2. **Integrate Filters**: Update your job workers to use the send filters
3. **Build Frontend**: Create React pages for the new entities
4. **Monitor Audit Logs**: Use audit logs to track all changes
5. **Set Up Networks**: Configure your affiliate network integrations

## Support

For questions or issues:
1. Check IMPLEMENTATION_GUIDE.md for detailed documentation
2. Check BACKEND_IMPLEMENTATION_SUMMARY.md for complete feature list
3. Review inline code comments in route files
4. Check audit logs for debugging

## API Documentation

Full endpoint documentation is available at the root endpoint:
```bash
curl http://localhost:3000/ | jq
```

Or view in your browser: http://localhost:3000/
