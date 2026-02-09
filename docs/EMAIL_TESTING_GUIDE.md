# Email Testing Guide

## Overview
This guide explains how to use the email testing functionality in GAdmin-Toolkit to verify email delivery and inbox placement.

## Prerequisites
- At least one user configured in the database (with email and password/credentials)
- Either SMTP credentials or Google API credentials configured
- Active email info and template (optional - can provide inline)

## Test Email Endpoint

### Endpoint
`POST /api/email-send/test-email`

### Purpose
Send a test email to verify that your email configuration is working correctly and to check inbox placement (vs spam folder).

### Request Body

```json
{
  "provider": "smtp",
  "test_email": "your-test@example.com",
  "from_name": "Test Sender",
  "subject": "Test Email Subject",
  "html_content": "<h1>Test Email</h1><p>This is a test email.</p>"
}
```

**Parameters:**
- `provider` (required): Either `"gmail_api"` or `"smtp"`
- `test_email` (required): The email address where you want to receive the test
- `from_name` (optional): Sender name (uses active email_info if not provided)
- `subject` (optional): Email subject (uses active email_info if not provided)
- `html_content` (optional): HTML content of email (uses active template if not provided)

### Response

**Success Response (200):**
```json
{
  "success": true,
  "message": "Test email sent successfully to test@example.com via smtp",
  "details": {
    "testId": 1707512345678,
    "provider": "smtp",
    "from": "Test Sender <sender@gmail.com>",
    "to": "test@example.com",
    "subject": "Test Email Subject",
    "sentAt": "2024-02-09T21:45:45.678Z"
  },
  "inboxVerification": {
    "note": "Please check your inbox/spam folder for the test email.",
    "tips": [
      "Check spam/junk folder if not in inbox",
      "Mark as 'Not Spam' to improve future deliverability",
      "Add sender to contacts for better inbox placement",
      "Check email headers for authentication results (SPF, DKIM, DMARC)"
    ],
    "testId": 1707512345678
  }
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "error": "Error message here",
  "details": "Additional error details"
}
```

## Using cURL

### Basic Test with Inline Content
```bash
curl -X POST http://localhost:3000/api/email-send/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "smtp",
    "test_email": "your-email@example.com",
    "from_name": "Test Sender",
    "subject": "Test Email",
    "html_content": "<h1>Hello</h1><p>This is a test email.</p>"
  }'
```

### Test Using Active Email Info/Template
```bash
curl -X POST http://localhost:3000/api/email-send/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gmail_api",
    "test_email": "your-email@example.com"
  }'
```

## Verifying Inbox Placement

### Step-by-Step Verification

1. **Send Test Email**
   - Use the test endpoint with your email address
   - Note the `testId` from the response

2. **Check Your Inbox**
   - Wait 1-2 minutes for email delivery
   - Check both inbox and spam/junk folders
   - Look for the email with the test subject

3. **Examine Email Headers**
   - Open the email and view full headers (varies by email client)
   - Look for authentication results:
     - **SPF**: Should show "pass"
     - **DKIM**: Should show "pass"
     - **DMARC**: Should show "pass"

4. **Check Spam Score**
   - Some email clients show spam scores in headers
   - Lower scores are better (typically < 5 is good)
   - Headers like `X-Spam-Score` or `X-Spam-Status`

5. **Review Email Logs**
   - Check the `email_logs` table for the test email entry
   - Query: `SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 5;`

### Gmail Specific Checks

For Gmail recipients, check these specific indicators:

1. **Gmail Categories**
   - Primary tab = best deliverability
   - Promotions tab = moderate deliverability
   - Spam folder = poor deliverability

2. **Authentication Icons**
   - Look for verification checkmarks in Gmail
   - Click "Show original" to see full headers

3. **Sender Authentication**
   - Ensure domain has proper SPF records
   - Set up DKIM signing
   - Configure DMARC policy

## Improving Deliverability

### If Email Lands in Spam

1. **Check Authentication**
   - Verify SPF, DKIM, and DMARC are configured
   - Use tools like MXToolbox to check DNS records

2. **Warm Up Sending Domain**
   - Start with small volumes
   - Gradually increase sending over time
   - Maintain consistent sending patterns

3. **Content Considerations**
   - Avoid spam trigger words
   - Don't use excessive exclamation marks
   - Include plain text alternative
   - Maintain reasonable text-to-image ratio

4. **Technical Setup**
   - Use dedicated IP address (for high volume)
   - Configure reverse DNS (PTR record)
   - Monitor blacklists regularly

5. **Engagement**
   - Send to engaged recipients
   - Remove inactive subscribers
   - Provide easy unsubscribe option

### Best Practices

1. **Regular Testing**
   - Test before each campaign
   - Test with different email providers (Gmail, Outlook, Yahoo)
   - Test on different devices (desktop, mobile)

2. **Monitor Metrics**
   - Track delivery rates
   - Monitor bounce rates
   - Watch spam complaint rates
   - Analyze open and click rates

3. **Maintain Sender Reputation**
   - Keep bounce rate < 2%
   - Keep spam complaint rate < 0.1%
   - Respond to feedback loops
   - Honor unsubscribe requests immediately

## Rate Limiting

The test email endpoint is rate-limited to prevent abuse:
- **Default**: 5 test emails per 10 minutes per IP address
- **Configurable**: Set `TEST_EMAIL_RATE_LIMIT` environment variable

If you hit the rate limit, wait a few minutes before trying again.

## Troubleshooting

### Common Issues

**"No users found in database"**
- Solution: Add at least one user to the `users` table with valid credentials

**"No active email info found"**
- Solution: Either provide inline `from_name` and `subject`, or create active email_info

**"No active email template found"**
- Solution: Either provide inline `html_content`, or create active email_template

**"Authentication failed"**
- Solution: Check SMTP password or Google API credentials
- For Gmail: Ensure "App Passwords" or "Less Secure Apps" is enabled

**"Connection timeout"**
- Solution: Check network connectivity and firewall rules
- Ensure port 587 (SMTP) or 443 (Gmail API) is open

### Getting Help

Check the following resources:
- Email logs: `GET /api/email-logs`
- Email sending status: `GET /api/email-send/status`
- Server logs: Check console output for errors
- Database logs: Query `email_logs` table directly

## Advanced Testing

### Testing Multiple Providers

Test both SMTP and Gmail API to compare deliverability:

```bash
# Test with SMTP
curl -X POST http://localhost:3000/api/email-send/test-email \
  -H "Content-Type: application/json" \
  -d '{"provider": "smtp", "test_email": "test@example.com"}'

# Test with Gmail API
curl -X POST http://localhost:3000/api/email-send/test-email \
  -H "Content-Type: application/json" \
  -d '{"provider": "gmail_api", "test_email": "test@example.com"}'
```

### Automated Testing

You can integrate test emails into your CI/CD pipeline:

```bash
#!/bin/bash
# test-email-delivery.sh

RESPONSE=$(curl -s -X POST http://localhost:3000/api/email-send/test-email \
  -H "Content-Type: application/json" \
  -d '{"provider": "smtp", "test_email": "test@example.com"}')

SUCCESS=$(echo $RESPONSE | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
  echo "✓ Test email sent successfully"
  exit 0
else
  echo "✗ Test email failed"
  echo $RESPONSE | jq .
  exit 1
fi
```

## Related Documentation

- [API Documentation](../main/api/API_DOCUMENTATION.md)
- [Quick Start Guide](../main/api/QUICKSTART.md)
- [Email Platforms Guide](EMAIL_PLATFORMS.md)
- [Scaling Guide](SCALING_GUIDE.md)
