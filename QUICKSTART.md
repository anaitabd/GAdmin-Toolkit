# 🚀 Quick Start Guide

Get up and running with GAdmin Toolkit in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Docker & Docker Compose (optional but recommended)
- Google Workspace Admin account
- Google Service Account credentials (`cred.json`)

---

## Option 1: Docker Compose (Fastest) ⚡

### Step 1: Clone and Navigate
```bash
git clone <repository-url>
cd GAdmin-Toolkit
```

### Step 2: Add Google Credentials
```bash
# Place your Google service account credentials
cp /path/to/your/cred.json main/api/cred.json
```

### Step 3: Configure Environment
```bash
# Copy and edit Docker environment
cp .env.docker.example .env

# Edit with your details:
nano .env
# or
code .env
```

Important settings:
```env
JWT_SECRET=your-super-secret-key-change-this
GOOGLE_ADMIN_EMAIL=admin@yourdomain.com
```

### Step 4: Start Everything
```bash
docker-compose up -d
```

### Step 5: Access Application
- Frontend: http://localhost
- Backend: http://localhost:5000
- API Docs: http://localhost:5000/api-docs

**Login with:**
- Username: `admin`
- Password: `admin123`

✅ **Done! You're ready to go.**

---

## Option 2: Automated Setup Script 🔧

### Step 1: Run Setup
```bash
git clone <repository-url>
cd GAdmin-Toolkit
chmod +x setup.sh
./setup.sh
```

### Step 2: Add Credentials
```bash
# Place your cred.json file
cp /path/to/your/cred.json main/api/cred.json
```

### Step 3: Configure
```bash
# Backend
cd backend
nano .env  # Edit with your settings

# Frontend (already configured by setup.sh)
cd ../frontend
# .env already created
```

### Step 4: Start Services
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Step 5: Access
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

✅ **Running in development mode!**

---

## Option 3: Manual Setup 🔨

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env

# Edit .env with your configuration
nano .env

# Create required directories
mkdir -p logs uploads

# Start backend
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install

# Create .env
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Start frontend
npm run dev
```

---

## First Login

1. Open http://localhost:3000 (or http://localhost for Docker)
2. Enter credentials:
   - Username: `admin`
   - Password: `admin123`
3. Click "Login"
4. You'll be redirected to the Dashboard

**🔒 Security Tip:** Change the default password immediately!

---

## First Steps

### 1. Generate Test Users

1. Navigate to "User Management"
2. Click "Generate Users"
3. Enter:
   - Domain: `test.com`
   - Count: `5`
4. Click "Generate"
5. Check `files/user_list.csv` for generated data

### 2. View Users

1. Stay on "User Management" page
2. Click "Refresh" to load users from Google Workspace
3. Search, filter, and manage users

### 3. Create a Single User

1. Click "Create User" button
2. Fill in the form:
   - Email: `john.doe@test.com`
   - Password: `SecurePass123!`
   - First Name: `John`
   - Last Name: `Doe`
3. Click "Create User"

---

## Common Issues & Solutions

### Backend Won't Start

**Issue:** "Google credentials not found"

**Solution:**
```bash
# Check if file exists
ls -la main/api/cred.json

# Copy your credentials
cp /path/to/cred.json main/api/cred.json

# Verify permissions
chmod 600 main/api/cred.json
```

### Frontend Can't Connect

**Issue:** "Cannot connect to API"

**Solution:**
```bash
# Check backend is running
curl http://localhost:5000/health

# Verify CORS settings in backend/.env
CORS_ORIGIN=http://localhost:3000
```

### Port Already in Use

**Issue:** "Port 5000 already in use"

**Solution:**
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port in .env
PORT=5001
```

### Docker Issues

**Issue:** "Cannot connect to Docker daemon"

**Solution:**
```bash
# Start Docker
sudo systemctl start docker

# Or on Mac
open -a Docker

# Verify Docker is running
docker ps
```

---

## Next Steps

### Explore Features

1. **Dashboard**
   - View user statistics
   - Check activity charts
   - Quick actions

2. **User Management**
   - Generate bulk users
   - Import CSV files
   - Delete users
   - Search and filter

3. **Settings** (Coming Soon)
   - Change password
   - Update profile
   - Configure preferences

### API Access

Get familiar with the API:

```bash
# Login and get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Save token
TOKEN="your-token-here"

# Use API
curl -X GET http://localhost:5000/api/users/list \
  -H "Authorization: Bearer $TOKEN"
```

### Explore Documentation

- 📖 [README.md](README.md) - Main documentation
- 📖 [API_CONTRACT.md](API_CONTRACT.md) - API endpoints
- 📖 [ARCHITECTURE.md](ARCHITECTURE.md) - System design
- 📖 [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Migrate from CLI
- 📖 [TESTING_GUIDE.md](TESTING_GUIDE.md) - Testing strategies

---

## Production Deployment

### Using Docker

```bash
# Build images
docker-compose build

# Start in production mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Production

```bash
# Backend
cd backend
npm install --production
NODE_ENV=production npm start

# Frontend
cd frontend
npm run build
# Serve dist/ with nginx or any static server
```

---

## Get Help

- 📖 Check documentation files
- 🐛 Open an issue on GitHub
- 💬 Read troubleshooting sections
- 📧 Contact support

---

## Quick Commands Reference

```bash
# Docker
docker-compose up -d          # Start all services
docker-compose down           # Stop all services
docker-compose logs -f        # View logs
docker-compose restart        # Restart services

# Backend
cd backend
npm install                   # Install dependencies
npm run dev                   # Development mode
npm start                     # Production mode
npm test                      # Run tests

# Frontend
cd frontend
npm install                   # Install dependencies
npm run dev                   # Development mode
npm run build                 # Build for production
npm run preview               # Preview production build

# Utilities
./setup.sh                    # Automated setup
chmod +x setup.sh             # Make script executable
```

---

## Configuration Checklist

Before deploying to production:

- [ ] Change default admin password
- [ ] Update JWT_SECRET to strong random value
- [ ] Configure GOOGLE_ADMIN_EMAIL
- [ ] Add cred.json file
- [ ] Set NODE_ENV=production
- [ ] Configure CORS_ORIGIN
- [ ] Review rate limiting settings
- [ ] Check log file paths
- [ ] Set up HTTPS
- [ ] Configure firewall
- [ ] Set up backups

---

## Success! 🎉

You now have a fully functional Google Workspace management platform!

**What you can do:**
✅ Generate random users
✅ Create users in Google Workspace
✅ Delete users (single or bulk)
✅ Import users from CSV
✅ View statistics and charts
✅ Search and filter users
✅ Secure authentication
✅ Dark mode interface

**Happy managing!** 🚀
