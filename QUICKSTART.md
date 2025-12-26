# GAdmin Toolkit - Quick Start Guide

## Installation & Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd GAdmin-Toolkit

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Configure Google Workspace

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Admin SDK API
4. Create Service Account credentials
5. Download credentials as `cred.json`
6. Enable Domain-Wide Delegation
7. Add OAuth scope: `https://www.googleapis.com/auth/admin.directory.user`

### 3. Setup Backend

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env file - set your Google admin email
nano .env

# Create config directory
mkdir -p config

# Copy your Google credentials
cp /path/to/your/cred.json config/cred.json
```

### 4. Start the Application

```bash
# Terminal 1 - Start Backend
cd backend
npm run dev

# Terminal 2 - Start Frontend
cd frontend
npm run dev
```

### 5. Access the Application

- Open browser: `http://localhost:3000`
- Login with default credentials:
  - Username: `admin`
  - Password: `admin123`

## Quick Operations

### Create a User
1. Go to "Create User" tab
2. Fill in email, password, first name, last name
3. Click "Create User"

### Generate Test Users
1. Go to "Generate Users" tab
2. Enter your domain (e.g., example.com)
3. Enter number of users to create
4. Click "Generate and Create Users"

### Upload CSV
1. Go to "Upload CSV" tab
2. Prepare CSV with format: `email,password,givenName,familyName`
3. Upload file
4. Users will be created automatically

### View/Delete Users
1. Go to "List Users" tab
2. View all workspace users
3. Delete individual users or all at once

## API Usage

```bash
# Get token
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')

# List users
curl -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer $TOKEN"

# Create user
curl -X POST http://localhost:3001/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"Password123@",
    "givenName":"Test",
    "familyName":"User"
  }'
```

## Production Deployment

```bash
# Build frontend
cd frontend
npm run build

# Start backend in production
cd backend
NODE_ENV=production npm start
```

## Need Help?

- Check the main README.md for detailed documentation
- Review API documentation for endpoint details
- Open an issue on GitHub for bugs or questions
