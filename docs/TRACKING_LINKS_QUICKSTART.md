# Quick Start: Tracking Links

Get started with tracking links in 5 minutes!

## What are Tracking Links?

Tracking links are special URLs that:
- Redirect visitors to your destination URL
- Track when someone clicks the link
- Provide HTML snippets for easy embedding
- Can be organized with names, tags, and descriptions

## Setup (One-time)

### 1. Database Setup

**For new installations:**
```bash
# The schema already includes tracking links support
psql "$PGDATABASE" -f main/api/db/schema.sql
```

**For existing databases:**
```bash
# Run the migration to enable standalone tracking links
psql "$PGDATABASE" -f main/api/db/migrations/make_tracking_links_standalone.sql
```

### 2. Start the API Server

```bash
cd main/api
node server.js
```

The API will be available at `http://localhost:3000`

## Usage

### Option 1: Web Interface (Easiest)

1. Open `docs/tracking-links-demo.html` in your browser
2. Fill in the form with your destination URL
3. Click "Create Tracking Link"
4. Copy the generated HTML or tracking URL
5. Use it in your website, emails, or social media

### Option 2: API (For Automation)

#### Create a Tracking Link

```bash
curl -X POST http://localhost:3000/api/tracking-links \
  -H "Content-Type: application/json" \
  -d '{
    "original_url": "https://example.com/product",
    "name": "Product Page",
    "description": "Main product landing page",
    "tags": ["product", "landing"]
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "track_id": "550e8400-e29b-41d4-a716-446655440000",
    "original_url": "https://example.com/product",
    "name": "Product Page",
    ...
  }
}
```

#### Get HTML Snippet

```bash
curl "http://localhost:3000/api/tracking-links/1/html?linkText=Shop%20Now"
```

Response:
```json
{
  "success": true,
  "data": {
    "tracking_url": "http://localhost:3000/t/c/550e8400-e29b-41d4-a716-446655440000",
    "html": "<a href=\"http://localhost:3000/t/c/550e8400-e29b-41d4-a716-446655440000\" target=\"_blank\">Shop Now</a>"
  }
}
```

#### Use the Tracking Link

Add the HTML to your webpage:
```html
<a href="http://localhost:3000/t/c/550e8400-e29b-41d4-a716-446655440000" target="_blank">Shop Now</a>
```

Or use the tracking URL directly:
```
http://localhost:3000/t/c/550e8400-e29b-41d4-a716-446655440000
```

#### Check Statistics

```bash
curl http://localhost:3000/api/tracking-links/1/stats
```

Response:
```json
{
  "success": true,
  "data": {
    "name": "Product Page",
    "clicked": true,
    "clicked_at": "2024-02-08T15:30:00.000Z",
    "stats": {
      "total_clicks": 1,
      "last_clicked": "2024-02-08T15:30:00.000Z",
      "days_active": 5
    }
  }
}
```

## Common Use Cases

### 1. Track Offer Links

```bash
# Create tracking link for an offer
curl -X POST http://localhost:3000/api/tracking-links \
  -H "Content-Type: application/json" \
  -d '{
    "original_url": "https://example.com/special-offer",
    "name": "Summer Sale 2024",
    "tags": ["sale", "summer", "2024"]
  }'
```

### 2. Track Social Media Links

```bash
# Create tracking link for social media
curl -X POST http://localhost:3000/api/tracking-links \
  -H "Content-Type: application/json" \
  -d '{
    "original_url": "https://example.com/landing",
    "name": "Instagram Bio Link",
    "tags": ["instagram", "social"]
  }'
```

### 3. Create Multiple Links at Once

```bash
# Batch create tracking links
curl -X POST http://localhost:3000/api/tracking-links/batch \
  -H "Content-Type: application/json" \
  -d '{
    "links": [
      {
        "original_url": "https://example.com/offer1",
        "name": "Offer 1",
        "tags": ["campaign-a"]
      },
      {
        "original_url": "https://example.com/offer2",
        "name": "Offer 2",
        "tags": ["campaign-a"]
      }
    ]
  }'
```

### 4. Search and Filter Links

```bash
# Search by name or description
curl "http://localhost:3000/api/tracking-links?search=summer"

# Filter by tag
curl "http://localhost:3000/api/tracking-links?tag=sale"

# Combine filters with pagination
curl "http://localhost:3000/api/tracking-links?tag=2024&limit=10&offset=0"
```

## Testing

Run the complete test suite:

```bash
cd main/api
./test-tracking-links.sh
```

This will test all endpoints including:
- Creating tracking links
- Getting HTML snippets
- Click tracking
- Statistics
- Search and filtering
- Batch operations

## Configuration

### Set Base URL (Important for Production!)

The tracking URLs use a base URL that defaults to `http://localhost:3000`. In production, set this to your actual domain:

```bash
export BASE_URL=https://your-domain.com
# or
export PUBLIC_URL=https://your-domain.com
```

Then restart the server:
```bash
cd main/api
node server.js
```

Now tracking URLs will use your production domain:
```
https://your-domain.com/t/c/550e8400-e29b-41d4-a716-446655440000
```

## Next Steps

- **[Full API Documentation](TRACKING_LINKS.md)** - Complete reference for all endpoints
- **[API Documentation](../main/api/API_DOCUMENTATION.md)** - General API reference
- **[Demo Page](tracking-links-demo.html)** - Interactive web interface

## Troubleshooting

### "Link not found" when clicking tracking URL

- Check that the tracking link was created successfully
- Verify the `track_id` is correct
- Ensure the API server is running

### Can't create tracking link

- Verify the `original_url` is a valid URL (must start with `http://` or `https://`)
- Check the API server logs for errors
- Ensure the database migration was run successfully

### Database errors

```bash
# Verify the click_tracking table structure
psql "$PGDATABASE" -c "\d click_tracking"

# Should show job_id and to_email as nullable
# Should show name, description, tags columns
```

### API server not starting

```bash
# Check Node.js dependencies
cd main
npm install

# Verify database connection
psql "$PGDATABASE" -c "SELECT 1"

# Check environment variables
echo $PGHOST $PGDATABASE $PGUSER
```

## Best Practices

1. **Use descriptive names** - Makes it easy to find links later
2. **Tag your links** - Organize by campaign, platform, or category
3. **Set BASE_URL in production** - Essential for working tracking links
4. **Monitor statistics** - Check which links are performing well
5. **Clean up old links** - Delete tracking links you're no longer using
6. **Test before deploying** - Use the test script to verify everything works

## Security Notes

- No authentication is currently required for tracking link APIs
- Consider adding authentication before deploying to production
- Tracking links are public - anyone with the URL can use it
- No rate limiting on redirect endpoint - consider adding in production

## Support

For more information:
- See [TRACKING_LINKS.md](TRACKING_LINKS.md) for complete API documentation
- Check [API_DOCUMENTATION.md](../main/api/API_DOCUMENTATION.md) for general API info
- Review the code in `main/api/routes/trackingLinks.js`
