# Tracking Links API Documentation

## Overview

The Tracking Links API allows you to create, manage, and track clicks on URLs. This is useful for:
- Creating tracking links for offers and campaigns
- Generating HTML snippets for easy insertion into web pages
- Tracking click-through rates
- Organizing links with names, descriptions, and tags

## Base URL

```
http://localhost:3000/api/tracking-links
```

## Authentication

Currently, the API does not require authentication. Consider adding authentication in production.

---

## Endpoints

### 1. Get All Tracking Links

**GET** `/api/tracking-links`

Retrieves all standalone tracking links (excludes campaign-related links by default).

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `includeJobLinks` | boolean | Include campaign-related tracking links | `false` |
| `search` | string | Search by name or description (case-insensitive) | - |
| `tag` | string | Filter by specific tag | - |
| `limit` | integer | Maximum number of results | `50` |
| `offset` | integer | Number of results to skip (pagination) | `0` |

#### Example Request

```bash
curl http://localhost:3000/api/tracking-links?search=offer&limit=10
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "track_id": "550e8400-e29b-41d4-a716-446655440000",
      "original_url": "https://example.com/offer",
      "name": "Summer Sale Offer",
      "description": "Main landing page for summer sale",
      "tags": ["summer", "sale", "2024"],
      "clicked": false,
      "clicked_at": null,
      "created_at": "2024-02-08T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 2. Get Single Tracking Link

**GET** `/api/tracking-links/:id`

Retrieves details of a specific tracking link by ID.

#### Example Request

```bash
curl http://localhost:3000/api/tracking-links/1
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "track_id": "550e8400-e29b-41d4-a716-446655440000",
    "job_id": null,
    "to_email": null,
    "original_url": "https://example.com/offer",
    "name": "Summer Sale Offer",
    "description": "Main landing page for summer sale",
    "tags": ["summer", "sale", "2024"],
    "clicked": false,
    "clicked_at": null,
    "created_at": "2024-02-08T10:00:00.000Z"
  }
}
```

---

### 3. Create Tracking Link

**POST** `/api/tracking-links`

Creates a new standalone tracking link.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `original_url` | string | **Yes** | The destination URL to redirect to |
| `name` | string | No | Friendly name for the link |
| `description` | string | No | Detailed description |
| `tags` | array | No | Array of tags for organization |

#### Example Request

```bash
curl -X POST http://localhost:3000/api/tracking-links \
  -H "Content-Type: application/json" \
  -d '{
    "original_url": "https://example.com/offer",
    "name": "Summer Sale Offer",
    "description": "Main landing page for summer sale",
    "tags": ["summer", "sale", "2024"]
  }'
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "track_id": "550e8400-e29b-41d4-a716-446655440000",
    "job_id": null,
    "to_email": null,
    "original_url": "https://example.com/offer",
    "name": "Summer Sale Offer",
    "description": "Main landing page for summer sale",
    "tags": ["summer", "sale", "2024"],
    "clicked": false,
    "clicked_at": null,
    "created_at": "2024-02-08T10:00:00.000Z"
  }
}
```

---

### 4. Create Multiple Tracking Links (Batch)

**POST** `/api/tracking-links/batch`

Creates multiple tracking links in a single request.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `links` | array | **Yes** | Array of tracking link objects (same fields as single create) |

#### Example Request

```bash
curl -X POST http://localhost:3000/api/tracking-links/batch \
  -H "Content-Type: application/json" \
  -d '{
    "links": [
      {
        "original_url": "https://example.com/offer1",
        "name": "Offer 1",
        "tags": ["sale"]
      },
      {
        "original_url": "https://example.com/offer2",
        "name": "Offer 2",
        "tags": ["promo"]
      }
    ]
  }'
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "track_id": "550e8400-e29b-41d4-a716-446655440000",
      "original_url": "https://example.com/offer1",
      "name": "Offer 1",
      "tags": ["sale"],
      "clicked": false,
      "clicked_at": null,
      "created_at": "2024-02-08T10:00:00.000Z"
    },
    {
      "id": 2,
      "track_id": "660e8400-e29b-41d4-a716-446655440001",
      "original_url": "https://example.com/offer2",
      "name": "Offer 2",
      "tags": ["promo"],
      "clicked": false,
      "clicked_at": null,
      "created_at": "2024-02-08T10:00:00.000Z"
    }
  ],
  "count": 2
}
```

---

### 5. Update Tracking Link

**PUT** `/api/tracking-links/:id`

Updates an existing standalone tracking link. Cannot update campaign-related tracking links.

#### Request Body

| Field | Type | Description |
|-------|------|-------------|
| `original_url` | string | New destination URL |
| `name` | string | New name |
| `description` | string | New description |
| `tags` | array | New tags |

All fields are optional. Only provided fields will be updated.

#### Example Request

```bash
curl -X PUT http://localhost:3000/api/tracking-links/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Offer Name",
    "tags": ["updated", "sale"]
  }'
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "track_id": "550e8400-e29b-41d4-a716-446655440000",
    "original_url": "https://example.com/offer",
    "name": "Updated Offer Name",
    "description": "Main landing page for summer sale",
    "tags": ["updated", "sale"],
    "clicked": false,
    "clicked_at": null,
    "created_at": "2024-02-08T10:00:00.000Z"
  }
}
```

---

### 6. Delete Tracking Link

**DELETE** `/api/tracking-links/:id`

Deletes a standalone tracking link. Cannot delete campaign-related tracking links.

#### Example Request

```bash
curl -X DELETE http://localhost:3000/api/tracking-links/1
```

#### Example Response

```json
{
  "success": true,
  "message": "Tracking link deleted"
}
```

---

### 7. Get HTML Snippet

**GET** `/api/tracking-links/:id/html`

Generates an HTML anchor tag with the tracking URL.

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `linkText` | string | Text to display in the link | `Click here` |
| `target` | string | Link target attribute (_blank, _self, etc.) | `_blank` |
| `style` | string | Inline CSS styles | - |

#### Example Request

```bash
curl "http://localhost:3000/api/tracking-links/1/html?linkText=Shop%20Now&style=color:blue;font-weight:bold"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "tracking_url": "http://localhost:3000/t/c/550e8400-e29b-41d4-a716-446655440000",
    "original_url": "https://example.com/offer",
    "name": "Summer Sale Offer",
    "html": "<a href=\"http://localhost:3000/t/c/550e8400-e29b-41d4-a716-446655440000\" target=\"_blank\" style=\"color:blue;font-weight:bold\">Shop Now</a>",
    "html_escaped": "<a href=&quot;http://localhost:3000/t/c/550e8400-e29b-41d4-a716-446655440000&quot; target=&quot;_blank&quot; style=&quot;color:blue;font-weight:bold&quot;>Shop Now</a>"
  }
}
```

---

### 8. Get Tracking Link Statistics

**GET** `/api/tracking-links/:id/stats`

Retrieves statistics for a specific tracking link.

#### Example Request

```bash
curl http://localhost:3000/api/tracking-links/1/stats
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "track_id": "550e8400-e29b-41d4-a716-446655440000",
    "original_url": "https://example.com/offer",
    "name": "Summer Sale Offer",
    "description": "Main landing page for summer sale",
    "clicked": true,
    "clicked_at": "2024-02-08T15:30:00.000Z",
    "created_at": "2024-02-08T10:00:00.000Z",
    "click_count": 1,
    "stats": {
      "total_clicks": 1,
      "last_clicked": "2024-02-08T15:30:00.000Z",
      "created": "2024-02-08T10:00:00.000Z",
      "days_active": 0
    }
  }
}
```

---

### 9. Click Tracking Redirect

**GET** `/t/c/:trackId`

This endpoint records a click and redirects the user to the original URL. This is the actual tracking URL that should be used in your links.

#### Example

When a user clicks on a tracking link:
```
http://localhost:3000/t/c/550e8400-e29b-41d4-a716-446655440000
```

The system will:
1. Record the click (update `clicked` to `true` and `clicked_at` timestamp)
2. Redirect (302) the user to the `original_url`

---

## Complete Usage Example

### Web UI Demo

A complete interactive demo is available at `docs/tracking-links-demo.html`. Open this file in your browser to:
- Create tracking links with a user-friendly interface
- Generate HTML snippets automatically
- View and manage all your tracking links
- Copy URLs and HTML code with one click

To use the demo:
1. Start the API server: `cd main/api && node server.js`
2. Open `docs/tracking-links-demo.html` in your browser
3. Create and manage tracking links visually

### Command Line Example

### 1. Create a tracking link

```bash
curl -X POST http://localhost:3000/api/tracking-links \
  -H "Content-Type: application/json" \
  -d '{
    "original_url": "https://example.com/product",
    "name": "Product Landing Page",
    "description": "Main product page",
    "tags": ["product", "landing"]
  }'
