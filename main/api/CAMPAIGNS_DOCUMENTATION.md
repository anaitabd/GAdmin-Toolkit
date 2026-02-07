# Campaign Management System Documentation

## Overview

This system provides a comprehensive solution for managing bulk email campaigns with multiple admin users, allowing you to:
- Create and manage admin users with different roles
- Create email campaigns with specific configurations
- Select senders (users), email info, templates, and recipients
- Execute campaigns with bulk email sending
- Track campaign progress and statistics

## Database Schema

### Admin Users Table
Stores admin users who can create and manage campaigns.

Fields:
- `id`: Primary key
- `username`: Unique username
- `email`: Unique email address
- `password_hash`: Hashed password (SHA-256)
- `full_name`: Full name of the admin
- `role`: Role (admin, manager, operator)
- `active`: Whether the user is active
- `created_at`, `updated_at`: Timestamps

### Campaigns Table
Stores campaign configurations and status.

Fields:
- `id`: Primary key
- `name`: Unique campaign name
- `description`: Campaign description
- `created_by`: Reference to admin_users (campaign creator)
- `user_id`: Reference to users (email sender)
- `email_info_id`: Reference to email_info (from name and subject)
- `email_template_id`: Reference to email_templates (email content)
- `status`: Campaign status (draft, scheduled, running, completed, paused, failed)
- `scheduled_at`: When to start the campaign
- `total_recipients`: Total number of recipients
- `sent_count`, `failed_count`: Statistics
- `created_at`, `updated_at`, `started_at`, `completed_at`: Timestamps

### Campaign Recipients Table
Links campaigns to email recipients.

Fields:
- `id`: Primary key
- `campaign_id`: Reference to campaigns
- `email_data_id`: Reference to email_data (recipient)
- `status`: Recipient status (pending, sent, failed, skipped)
- `sent_at`: When the email was sent
- `error_message`: Error message if failed
- `created_at`: Timestamp

## API Endpoints

### Admin Users API (`/api/admin-users`)

#### Get All Admin Users
```
GET /api/admin-users
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "full_name": "Admin User",
      "role": "admin",
      "active": true,
      "created_at": "2026-02-07T...",
      "updated_at": "2026-02-07T..."
    }
  ],
  "count": 1
}
```

#### Get Active Admin Users
```
GET /api/admin-users/active
```

#### Get Admin User by ID
```
GET /api/admin-users/:id
```

#### Create Admin User
```
POST /api/admin-users
```

Body:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "full_name": "John Doe",
  "role": "manager"
}
```

#### Update Admin User
```
PUT /api/admin-users/:id
```

Body (all fields optional):
```json
{
  "username": "johndoe2",
  "email": "john2@example.com",
  "password": "NewPassword123",
  "full_name": "John Doe Jr",
  "role": "admin",
  "active": false
}
```

#### Delete Admin User
```
DELETE /api/admin-users/:id
```

---

### Campaigns API (`/api/campaigns`)

#### Get All Campaigns
```
GET /api/campaigns
```

Query Parameters:
- `status`: Filter by status (draft, scheduled, running, completed, paused, failed)
- `created_by`: Filter by admin user ID
- `limit`: Limit results (default: 100)
- `offset`: Offset for pagination (default: 0)

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Spring Sale Campaign",
      "description": "Promotional emails for spring sale",
      "created_by": 1,
      "creator_username": "admin",
      "user_id": 5,
      "sender_email": "sender@example.com",
      "email_info_id": 2,
      "from_name": "Spring Sales Team",
      "subject": "Exclusive Spring Sale - 50% Off!",
      "email_template_id": 3,
      "template_name": "Spring Sale Template",
      "status": "draft",
      "total_recipients": 1000,
      "sent_count": 0,
      "failed_count": 0,
      "created_at": "2026-02-07T...",
      "updated_at": "2026-02-07T..."
    }
  ],
  "count": 1
}
```

#### Get Campaign by ID
```
GET /api/campaigns/:id
```

Returns campaign details with recipient statistics.

#### Create Campaign
```
POST /api/campaigns
```

Body:
```json
{
  "name": "Spring Sale Campaign",
  "description": "Promotional emails for spring sale",
  "created_by": 1,
  "user_id": 5,
  "email_info_id": 2,
  "email_template_id": 3,
  "recipient_ids": [1, 2, 3, 4, 5],
  "scheduled_at": "2026-02-10T10:00:00Z"
}
```

Required fields:
- `name`: Campaign name (unique)

Optional fields:
- `description`: Campaign description
- `created_by`: Admin user ID who created the campaign
- `user_id`: User ID to send emails from
- `email_info_id`: Email info ID (from name and subject)
- `email_template_id`: Email template ID
- `recipient_ids`: Array of email_data IDs
- `scheduled_at`: When to execute the campaign

#### Update Campaign
```
PUT /api/campaigns/:id
```

Body (all fields optional):
```json
{
  "name": "Updated Campaign Name",
  "description": "Updated description",
  "user_id": 6,
  "email_info_id": 3,
  "email_template_id": 4,
  "status": "scheduled",
  "scheduled_at": "2026-02-12T14:00:00Z"
}
```

Note: Cannot update campaigns that are running or completed.

