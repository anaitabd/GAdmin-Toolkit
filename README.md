# 🚀 Google Workspace Automation Toolkit - Web Application

A modern, secure, and scalable web application for automating Google Workspace user management. Transform your CLI-based workflow into a beautiful web dashboard with REST APIs, authentication, and real-time monitoring.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-18+-green.svg)
![React](https://img.shields.io/badge/react-18+-blue.svg)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Development](#-development)
- [Deployment](#-deployment)
- [Migration Guide](#-migration-guide-cli--web)
- [Security](#-security)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

This project has been transformed from a CLI-based automation toolkit into a **production-ready web application** featuring:

- **Backend API** - RESTful API built with Node.js + Express
- **Frontend Dashboard** - Modern React UI with Tailwind CSS
- **Authentication** - JWT-based security with role-based access
- **Google Workspace Integration** - Seamless user management
- **Docker Support** - Easy deployment with Docker Compose

### What's New? 🆕

- ✅ Web-based dashboard replacing CLI scripts
- ✅ Secure REST API with JWT authentication
- ✅ Role-based access control (admin only)
- ✅ Real-time statistics and charts
- ✅ CSV import/export functionality
- ✅ Dark mode support
- ✅ Responsive design for all devices
- ✅ Comprehensive logging and audit trails
- ✅ Rate limiting and security headers
- ✅ Docker containerization

---

## ✨ Features

### Backend Features
- 🔐 **JWT Authentication** - Secure token-based auth
- 👥 **User Management** - Create, delete, list Google Workspace users
- 📊 **CSV Operations** - Import/export user data
- 🔄 **Bulk Operations** - Generate and manage users in bulk
- 📝 **Logging** - Winston-based logging with audit trails
- 🛡️ **Security** - Helmet, CORS, rate limiting, input validation
- 📚 **API Documentation** - Swagger/OpenAPI specs
- 🐍 **Python Integration** - Execute existing Python scripts via API

### Frontend Features
- 🎨 **Modern UI** - Beautiful interface with Tailwind CSS
- 🌓 **Dark Mode** - Toggle between light and dark themes
- 📱 **Responsive** - Works on desktop, tablet, and mobile
- 📈 **Charts & Stats** - Real-time dashboard visualizations
- 🔍 **Search & Filter** - Quick user lookup
- 📤 **File Upload** - Drag & drop CSV import
- 🔔 **Notifications** - Toast messages for user feedback
- ⚡ **Fast** - Built with Vite for instant HMR

---

## 🏗️ Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│    Frontend     │◄───────►│   Backend API   │◄───────►│  Google APIs    │
│  (React + Vite) │  HTTPS  │ (Express + JWT) │  OAuth  │   Workspace     │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
                                     │
                                     │
                                     ▼
                            ┌─────────────────┐
                            │                 │
                            │  Python Scripts │
                            │   (Optional)    │
                            │                 │
                            └─────────────────┘
```

### Technology Stack

**Backend:**
- Node.js 18+
- Express.js (Web framework)
- JWT (Authentication)
- Google APIs (Workspace integration)
- Winston (Logging)
- Swagger (API docs)

**Frontend:**
- React 18
- Vite (Build tool)
- Tailwind CSS (Styling)
- Zustand (State management)
- Recharts (Data visualization)
- React Router (Navigation)

**Infrastructure:**
- Docker & Docker Compose
- Nginx (Production web server)
- Redis (Optional job queue)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (optional)
- Google Workspace Admin account
- Google Service Account with domain-wide delegation

### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone the repository
git clone <repository-url>
cd GAdmin-Toolkit

# 2. Add Google credentials
cp your-cred.json main/api/cred.json

# 3. Configure environment
cp .env.docker.example .env
# Edit .env with your settings

# 4. Start all services
docker-compose up -d

# 5. Access the application
# Frontend: http://localhost
# Backend API: http://localhost:5000
# API Docs: http://localhost:5000/api-docs
```

### Option 2: Local Development

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your settings
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Default Login Credentials

```
Username: admin
Password: admin123
```

⚠️ **Change these immediately in production!**

---

## 📁 Project Structure

```
GAdmin-Toolkit/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── models/         # Data models
│   │   ├── utils/          # Helper functions
│   │   ├── workers/        # Background jobs
│   │   └── server.js       # Entry point
│   ├── logs/               # Application logs
│   ├── uploads/            # Uploaded files
│   ├── Dockerfile
│   ├── package.json
│   └── README.md
├── frontend/               # Frontend web app
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── context/       # State management
│   │   ├── utils/         # Helper functions
│   │   ├── App.jsx        # Main app
│   │   └── main.jsx       # Entry point
│   ├── public/            # Static assets
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── README.md
├── main/                  # Legacy Node.js scripts
│   └── api/
│       └── cred.json      # Google credentials
├── py/                    # Python automation scripts
├── files/                 # CSV data files
├── docker-compose.yml     # Docker orchestration
├── API_CONTRACT.md        # API documentation
└── README.md              # This file
```

---

## ⚙️ Configuration

### Backend Configuration

Create `backend/.env` from `backend/.env.example`:

```env
# Server
NODE_ENV=production
PORT=5000
HOST=localhost

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRE=7d

# Google Workspace
GOOGLE_ADMIN_EMAIL=admin@yourdomain.com
GOOGLE_CREDENTIALS_PATH=./config/cred.json

# CORS
CORS_ORIGIN=http://localhost:3000

# Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-this-password
```

### Frontend Configuration

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### Google Service Account Setup

1. Create a service account in Google Cloud Console
2. Enable Admin SDK API
3. Configure domain-wide delegation
4. Download credentials as `cred.json`
5. Place in `main/api/cred.json`

---

## 📚 API Documentation

### Interactive Documentation

Swagger UI available at: `http://localhost:5000/api-docs`

### Key Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Login and get token | No |
| POST | `/api/users/generate` | Generate users | Yes |
| POST | `/api/users/create` | Create users from CSV | Yes |
| POST | `/api/users/create-single` | Create single user | Yes |
| DELETE | `/api/users/:userKey` | Delete user | Yes |
| DELETE | `/api/users/delete-all` | Delete all users | Yes |
| GET | `/api/users/list` | List all users | Yes |
| POST | `/api/users/import-csv` | Import CSV | Yes |

See [API_CONTRACT.md](API_CONTRACT.md) for complete API documentation.

---

## 💻 Development

### Backend Development

```bash
cd backend
npm install
npm run dev  # Starts with nodemon
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev  # Starts Vite dev server
```

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Code Style

```bash
# Lint backend
cd backend
npm run lint

# Lint frontend
cd frontend
npm run lint
```

---

## 🚢 Deployment

### Production Build

**Backend:**
```bash
cd backend
npm install --production
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve dist/ with nginx or any static server
```

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Environment Variables

Set these in production:
- `NODE_ENV=production`
- `JWT_SECRET` - Strong random string
- `GOOGLE_ADMIN_EMAIL` - Your admin email
- `CORS_ORIGIN` - Your frontend URL

---

## 🔄 Migration Guide: CLI → Web

### Before (CLI)

```bash
# Generate users
node main/api/generate.js example.com 100

# Create users
node main/api/create.js

# Delete users
node main/api/delete.js
```

### After (Web API)

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Generate users
curl -X POST http://localhost:5000/api/users/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"domain":"example.com","count":100}'

# Create users
curl -X POST http://localhost:5000/api/users/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"csvPath":"/path/to/user_list.csv"}'
```

### Legacy Scripts

Original CLI scripts are preserved in `main/` and `py/` directories and can still be used directly if needed.

---

## 🔒 Security

### Security Features

- ✅ JWT authentication
- ✅ Password hashing with bcrypt
- ✅ Rate limiting (100 requests/15min)
- ✅ Helmet security headers
- ✅ CORS protection
- ✅ Input validation & sanitization
- ✅ Audit logging
- ✅ Environment variable secrets

### Security Best Practices

1. **Change default credentials immediately**
2. **Use strong JWT_SECRET** (generate with `openssl rand -base64 32`)
3. **Enable HTTPS in production**
4. **Regularly update dependencies**
5. **Review audit logs**
6. **Restrict CORS origins**
7. **Use environment variables for secrets**

---

## 🐛 Troubleshooting

### Common Issues

**"Cannot connect to backend"**
```bash
# Check if backend is running
curl http://localhost:5000/health

# Check backend logs
docker-compose logs backend
```

**"Google credentials not found"**
```bash
# Ensure cred.json exists
ls -la main/api/cred.json

# Check file permissions
chmod 600 main/api/cred.json
```

**"Token expired"**
- Login again to get a new token
- Token expires after 7 days by default

**"CORS error"**
- Check CORS_ORIGIN in backend/.env
- Ensure frontend URL matches

### Debug Mode

```bash
# Enable debug logging
NODE_ENV=development npm run dev

# View detailed logs
tail -f backend/logs/app.log
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linters
6. Submit a pull request

### Code Style

- Follow existing code style
- Use meaningful variable names
- Add comments for complex logic
- Write clean, readable code

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

For issues and questions:
- 📧 Open an issue on GitHub
- 📖 Check the [API documentation](API_CONTRACT.md)
- 📚 Read the backend/frontend READMEs

---

## 🙏 Acknowledgments

- Google Workspace Admin SDK
- Express.js community
- React community
- All contributors

---

## 📈 Roadmap

- [ ] Add more Python script integrations
- [ ] Implement WebSocket for real-time updates
- [ ] Add user profile management
- [ ] Implement email notification system
- [ ] Add data export in multiple formats
- [ ] Create mobile app
- [ ] Add multi-language support

---

**Built with ❤️ by the GAdmin Toolkit team**
