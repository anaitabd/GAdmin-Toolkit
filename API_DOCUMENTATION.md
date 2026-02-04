# GAdmin Toolkit - API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

All API endpoints (except `/health` and tracking endpoints) require JWT authentication.

Include the JWT token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## G Suite Management API

### Domains

#### List Domains

```http
GET /api/gsuite/domains
```

**Response:**
```json
{
  "success": true,
  "domains": [
    {
      "id": 1,
      "domain": "example.com",
      "customer_id": "C1234567",
      "admin_email": "admin@example.com",
      "status": "active",
      "verified": true,
      "max_users": 10000,
      "created_at": "2026-02-04T10:00:00Z",
      "last_sync_at": "2026-02-04T12:00:00Z"
    }
  ]
}
```

#### Get Domain Details

```http
GET /api/gsuite/domains/:id
```

**Response:**
```json
{
  "success": true,
  "domain": {
    "id": 1,
    "domain": "example.com",
    "customer_id": "C1234567",
    "admin_email": "admin@example.com",
    "status": "active",
    "user_count": 150,
    "service_account_count": 1
  }
}
```

#### Add Domain

```http
POST /api/gsuite/domains
Content-Type: application/json
```

**Request Body:**
```json
{
  "domain": "example.com",
  "customer_id": "C1234567",
  "admin_email": "admin@example.com",
  "max_users": 10000,
  "notes": "Production domain"
}
```

**Response:**
```json
{
  "success": true,
  "domain": {
    "id": 1,
    "domain": "example.com",
    "status": "active",
    "created_at": "2026-02-04T10:00:00Z"
  }
}
```

#### Delete Domain

```http
DELETE /api/gsuite/domains/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Domain deleted"
}
```

### Service Accounts

#### Upload Service Account Credentials

```http
POST /api/gsuite/domains/:id/service-accounts
Content-Type: multipart/form-data
```

**Form Data:**
- `credJson`: File (JSON file from Google Cloud Console)

**Response:**
```json
{
  "success": true,
  "serviceAccount": {
    "id": 1,
    "service_account_email": "service@project.iam.gserviceaccount.com",
    "client_email": "service@project.iam.gserviceaccount.com",
    "status": "active"
  },
  "message": "Service account added successfully"
}
```

#### List Service Accounts

```http
GET /api/gsuite/domains/:id/service-accounts
```

**Response:**
```json
{
  "success": true,
  "serviceAccounts": [
    {
      "id": 1,
      "service_account_email": "service@project.iam.gserviceaccount.com",
      "client_email": "service@project.iam.gserviceaccount.com",
      "status": "active",
      "last_auth_success_at": "2026-02-04T12:00:00Z",
      "created_at": "2026-02-04T10:00:00Z"
    }
  ]
}
```

### User Management

#### Generate Users

Generate fake users for testing.

```http
POST /api/gsuite/domains/:id/users/generate
Content-Type: application/json
```

**Request Body:**
```json
{
  "count": 100,
  "password": "Password123@"
}
```

**Response:**
```json
{
  "success": true,
  "count": 100,
  "users": [
    {
      "id": 1,
      "email": "john.smith@example.com",
      "given_name": "John",
      "family_name": "Smith",
      "status": "pending"
    }
  ],
  "message": "Generated 100 users"
}
```

#### Bulk Create Users

Create users in Google Workspace (background job).

```http
POST /api/gsuite/domains/:id/users/bulk-create
Content-Type: application/json
```

**Request Body (optional):**
```json
{
  "userIds": [1, 2, 3]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk user creation started in background"
}
```

**Notes:**
- Creates users with 250ms rate limit between requests
- Updates user status to `creating` → `active` or `failed`
- Check progress with GET `/api/gsuite/domains/:id/users`

#### Bulk Delete Users

Delete users from Google Workspace (background job).

```http
DELETE /api/gsuite/domains/:id/users/bulk-delete
Content-Type: application/json
```

**Request Body (optional):**
```json
{
  "userEmails": ["user1@example.com", "user2@example.com"],
  "excludeAdmin": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk user deletion started in background"
}
```

#### List Users

```http
GET /api/gsuite/domains/:id/users?source=database
```

**Query Parameters:**
- `source`: `database` or `google` (default: `database`)

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "email": "john.smith@example.com",
      "given_name": "John",
      "family_name": "Smith",
      "full_name": "John Smith",
      "status": "active",
      "is_admin": false,
      "google_created_at": "2026-02-04T10:00:00Z",
      "created_at": "2026-02-04T09:00:00Z"
    }
  ]
}
```

#### Sync Users from Google

Sync users from Google Workspace to local database.

```http
POST /api/gsuite/domains/:id/sync
```

**Response:**
```json
{
  "success": true,
  "results": {
    "added": 5,
    "updated": 95,
    "total": 100
  },
  "message": "Synced 100 users (5 added, 95 updated)"
}
```

#### Create Sender Accounts

Create sender_accounts from active G Suite users.

```http
POST /api/gsuite/domains/:id/create-senders
```

**Response:**
```json
{
  "success": true,
  "count": 100,
  "message": "Created 100 sender accounts"
}
```

#### Test Authentication

Test service account authentication.

```http
POST /api/gsuite/test-auth
Content-Type: multipart/form-data
```

**Form Data:**
- `credJson`: File (service account JSON)
- `impersonateUser`: Email to impersonate

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful"
}
```

## Sender Accounts API

### List Sender Accounts

```http
GET /api/accounts
```

