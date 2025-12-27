# Email Sending Feature Documentation

## Overview

The GAdmin Toolkit now includes a comprehensive email sending feature that integrates the existing `sendApi.js` and `smtp.js` functionality from the `main/api` directory and the Python `send.py` script into the web application.

## Features

### 1. Single Email Sending
Send individual emails using either:
- **Google API (SendAPI)**: Uses Google Workspace API with service account credentials
- **SMTP**: Direct SMTP connection using nodemailer

### 2. Bulk Email Sending
Send emails to multiple recipients using multiple sender accounts with:
- CSV file upload for users (email senders)
- CSV file upload for recipients
- Rate limiting and distributed sending across multiple accounts
- Configurable sending method (API or SMTP)

### 3. Python Script Integration
Execute the existing Python email sending script directly from the web interface. This script uses:
- `files/working_smtp.csv` - SMTP credentials
- `files/data.csv` - Recipients list
- `files/info.csv` - Email metadata (from, subject)
- `files/html.txt` - Email HTML template

## API Endpoints

### POST /api/email/send
Send a single email.

**Request Body:**
```json
{
  "method": "api|smtp",
  "user": "sender@example.com",
  "password": "password (required for SMTP)",
  "recipient": "recipient@example.com",
  "from": "Sender Name",
  "subject": "Email Subject",
  "htmlContent": "<html>...</html>"
}
```

### POST /api/email/send-bulk
Send bulk emails to multiple recipients.

**Request Body:**
```json
{
  "method": "api|smtp",
  "users": [
    {"email": "sender1@example.com", "password": "pass1"},
    {"email": "sender2@example.com", "password": "pass2"}
  ],
  "recipients": ["recipient1@example.com", "recipient2@example.com"],
  "from": "Sender Name",
  "subject": "Email Subject",
  "htmlContent": "<html>...</html>"
}
```

### POST /api/email/send-python
Execute the Python email sending script.

### POST /api/email/upload-recipients
Upload a CSV file with recipient emails.

**CSV Format:**
```
to
recipient1@example.com
recipient2@example.com
```

### POST /api/email/upload-users
Upload a CSV file with sender credentials.

**CSV Format:**
```
email,password
sender1@example.com,password1
sender2@example.com,password2
```

## Frontend Usage

### Accessing the Email Sending Page
1. Log in to the web application
2. Click "Email Sending" in the navigation bar
3. Choose from three tabs:
   - **Single Email**: Send one email at a time
   - **Bulk Email**: Send emails to multiple recipients
   - **Python Script**: Execute the Python sending script

### Single Email Tab
1. Select sending method (API or SMTP)
2. Enter sender email and password (if using SMTP)
3. Enter recipient email
4. Provide sender name, subject, and HTML content
5. Click "Send Email"

### Bulk Email Tab
1. Upload users CSV file (sender accounts)
2. Upload recipients CSV file (destination emails)
3. Select sending method
4. Enter sender name, subject, and HTML content
5. Click "Send Bulk Emails"

The system will automatically:
- Distribute emails across available sender accounts
- Apply rate limiting (300 emails per account for API, 20 for SMTP)
- Track successful and failed sends
- Display a summary when complete

### Python Script Tab
1. Ensure CSV files are present in the `files/` directory:
   - `working_smtp.csv`
   - `data.csv`
   - `info.csv`
   - `html.txt`
2. Click "Execute Python Script"
3. The script will run and display results

## Configuration

### Backend Dependencies
The following packages are required (already added to package.json):
- `nodemailer`: ^6.9.13 - SMTP email sending
- `axios`: ^1.6.8 - HTTP client for API calls

### Google API Credentials
For SendAPI functionality, ensure:
- Google service account credentials are configured in `backend/config/cred.json`
- Service account has domain-wide delegation enabled
- Gmail API is enabled for the domain

### Environment Variables
No additional environment variables are required beyond the existing Google Workspace configuration.

## Rate Limiting

### SendAPI Method
- 300 emails per sender account per batch
- 50ms delay between emails
- Automatic distribution across multiple sender accounts

### SMTP Method
- 20 emails per sender account per batch
- 50ms delay between emails
- Automatic distribution across multiple sender accounts

## Security Considerations

1. **Authentication Required**: All email endpoints require JWT authentication
2. **File Upload Validation**: CSV files are validated and sanitized
3. **Temporary File Cleanup**: Uploaded files are automatically deleted after processing
4. **Password Handling**: Passwords are transmitted securely over HTTPS
5. **Rate Limiting**: Global API rate limits protect against abuse

## Error Handling

The system provides detailed error messages for common issues:
- Invalid email addresses
- Authentication failures
- Missing required fields
- Google API quota exceeded
- SMTP connection failures
- File upload errors

## Troubleshooting

### "Google credentials not configured" Error
- Verify `cred.json` exists in `backend/config/`
- Check file permissions
- Ensure credentials are valid

### "Failed to authorize with Google" Error
- Verify service account has domain-wide delegation
- Check that the user email exists in Google Workspace
- Ensure Gmail API is enabled

### "SMTP connection failed" Error
- Verify SMTP server and port are correct
- Check username and password
- Ensure less secure app access is enabled (if using Gmail)

### Python Script Fails
- Check that Python 3 is installed
- Verify required Python packages are installed (`pip install -r py/requirement.txt`)
- Ensure CSV files exist in the `files/` directory
- Check file permissions

## Testing

To test the email sending functionality:

1. **Test Single Email**:
   - Use a test sender and recipient email
   - Verify email delivery
   - Check console logs for any errors

2. **Test Bulk Email**:
   - Create small test CSV files (2-3 entries each)
   - Upload and send
   - Verify all emails are delivered
   - Check the success/failure summary

3. **Test Python Script**:
   - Prepare test CSV files in `files/` directory
   - Execute from the web interface
   - Monitor console output

## Future Enhancements

Potential improvements for future versions:
- Email template management
- Scheduled sending
- Email analytics and reporting
- Bounce handling
- Unsubscribe management
- Email verification before sending
- Progress tracking for long-running bulk sends
- Email queue management
