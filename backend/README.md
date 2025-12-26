# Backend API - Google Workspace Automation Toolkit

A secure REST API backend for managing Google Workspace users with authentication, role-based access control, and comprehensive logging.

## 🏗️ Architecture

This backend follows a clean MVC architecture:

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── index.js     # Central config
│   │   └── logger.js    # Winston logger setup
│   ├── controllers/     # Request handlers
│   │   ├── authController.js
│   │   └── userController.js
│   ├── services/        # Business logic
│   │   ├── authService.js
│   │   └── userService.js
│   ├── middleware/      # Express middleware
│   │   ├── auth.js
│   │   ├── validator.js
│   │   └── errorHandler.js
│   ├── routes/          # API routes
│   │   ├── authRoutes.js
│   │   └── userRoutes.js
│   ├── models/          # Data models (future)
│   ├── utils/           # Helper functions (future)
│   ├── workers/         # Background jobs (future)
│   └── server.js        # Express app entry point
├── logs/                # Application logs
├── uploads/             # Uploaded files
├── .env.example         # Environment variables template
├── Dockerfile           # Docker configuration
├── package.json
└── README.md
```

## 🚀 Features

- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **Role-Based Access Control** - Admin and user roles
- ✅ **Google Workspace Integration** - Create, delete, and manage users
- ✅ **CSV Import/Export** - Bulk user operations
- ✅ **Rate Limiting** - Prevent API abuse
- ✅ **Comprehensive Logging** - Winston-based logging with audit trail
- ✅ **Input Validation** - Express-validator for request validation
- ✅ **API Documentation** - Swagger/OpenAPI documentation
- ✅ **Security Headers** - Helmet middleware for security
- ✅ **CORS Support** - Configurable cross-origin requests

## 📋 Prerequisites

- Node.js 18+ or Docker
- Google Workspace Admin account
- Google Service Account credentials (`cred.json`)
- Redis (optional, for job queue)

## 🔧 Installation

### Local Development

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Add Google credentials:**
   - Place your `cred.json` file in `../main/api/cred.json` or update `GOOGLE_CREDENTIALS_PATH` in `.env`

4. **Start the server:**
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

### Docker Deployment

```bash
docker build -t gadmin-toolkit-backend .
docker run -p 5000:5000 --env-file .env gadmin-toolkit-backend
```

## 🔑 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | Login and get JWT token | No |
| POST | `/api/auth/register` | Register new user | Yes (Admin) |
| GET | `/api/auth/me` | Get current user info | Yes |
| POST | `/api/auth/verify` | Verify JWT token | No |

### User Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/users/generate` | Generate random user data | Yes (Admin) |
| POST | `/api/users/create` | Create users from CSV | Yes (Admin) |
| POST | `/api/users/create-single` | Create a single user | Yes (Admin) |
| DELETE | `/api/users/:userKey` | Delete a user | Yes (Admin) |
| DELETE | `/api/users/delete-all` | Delete all users (except admin) | Yes (Admin) |
| GET | `/api/users/list` | List all users | Yes (Admin) |
| POST | `/api/users/import-csv` | Import CSV and create users | Yes (Admin) |

### Documentation

- **Swagger UI:** `http://localhost:5000/api-docs`
- **Health Check:** `http://localhost:5000/health`

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```bash
Authorization: Bearer <your_jwt_token>
```

### Login Example

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### Using Token

```bash
curl -X GET http://localhost:5000/api/users/list \
  -H "Authorization: Bearer <your_jwt_token>"
```

## 🛡️ Security Features

1. **JWT Tokens** - Secure, stateless authentication
2. **bcrypt** - Password hashing with salt
3. **Helmet** - Security headers
4. **Rate Limiting** - Prevent brute force attacks
5. **Input Validation** - Sanitize and validate all inputs
6. **CORS** - Configurable cross-origin policy
7. **Audit Logging** - Track all security events
8. **Environment Variables** - Sensitive data in .env

## 📊 Logging

Logs are stored in the `logs/` directory:

- `app.log` - General application logs
- `error.log` - Error logs only
- `audit.log` - Security and audit events

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## 🌍 Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `JWT_SECRET` - Secret key for JWT signing
- `GOOGLE_ADMIN_EMAIL` - Google Workspace admin email
- `GOOGLE_CREDENTIALS_PATH` - Path to Google credentials file
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)

## 📝 API Examples

### Generate Users

```bash
curl -X POST http://localhost:5000/api/users/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "count": 50
  }'
```

### Create Single User

```bash
curl -X POST http://localhost:5000/api/users/create-single \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Import CSV

```bash
curl -X POST http://localhost:5000/api/users/import-csv \
  -H "Authorization: Bearer <token>" \
  -F "file=@users.csv"
```

## 🐛 Troubleshooting

**Issue:** "Google credentials not configured"
- Ensure `cred.json` is in the correct location
- Check `GOOGLE_CREDENTIALS_PATH` in `.env`

**Issue:** "Cannot authorize with Google"
- Verify service account has domain-wide delegation enabled
- Check `GOOGLE_ADMIN_EMAIL` is correct

**Issue:** "Token expired"
- Login again to get a new token
- Adjust `JWT_EXPIRE` in `.env` for longer sessions

## 📚 Additional Resources

- [Google Admin SDK](https://developers.google.com/admin-sdk)
- [Express.js Documentation](https://expressjs.com/)
- [JWT Best Practices](https://auth0.com/docs/secure/tokens/json-web-tokens)

## 🤝 Contributing

Contributions are welcome! Please ensure:
- Code follows existing style
- All tests pass
- Security best practices are followed

## 📄 License

MIT License - See LICENSE file for details
