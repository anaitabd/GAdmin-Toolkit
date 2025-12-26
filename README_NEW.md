# Google Workspace Automation Toolkit - Web Application

A modern, secure web application for managing Google Workspace users with a REST API backend and React frontend.

## 🚀 Features

- **Web-based Admin Dashboard** - Modern React UI for managing Google Workspace users
- **RESTful API** - Secure backend API built with Node.js and Express
- **User Management** - Create, list, and delete users through an intuitive interface
- **Bulk Operations** - Generate random users or upload CSV files for batch creation
- **Authentication** - JWT-based authentication system
- **Real-time Updates** - Live feedback on operations
- **Secure** - Rate limiting, input validation, and security headers

---

## 📁 Project Structure

```
.
├── backend/                 # Backend API Server
│   ├── server.js           # Main server file
│   ├── routes/             # API route handlers
│   │   ├── auth.js         # Authentication routes
│   │   ├── users.js        # User management routes
│   │   └── status.js       # Operation status tracking
│   ├── services/           # Business logic
│   │   └── googleWorkspace.js
│   ├── middleware/         # Express middleware
│   │   ├── auth.js         # JWT authentication
│   │   └── validator.js    # Request validation
│   ├── config/             # Configuration files
│   ├── package.json
│   └── .env.example
│
├── frontend/               # React Frontend Application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   ├── store/          # State management (Zustand)
│   │   ├── App.jsx         # Main App component
│   │   └── main.jsx        # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── main/                   # Legacy CLI scripts (deprecated)
├── py/                     # Python automation scripts
├── files/                  # Data files (CSV, templates)
└── README.md
```

---

## ⚙️ Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Workspace Admin account
- Google Cloud Project with Admin SDK enabled

### 1. Google Cloud Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the **Admin SDK API**
3. Create a Service Account
4. Download the service account credentials as `cred.json`
5. Enable Domain-Wide Delegation for the service account
6. Add the following OAuth scope in Google Workspace Admin:
   - `https://www.googleapis.com/auth/admin.directory.user`

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env file with your configuration
# Set your Google Admin email and credentials path
nano .env

# Create config directory and add credentials
mkdir -p config
cp /path/to/your/cred.json config/cred.json

# Start the backend server
npm run dev
```

The backend API will be available at `http://localhost:3001`

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

---

## 🔐 Default Credentials

**Username:** admin  
**Password:** admin123

⚠️ **Important:** Change these credentials in production!

To change the admin password, update the hashed password in `backend/routes/auth.js`:

```javascript
// Generate new hash
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('your-new-password', 10);
console.log(hash);
```

---

## 📖 API Documentation

### Authentication

**POST** `/api/auth/login`
- Login with username and password
- Returns JWT token

**GET** `/api/auth/verify`
- Verify JWT token validity

### User Management

**GET** `/api/users`
- List all Google Workspace users
- Query params: `maxResults`, `pageToken`, `orderBy`

**POST** `/api/users`
- Create a single user
- Body: `{ email, password, givenName, familyName }`

**POST** `/api/users/bulk`
- Create multiple users
- Body: `{ users: [...] }`

**POST** `/api/users/upload`
- Upload CSV file to create users
- Form data with file field

**POST** `/api/users/generate`
- Generate random users
- Body: `{ domain, count }`

**DELETE** `/api/users/:userKey`
- Delete a specific user

**DELETE** `/api/users`
- Delete all users (except admin)

All endpoints (except auth) require `Authorization: Bearer <token>` header.

---

## 🎯 Usage

### Web Interface

1. Open `http://localhost:3000` in your browser
2. Login with admin credentials
3. Use the dashboard to:
   - **List Users** - View all Google Workspace users
   - **Create User** - Add a single user
   - **Generate Users** - Create random users for testing
   - **Upload CSV** - Bulk create users from CSV file

### CSV Format

For bulk user creation, use this CSV format:

```csv
email,password,givenName,familyName
john.doe@example.com,Password123@,John,Doe
jane.smith@example.com,Password123@,Jane,Smith
```

### API Usage

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# List users
curl -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer <your-token>"

# Create user
curl -X POST http://localhost:3001/api/users \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"Password123@",
    "givenName":"Test",
    "familyName":"User"
  }'
```

---

## 🏭 Production Deployment

### Backend

1. Set `NODE_ENV=production` in `.env`
2. Update `JWT_SECRET` with a strong random string
3. Configure `GOOGLE_ADMIN_EMAIL` and credentials
4. Use a process manager like PM2:

```bash
npm install -g pm2
pm2 start server.js --name gadmin-backend
```

### Frontend

1. Build the production bundle:

```bash
cd frontend
npm run build
```

2. Serve the `dist` folder with a web server (nginx, Apache, etc.)

### Docker (Optional)

```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --production
COPY backend/ ./
CMD ["node", "server.js"]
```

---

## 🛡️ Security Features

- **JWT Authentication** - Secure token-based auth
- **Rate Limiting** - Prevents API abuse
- **Input Validation** - Using Joi schemas
- **CORS Protection** - Configured origins
- **Helmet.js** - Security headers
- **Password Hashing** - bcrypt for passwords
- **File Upload Limits** - Prevents large file attacks

---

## 🔧 Configuration

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | Token expiration | `24h` |
| `GOOGLE_ADMIN_EMAIL` | Google Workspace admin email | - |
| `GOOGLE_CREDENTIALS_PATH` | Path to cred.json | `./config/cred.json` |

---

## 🧪 Development

### Backend

```bash
cd backend
npm run dev  # Start with nodemon for auto-reload
```

### Frontend

```bash
cd frontend
npm run dev  # Start Vite dev server
```

---

## 📄 Migration from CLI

The original CLI scripts are still available in the `main/` and `py/` directories for backward compatibility. However, we recommend using the new web interface for better user experience and security.

To migrate:
1. All CLI functionality is now available through the web UI
2. API endpoints provide programmatic access
3. CSV files can be uploaded through the web interface
4. Python scripts can be integrated via the API

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**
- Check if `cred.json` exists in `backend/config/`
- Verify `.env` file is properly configured
- Ensure port 3001 is not in use

**Frontend can't connect to API:**
- Verify backend is running on port 3001
- Check CORS configuration in backend
- Ensure token is stored in localStorage

**Google API errors:**
- Verify service account has domain-wide delegation
- Check OAuth scopes are properly configured
- Ensure admin email is correct in `.env`

---

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the API documentation

---

## 🎉 Acknowledgments

Built with:
- Express.js - Backend framework
- React - Frontend library
- Google APIs - Workspace integration
- Vite - Build tool
- Zustand - State management