#### Delete Campaign
```
DELETE /api/campaigns/:id
```

Note: Cannot delete running campaigns. Pause them first.

#### Add Recipients to Campaign
```
POST /api/campaigns/:id/recipients
```

Body:
```json
{
  "recipient_ids": [10, 11, 12, 13]
}
```

Adds recipients to an existing campaign. Duplicates are skipped.

#### Get Campaign Recipients
```
GET /api/campaigns/:id/recipients
```

Query Parameters:
- `status`: Filter by status (pending, sent, failed, skipped)
- `limit`: Limit results (default: 100)
- `offset`: Offset for pagination (default: 0)

#### Execute Campaign
```
POST /api/campaigns/:id/execute
```

Body:
```json
{
  "provider": "gmail_api"
}
```

Providers:
- `gmail_api`: Send using Gmail API
- `smtp`: Send using SMTP

This endpoint starts the campaign execution in the background. The campaign status is updated to "running" immediately, and emails are sent asynchronously.

Requirements:
- Campaign must have a sender user
- Campaign must have email info
- Campaign must have an email template
- Campaign must have recipients
- Campaign cannot already be running or completed

#### Get Campaign Statistics
```
GET /api/campaigns/:id/stats
```

Response:
```json
{
  "success": true,
  "campaign": {
    "id": 1,
    "name": "Spring Sale Campaign",
    "status": "running",
    "created_at": "2026-02-07T...",
    "started_at": "2026-02-07T...",
    "completed_at": null
  },
  "statistics": {
    "total_recipients": 1000,
    "sent": 650,
    "failed": 10,
    "pending": 340,
    "skipped": 0,
    "success_rate": "65.00%"
  }
}
```

## Usage Workflow

### 1. Create Admin Users

First, create admin users who will manage campaigns:

```bash
curl -X POST http://localhost:3000/api/admin-users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "campaignmanager",
    "email": "manager@example.com",
    "password": "SecurePass123",
    "full_name": "Campaign Manager",
    "role": "manager"
  }'
```

### 2. Prepare Campaign Resources

Ensure you have:
- Email senders in the `users` table
- Email info (from name and subject) in `email_info` table
- Email templates in `email_templates` table
- Recipient emails in `email_data` table

### 3. Create a Campaign

```bash
curl -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "February Newsletter",
    "description": "Monthly newsletter for February",
    "created_by": 1,
    "user_id": 5,
    "email_info_id": 2,
    "email_template_id": 3
  }'
```

### 4. Add Recipients

```bash
curl -X POST http://localhost:3000/api/campaigns/1/recipients \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_ids": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  }'
```

### 5. Execute Campaign

```bash
curl -X POST http://localhost:3000/api/campaigns/1/execute \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gmail_api"
  }'
```

### 6. Monitor Progress

```bash
# Get campaign statistics
curl http://localhost:3000/api/campaigns/1/stats

# Get campaign details
curl http://localhost:3000/api/campaigns/1

# Get recipient details
curl http://localhost:3000/api/campaigns/1/recipients?status=sent
```

## Features

### Multiple Campaign Management
- Create unlimited campaigns with different configurations
- Each campaign can use different senders, subjects, and templates
- Run multiple campaigns simultaneously
- Track progress and statistics for each campaign

### Admin User Management
- Create admin users with different roles (admin, manager, operator)
- Each campaign tracks who created it
- Secure password storage with hashing

### Flexible Campaign Configuration
- Select any sender user from your database
- Choose from multiple email info configurations
- Pick from various email templates
- Add recipients dynamically

### Campaign Status Tracking
- Draft: Campaign is being prepared
- Scheduled: Campaign is scheduled for future execution
- Running: Campaign is currently sending emails
- Completed: Campaign finished successfully
- Paused: Campaign is temporarily paused
- Failed: Campaign encountered an error

### Bulk Sending
- Send emails to thousands of recipients
- Support for both Gmail API and SMTP
- Background processing for non-blocking execution
- Automatic logging of each email sent

### Statistics and Reporting
- Track total recipients, sent count, failed count
- Calculate success rates
- View detailed recipient status
- Monitor campaign progress in real-time

## Best Practices

1. **Create Admin Users First**: Set up admin users before creating campaigns to track who created each campaign.

2. **Test with Small Campaigns**: Start with a small number of recipients to test your configuration.

3. **Use Descriptive Names**: Give campaigns clear, descriptive names to easily identify them later.

4. **Monitor Progress**: Check campaign statistics regularly during execution.

5. **Handle Failures**: Review failed recipients and their error messages to troubleshoot issues.

6. **Schedule Wisely**: Use scheduled campaigns for off-peak hours to avoid rate limiting.

7. **Pause When Needed**: If issues arise, pause the campaign, fix the problem, and resume later.

## Security Considerations

1. **Password Hashing**: Admin user passwords are hashed using SHA-256.

2. **Validation**: All inputs are validated to prevent SQL injection and other attacks.

3. **Rate Limiting**: Campaigns include small delays between emails to avoid rate limiting.

4. **Credential Management**: Use the existing credentials table to securely store Google API credentials.

5. **Error Logging**: All errors are logged for troubleshooting and audit purposes.
