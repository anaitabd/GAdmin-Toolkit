# GAdmin Toolkit - Quick Start Guide

This guide will help you get the full application (Frontend + Backend) running in minutes.

## Prerequisites

- Node.js v14 or higher
- MongoDB (local or cloud instance like MongoDB Atlas)
- Google Workspace Admin credentials (for Google API features)

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/anaitabd/GAdmin-Toolkit.git
cd GAdmin-Toolkit
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd main
npm install
```

### 3. Setup MongoDB

**Option A: Local MongoDB**
```bash
# Start MongoDB
mongod --dbpath /path/to/your/data
```

**Option B: MongoDB Atlas (Cloud)**
- Create a free account at https://www.mongodb.com/cloud/atlas
- Create a cluster
- Get your connection string (it looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

### 4. Configure Backend Environment

```bash
cd api
cp .env.example .env
```

Edit `.env` file with your settings:
```env
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=gadmin-toolkit

# JWT Configuration - CHANGE THIS IN PRODUCTION!
JWT_SECRET=your-very-long-random-secret-key-min-32-characters
JWT_EXPIRY=24h

# Google Workspace Configuration
GOOGLE_ADMIN_USER=admin@yourdomain.com
```

### 5. Create Admin User

```bash
# Still in main/api directory
node setup-admin.js admin YourSecurePassword123!
```

You should see: "✅ Admin user created successfully!"

### 6. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 7. Start the Application

**Terminal 1 - Start Backend:**
```bash
cd main/api
node server.js
```

You should see:
```
MongoDB Connected Successfully
Server is running on port 3000
Environment: development
```

**Terminal 2 - Start Frontend:**
```bash
cd main/frontend
npm run dev
```

You should see:
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

### 8. Access the Application

1. Open your browser and go to: **http://localhost:5173**
2. Login with:
   - Username: `admin`
   - Password: `YourSecurePassword123!`

## What You Can Do Now

### Dashboard
- View statistics (total users, emails sent, bounced emails)
- Quick access to all features

### Users Management
1. **Generate Users**
   - Enter your domain (e.g., `yourdomain.com`)
   - Specify number of users to generate
   - Click "Generate Users"

2. **View Users**
   - Browse generated users with pagination
   - See user details (email, name, password)

3. **Create in Google Workspace**
   - Click "Create in Google Workspace" to actually create the users
   - Requires Google Workspace credentials

4. **Delete Users**
   - Remove all users (except admin) from Google Workspace

### Email Management
1. **Send Email**
   - Enter recipient emails (comma-separated)
   - Fill in from name and subject
   - Write HTML email content
   - Send via Gmail API or SMTP

2. **Email Logs**
   - View all sent emails
   - Filter by status and method
   - Pagination support

3. **Bounced Emails**
   - Track failed email deliveries
   - See bounce reasons

## Troubleshooting

### Cannot Login
- Ensure backend is running on port 3000
- Check MongoDB is connected
- Verify admin user was created successfully

### API Connection Failed
- Make sure backend is running: `cd main/api && node server.js`
- Check backend is accessible at http://localhost:3000
- Verify no firewall is blocking the connection

### MongoDB Connection Error
- **Local MongoDB**: Ensure `mongod` is running
- **MongoDB Atlas**: 
  - Check your connection string in `.env`
  - Whitelist your IP address in MongoDB Atlas
  - Ensure credentials are correct

### Frontend Build Errors
```bash
cd main/frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Port Already in Use
- Backend (port 3000): Stop other processes using port 3000
- Frontend (port 5173): Vite will automatically try next available port

## Production Deployment

### Build Frontend for Production
```bash
cd main/frontend
npm run build
```

The production files will be in `dist/` directory.

### Serve Frontend Build
You can serve the built frontend with any static file server:

```bash
# Using Node.js serve package
npm install -g serve
serve -s dist -p 80
```

Or configure your web server (Nginx, Apache) to serve the `dist/` directory.

### Production Environment Variables

For production, update your `.env`:
```env
NODE_ENV=production
JWT_SECRET=use-a-very-long-random-string-here-minimum-32-characters
MONGODB_URI=your-production-mongodb-uri
```

## Next Steps

1. **Change Admin Password**: Go to the frontend and update your admin password
2. **Setup Google Credentials**: Add your `cred.json` file to `main/api/` for Google Workspace features
3. **Configure Email**: Set up Gmail API or SMTP for email sending
4. **Review Security**: Check all security settings before production use

## Getting Help

- **API Documentation**: [main/api/API_README.md](main/api/API_README.md)
- **Frontend Documentation**: [main/frontend/README.md](main/frontend/README.md)
- **Testing Guide**: [main/api/TESTING.md](main/api/TESTING.md)
- **Issues**: Open an issue on GitHub

## Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   React         │         │   Express       │         │   MongoDB       │
│   Frontend      │────────▶│   API Server    │────────▶│   Database      │
│   (Port 5173)   │   HTTP  │   (Port 3000)   │   API   │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
                                     │
                                     │
                                     ▼
                            ┌─────────────────┐
                            │   Google        │
                            │   Workspace API │
                            └─────────────────┘
```

## Features Summary

✅ **Full Stack Application**
- Modern React frontend with responsive design
- RESTful API backend with Express.js
- MongoDB for data persistence

✅ **Security**
- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection

✅ **User Management**
- Generate user data
- Create users in Google Workspace
- Delete users from Google Workspace
- View and manage users

✅ **Email Operations**
- Send via Gmail API or SMTP
- Track email logs
- Monitor bounced emails

---

Happy coding! 🚀
