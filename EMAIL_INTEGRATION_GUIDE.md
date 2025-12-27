# Email Sending Feature Integration Guide

## Quick Integration Test

This guide shows how to test the email sending features after deployment.

## Prerequisites

1. Backend server running on port 3001
2. Frontend running on port 3000
3. Google credentials configured (for SendAPI)
4. Valid authentication token

## Testing Single Email (API Method)

### Using cURL:

```bash
# Login first to get token
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.data.token')

# Send single email via Google API
curl -X POST http://localhost:3001/api/email/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "method": "api",
    "user": "sender@yourdomain.com",
    "recipient": "recipient@example.com",
    "from": "Test Sender",
    "subject": "Test Email",
    "htmlContent": "<html><body><h1>Test Email</h1><p>This is a test.</p></body></html>"
  }'
```

## Testing Single Email (SMTP Method)

```bash
curl -X POST http://localhost:3001/api/email/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "method": "smtp",
    "user": "sender@gmail.com",
    "password": "app_password_here",
    "recipient": "recipient@example.com",
    "from": "Test Sender",
    "subject": "Test Email via SMTP",
    "htmlContent": "<html><body><h1>Test Email</h1><p>This is a test via SMTP.</p></body></html>"
  }'
```

## Testing Bulk Email

### Step 1: Prepare CSV files

**users.csv:**
```csv
email,password
sender1@yourdomain.com,Password123@
sender2@yourdomain.com,Password123@
```

**recipients.csv:**
```csv
to
recipient1@example.com
recipient2@example.com
recipient3@example.com
```

### Step 2: Upload and Send

```bash
# Upload users
curl -X POST http://localhost:3001/api/email/upload-users \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@users.csv"

# Upload recipients
curl -X POST http://localhost:3001/api/email/upload-recipients \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@recipients.csv"

# Send bulk emails
curl -X POST http://localhost:3001/api/email/send-bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "method": "api",
    "users": [
      {"email": "sender1@yourdomain.com"},
      {"email": "sender2@yourdomain.com"}
    ],
    "recipients": [
      "recipient1@example.com",
      "recipient2@example.com",
      "recipient3@example.com"
    ],
    "from": "Bulk Sender",
    "subject": "Bulk Email Test",
    "htmlContent": "<html><body><h1>Bulk Email</h1><p>This is a bulk test.</p></body></html>"
  }'
```

## Testing Python Script

### Step 1: Prepare files in files/ directory

```bash
# Ensure these files exist:
# - files/working_smtp.csv (SMTP credentials)
# - files/data.csv (recipients)
# - files/info.csv (email metadata)
# - files/html.txt (HTML template)
```

**working_smtp.csv:**
```csv
smtp,port,email,password
smtp.gmail.com,587,sender@gmail.com,app_password_here
```

**data.csv:**
```csv
to
recipient1@example.com
recipient2@example.com
```

**info.csv:**
```csv
from,subject
Test Sender,Test Subject
```

**html.txt:**
```html
<html>
  <body>
    <h1>Test Email</h1>
    <p>This is a test email from Python script.</p>
  </body>
</html>
```

### Step 2: Execute Python script

```bash
curl -X POST http://localhost:3001/api/email/send-python \
  -H "Authorization: Bearer $TOKEN"
```

## Testing via Web Interface

1. Navigate to http://localhost:3000
2. Login with: admin / admin123
3. Click "Email Sending" in the navigation
4. Select a tab (Single, Bulk, or Python)
5. Fill in the form or upload CSV files
6. Click the send button

## Expected Results

### Single Email:
- Success response with method and recipient info
- Email delivered to recipient
- No errors in console

### Bulk Email:
- Success response with totalSent and totalFailed counts
- All emails distributed across sender accounts
- Rate limiting applied automatically

### Python Script:
- Success response with script output
- Emails sent according to CSV configuration
- Log file created with results

## Troubleshooting

### Error: "Google credentials not configured"
- Verify cred.json exists in backend/config/
- Check service account permissions
- Ensure Gmail API is enabled

### Error: "Failed to authorize with Google"
- Check domain-wide delegation
- Verify user email exists in Google Workspace
- Review service account configuration

### Error: "SMTP connection failed"
- Verify SMTP server and port
- Check username and password
- For Gmail, use App Password, not account password

### Error: "401 Unauthorized"
- Token expired or invalid
- Login again to get fresh token
- Check Authorization header format

## Performance Notes

### SendAPI Method:
- Up to 300 emails per sender account per batch
- 50ms delay between emails
- Best for high-volume sending with Google Workspace

### SMTP Method:
- Up to 20 emails per sender account per batch
- 50ms delay between emails
- Best for smaller volumes or external SMTP

### Python Script:
- Uses threading for parallel sending
- Configurable batch sizes
- Suitable for legacy workflows

## Security Considerations

1. **Always use HTTPS in production**
2. **Store credentials securely** (never commit to git)
3. **Use App Passwords** for Gmail SMTP (not account passwords)
4. **Monitor sending limits** to avoid quota exhaustion
5. **Validate email addresses** before sending
6. **Implement bounce handling** for production use

## Next Steps

1. Test with small batches first
2. Monitor email delivery rates
3. Configure email templates
4. Set up monitoring and logging
5. Implement error notifications
6. Add email scheduling if needed

## Support

For issues or questions:
- Check EMAIL_FEATURE.md for detailed documentation
- Review server logs for error details
- Ensure all dependencies are installed
- Verify Google Workspace configuration