**Response:**
```json
{
  "success": true,
  "accounts": [
    {
      "id": 1,
      "email": "john.smith@example.com",
      "display_name": "john.smith@example.com",
      "auth_type": "gmail_jwt",
      "status": "active",
      "daily_limit": 2000,
      "daily_sent": 150,
      "gsuite_user_id": 1,
      "gsuite_domain_id": 1,
      "service_account_id": 1,
      "impersonate_user": "john.smith@example.com"
    }
  ]
}
```

## Campaigns API

### Create Campaign

```http
POST /api/campaigns
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Black Friday Campaign",
  "subject": "Black Friday Deals!",
  "html_template": "<p>Check our deals at {{offer_link}}</p>",
  "track_opens": true,
  "track_clicks": true,
  "use_ec2_tracking": true,
  "real_offer_url": "https://sponsor.com/blackfriday"
}
```

**Response:**
```json
{
  "success": true,
  "campaign": {
    "id": 1,
    "name": "Black Friday Campaign",
    "status": "provisioning",
    "ec2_status": "creating",
    "tracking_domain": "track1.tracking.yourdomain.com"
  },
  "message": "Campaign created, EC2 provisioning in background"
}
```

### Get Campaign Details

```http
GET /api/campaigns/:id
```

**Response:**
```json
{
  "success": true,
  "campaign": {
    "id": 1,
    "name": "Black Friday Campaign",
    "subject": "Black Friday Deals!",
    "status": "ready",
    "use_ec2_tracking": true,
    "tracking_domain": "track1.tracking.yourdomain.com",
    "total_sent": 5000,
    "total_opened": 1500,
    "total_clicked": 450
  }
}
```

### Get EC2 Status

```http
GET /api/campaigns/:id/ec2
```

**Response:**
```json
{
  "success": true,
  "ec2": {
    "instance_id": "i-1234567890abcdef0",
    "status": "running",
    "public_ip": "54.123.45.67",
    "health_status": "healthy",
    "launched_at": "2026-02-04T10:00:00Z"
  }
}
```

### Get DNS Status

```http
GET /api/campaigns/:id/dns
```

**Response:**
```json
{
  "success": true,
  "dns": {
    "full_domain": "track1.tracking.yourdomain.com",
    "status": "dns_active",
    "dns_verified": true,
    "public_ip": "54.123.45.67"
  }
}
```

### Get SSL Status

```http
GET /api/campaigns/:id/ssl
```

**Response:**
```json
{
  "success": true,
  "ssl": {
    "status": "active",
    "domain": "track1.tracking.yourdomain.com",
    "issued_at": "2026-02-04T10:30:00Z",
    "expires_at": "2026-05-04T10:30:00Z",
    "auto_renew": true
  }
}
```

## Queue API

### Enqueue Emails

```http
POST /api/campaigns/:id/enqueue
Content-Type: application/json
```

**Request Body:**
```json
{
  "emails": [
    {
      "recipient": "user1@example.com",
      "data": {
        "name": "John Doe"
      }
    },
    {
      "recipient": "user2@example.com",
      "data": {
        "name": "Jane Smith"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "queued": 2,
  "message": "2 emails added to queue"
}
```

## Tracking Endpoints

These endpoints are public (no authentication required).

### Track Email Open

```http
GET /track/open/:token
```

Returns a 1x1 transparent pixel image.

### Track Click

```http
GET /track/click/:token
```

Redirects to the offer URL and records the click.

### Unsubscribe

```http
GET /track/unsubscribe/:token
```

Displays unsubscribe confirmation page.

## VPS Tracking Endpoints

Hosted on each EC2 instance.

### Track Open (VPS)

```http
GET https://track123.yourdomain.com/track/open/:token
```

Returns a 1x1 transparent pixel and records open event.

### Offer Redirect (VPS)

```http
GET https://track123.yourdomain.com/offer/:token
```

Displays redirect page, then redirects to real offer URL.

### Click Redirect (VPS)

```http
GET https://track123.yourdomain.com/click/:token
```

Records click and redirects to destination.

### Unsubscribe (VPS)

```http
GET https://track123.yourdomain.com/unsubscribe/:token
```

Displays unsubscribe confirmation.

## Analytics API

### Get Campaign Statistics

```http
GET /api/analytics/campaigns/:id
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total_sent": 10000,
    "total_delivered": 9800,
    "total_bounced": 200,
    "total_opened": 4500,
    "total_clicked": 1200,
    "total_unsubscribed": 50,
    "open_rate": 45.9,
    "click_rate": 12.2,
    "bounce_rate": 2.0
  }
}
```

### Get Sender Account Statistics

```http
GET /api/analytics/accounts/:id
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "account_id": 1,
    "email": "john.smith@example.com",
    "total_sent_today": 150,
    "daily_limit": 2000,
    "success_rate": 98.5,
    "average_response_time": 245
  }
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing or invalid token)
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

API endpoints are rate-limited:
- Default: 100 requests per 15 minutes per IP
- Authentication endpoints: 5 requests per 15 minutes per IP

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1643900000
```

## Pagination

List endpoints support pagination:

```http
GET /api/gsuite/domains/:id/users?page=1&perPage=50
```

Parameters:
- `page`: Page number (default: 1)
- `perPage`: Results per page (default: 30, max: 100)

Response includes pagination info:
```json
{
  "success": true,
  "users": [...],
  "pagination": {
    "page": 1,
    "perPage": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

## Webhooks

Coming soon: Webhook support for events like:
- User creation completed
- Campaign completed
- Bounce detected
- EC2 instance ready

