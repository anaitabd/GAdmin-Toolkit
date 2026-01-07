# GAdmin Toolkit - Backend API

A fully functional backend API with admin authentication and NoSQL database for Google Workspace automation toolkit.

## Features

- ✅ Admin-only authentication with JWT
- ✅ MongoDB NoSQL database integration
- ✅ RESTful API endpoints
- ✅ User generation and management
- ✅ Email sending via Gmail API and SMTP
- ✅ Bounce email detection
- ✅ Email logging and tracking
- ✅ Secure password hashing with bcrypt
- ✅ CORS enabled for cross-origin requests

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Google Workspace credentials (cred.json)
- Google Admin API access

## Setup

### 1. Install Dependencies

```bash
cd main
npm install
```

### 2. Configure Environment

Create a `.env` file in the `main/api` directory:

```bash
cp .env.example .env
```

Edit `.env` and set your configuration:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A long, random secret key for JWT tokens
- `GOOGLE_ADMIN_USER`: Your Google Workspace admin email

### 3. Setup MongoDB

Start MongoDB locally or use a cloud service like MongoDB Atlas.

For local MongoDB:
```bash
mongod --dbpath /path/to/data
```

### 4. Setup Admin User

First time setup - create an admin user:

```bash
curl -X POST http://localhost:3000/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "YourSecurePassword123!"
  }'
```

**Important**: This endpoint should only be used once. Consider disabling it in production.

### 5. Start the Server

```bash
# Development mode
cd main/api
node server.js

# Or with nodemon for auto-reload
npx nodemon server.js
```

The server will start on `http://localhost:3000` (or the port specified in `.env`)

## API Documentation

### Authentication

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "YourSecurePassword123!"
}

Response:
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "admin",
    "role": "admin"
  }
}
```

#### Change Password
```bash
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

### User Management

All user endpoints require authentication (Authorization: Bearer <token>)

#### Generate User List
```bash
POST /api/users/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "domain": "yourdomain.com",
  "numRecords": 100
}
```

#### Create Google Workspace Users
```bash
POST /api/users/create
Authorization: Bearer <token>
```

Creates users from the generated list in Google Workspace.

#### Delete Google Workspace Users
```bash
DELETE /api/users/delete
Authorization: Bearer <token>
```

Deletes all users except the admin from Google Workspace.

#### Get Generated Users
```bash
GET /api/users?page=1&limit=50
Authorization: Bearer <token>
```

### Email Management

All email endpoints require authentication (Authorization: Bearer <token>)

#### Send Email via Gmail API
```bash
POST /api/emails/send-api
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipients": ["user1@example.com", "user2@example.com"],
  "from": "Your Name",
  "subject": "Email Subject",
  "htmlContent": "<h1>Email Body</h1>"
}
```

#### Send Email via SMTP
```bash
POST /api/emails/send-smtp
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipients": ["user1@example.com", "user2@example.com"],
  "from": "Your Name",
  "subject": "Email Subject",
  "htmlContent": "<h1>Email Body</h1>"
}
```

#### Get Bounced Emails
```bash
GET /api/emails/bounced
Authorization: Bearer <token>
```

#### Get Email Logs
```bash
GET /api/emails/logs?page=1&limit=50
Authorization: Bearer <token>
```

### Health Check

```bash
GET /health

Response:
{
  "status": "ok",
  "message": "Server is running"
}
```

## Database Collections

### admin
Stores admin user credentials
- username (unique)
- password (hashed)
- role
- createdAt
- lastLogin

### generated_users
Stores generated user data
- email
- password
- givenName
- familyName
- googleCreated
- createdAt

### email_logs
Stores email sending logs
- user
- to
- from
- subject
- method (gmail_api or smtp)
- status
- timestamp

### bounced_emails
Stores bounced email addresses
- email (unique)
- user
- timestamp

## Security Notes

1. **Always change the JWT_SECRET** in production to a long, random string
2. **Use HTTPS** in production
3. **Disable the /api/auth/setup endpoint** after initial setup
4. **Store credentials securely** - never commit .env or cred.json to git
5. **Use strong passwords** for admin accounts
6. **Regularly rotate credentials** and API keys
7. **Monitor logs** for suspicious activity

## Error Handling

The API returns standard HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error

Error responses have the format:
```json
{
  "error": "Error message description"
}
```

## Development

### Project Structure
```
main/api/
├── config/
│   └── database.js          # MongoDB connection
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── userController.js    # User management logic
│   └── emailController.js   # Email operations logic
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── routes/
│   ├── auth.js              # Auth routes
│   ├── users.js             # User routes
│   └── emails.js            # Email routes
├── server.js                # Main application entry point
├── .env                     # Environment configuration (not in git)
└── .env.example             # Example environment file
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check MONGODB_URI in .env
- Verify network connectivity

### Authentication Errors
- Verify JWT_SECRET is set in .env
- Check token expiration
- Ensure Authorization header format: "Bearer <token>"

### Google API Errors
- Verify cred.json is in the main/api directory
- Check Google Admin API is enabled
- Ensure proper scopes are granted

## License

MIT License - See LICENSE file for details