```

Response includes `track_id`: `550e8400-e29b-41d4-a716-446655440000`

### 2. Get HTML snippet

```bash
curl "http://localhost:3000/api/tracking-links/1/html?linkText=Buy%20Now"
```

Use the returned HTML in your website:
```html
<a href="http://localhost:3000/t/c/550e8400-e29b-41d4-a716-446655440000" target="_blank">Buy Now</a>
```

### 3. Check statistics

```bash
curl http://localhost:3000/api/tracking-links/1/stats
```

---

## Error Responses

All endpoints follow a consistent error format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created (for POST requests)
- `400` - Bad Request (invalid input)
- `403` - Forbidden (e.g., trying to edit campaign links)
- `404` - Not Found
- `500` - Internal Server Error

---

## Environment Variables

Configure the base URL for tracking links:

```bash
# Public URL where your API is hosted
export BASE_URL=https://your-domain.com

# Or use PUBLIC_URL as fallback
export PUBLIC_URL=https://your-domain.com
```

If not set, defaults to `http://localhost:3000`

---

## Database Migration

If you have an existing database, run the migration:

```bash
psql "$PGDATABASE" -f main/api/db/migrations/make_tracking_links_standalone.sql
```

For new installations, use the updated schema:

```bash
psql "$PGDATABASE" -f main/api/db/schema.sql
```

---

## Tips and Best Practices

1. **Use descriptive names**: Make it easy to identify links later
2. **Use tags for organization**: Group related links together
3. **Set BASE_URL in production**: Ensure tracking URLs use your production domain
4. **Monitor statistics**: Regularly check which links are performing well
5. **Clean up old links**: Delete tracking links you're no longer using
6. **Batch creation**: Use batch endpoint when creating multiple links at once

---

## Limitations

- Tracking links currently track only whether a link was clicked (boolean)
- Multiple clicks on the same link are not counted separately
- No detailed analytics like geographic location, browser, etc.
- Campaign-related tracking links cannot be edited or deleted via this API

---

## Future Enhancements

Potential improvements for future versions:
- Multiple click tracking (count total clicks, not just first click)
- Click analytics (IP, user agent, referrer)
- Click rate limiting and fraud detection
- Expiration dates for tracking links
- URL shortening integration
- Webhook notifications on click events
