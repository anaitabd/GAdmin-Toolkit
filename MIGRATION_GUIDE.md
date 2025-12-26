# 🔄 Migration Guide: CLI to Web Application

This guide helps you migrate from the old CLI-based workflow to the new web application.

## Table of Contents
- [Overview](#overview)
- [Key Differences](#key-differences)
- [Step-by-Step Migration](#step-by-step-migration)
- [CLI vs Web Comparison](#cli-vs-web-comparison)
- [Backward Compatibility](#backward-compatibility)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Google Workspace Automation Toolkit has been transformed from a CLI-based tool to a full-featured web application. All existing functionality is preserved and enhanced with:

- Web-based UI
- REST API access
- Better security
- Real-time monitoring
- Easier deployment

## Key Differences

### Before (CLI)
```bash
# Manual script execution
bash script.sh

# Direct Node.js calls
node main/api/generate.js example.com 100
node main/api/create.js
node main/api/delete.js

# Python scripts
python py/activateLessSecureApp.py
```

### After (Web)
```
1. Access web dashboard at http://localhost
2. Login with credentials
3. Click buttons to perform actions
4. Monitor progress in real-time
5. View logs and statistics
```

---

## Step-by-Step Migration

### Phase 1: Preparation

1. **Backup your existing setup**
   ```bash
   # Backup credentials
   cp main/api/cred.json ~/backup/cred.json.backup
   
   # Backup CSV files
   cp -r files ~/backup/files_backup
   ```

2. **Install new dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

### Phase 2: Configuration

1. **Configure Backend**
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```env
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=generate-a-strong-random-key
   GOOGLE_ADMIN_EMAIL=admin@yourdomain.com
   GOOGLE_CREDENTIALS_PATH=../main/api/cred.json
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your-secure-password
   ```

2. **Configure Frontend**
   ```bash
   cd ../frontend
   echo "VITE_API_URL=http://localhost:5000/api" > .env
   ```

### Phase 3: Start Services

**Option A: Docker (Recommended)**
```bash
# From project root
docker-compose up -d

# Access:
# Frontend: http://localhost
# Backend API: http://localhost:5000
# API Docs: http://localhost:5000/api-docs
```

**Option B: Manual**
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Phase 4: First Login

1. Open http://localhost (or http://localhost:3000 for dev)
2. Login with:
   - Username: `admin`
   - Password: (from your .env)
3. Change password in Settings (recommended)

### Phase 5: Test Functionality

1. **Generate Users**
   - Go to User Management
   - Click "Generate Users"
   - Enter domain and count
   - Click Generate

2. **Create Users**
   - Upload CSV or use generated data
   - Click "Create Users"
   - Monitor progress

3. **View Users**
   - All users listed in table
   - Search and filter
   - View details

---

## CLI vs Web Comparison

### 1. User Generation

**CLI:**
```bash
node main/api/generate.js example.com 100
```

**Web UI:**
1. Navigate to User Management
2. Click "Generate Users"
3. Fill form:
   - Domain: example.com
   - Count: 100
4. Click "Generate"

**API:**
```bash
curl -X POST http://localhost:5000/api/users/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"domain":"example.com","count":100}'
```

### 2. Create Users

**CLI:**
```bash
node main/api/create.js
```

**Web UI:**
1. Go to User Management
2. Click "Create Users" or "Import CSV"
3. Select CSV file or use generated data
4. Confirm creation

**API:**
```bash
curl -X POST http://localhost:5000/api/users/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"csvPath":"/path/to/user_list.csv"}'
```

### 3. Delete Users

**CLI:**
```bash
node main/api/delete.js
```

**Web UI:**
1. Go to User Management
2. Click "Delete All" button
3. Confirm deletion
4. Monitor progress

**API:**
```bash
curl -X DELETE http://localhost:5000/api/users/delete-all \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. List Users

**CLI:**
```bash
# No direct CLI command
# Manual inspection via Google Admin Console
```

**Web UI:**
1. Navigate to User Management
2. View all users in table
3. Search, filter, sort

**API:**
```bash
curl -X GET http://localhost:5000/api/users/list \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Backward Compatibility

### Legacy Scripts Still Work!

All original CLI scripts are preserved and can still be used:

```bash
# Old workflow still works
cd main/api
node generate.js example.com 100
node create.js
node delete.js

# Python scripts
cd ../../py
python activateLessSecureApp.py
```

### When to Use CLI vs Web

**Use CLI when:**
- Automation/scripting needed
- CI/CD pipeline integration
- Batch processing
- Headless server environment

**Use Web when:**
- Interactive management
- Visual feedback needed
- Non-technical users
- Real-time monitoring
- Exploring data

---

## Accessing the API Programmatically

### Get API Token

```bash
# Login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-password"
  }'

# Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": {...}
  }
}
```

### Use Token in Scripts

```bash
#!/bin/bash
TOKEN="your-token-here"

# Generate users
curl -X POST http://localhost:5000/api/users/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"domain":"example.com","count":50}'

# List users
curl -X GET http://localhost:5000/api/users/list \
  -H "Authorization: Bearer $TOKEN"
```

### Python Integration

```python
import requests

# Login
response = requests.post('http://localhost:5000/api/auth/login', 
    json={'username': 'admin', 'password': 'password'})
token = response.json()['data']['token']

# Use API
headers = {'Authorization': f'Bearer {token}'}

# Generate users
requests.post('http://localhost:5000/api/users/generate',
    headers=headers,
    json={'domain': 'example.com', 'count': 50})

# List users
users = requests.get('http://localhost:5000/api/users/list',
    headers=headers).json()
```

---

## Data Migration

### CSV Files

Your existing CSV files in `files/` directory work without changes:

- `files/user_list.csv` - Generated users
- `files/names.csv` - Name database
- `files/users.csv` - User credentials
- `files/data.csv` - Email data
- `files/info.csv` - Email info

The web app reads from the same locations.

### Google Credentials

Keep `cred.json` in `main/api/` directory. Backend will access it from there.

---

## Feature Mapping

| Old Feature | New Location | Notes |
|-------------|--------------|-------|
| `generate.js` | User Management → Generate | Web UI + API |
| `create.js` | User Management → Create | Web UI + API |
| `delete.js` | User Management → Delete | Web UI + API |
| `smtp.js` | Coming soon | SMTP features planned |
| Python scripts | Coming soon | Will be integrated |
| CSV operations | User Management | Import/Export via UI |
| Logs | Dashboard → Logs | View in browser |

---

## Troubleshooting

### "Cannot access old files"

The web app uses the same file paths:
```bash
# Verify files exist
ls -la files/
ls -la main/api/cred.json
```

### "API not responding"

```bash
# Check backend is running
curl http://localhost:5000/health

# Check logs
tail -f backend/logs/app.log
```

### "Login not working"

```bash
# Verify credentials in .env
cat backend/.env | grep ADMIN

# Reset password by editing .env
# Then restart backend
```

### "Google credentials error"

```bash
# Check path in backend/.env
GOOGLE_CREDENTIALS_PATH=../main/api/cred.json

# Verify file exists
ls -la main/api/cred.json

# Check permissions
chmod 600 main/api/cred.json
```

---

## Performance Comparison

### Execution Speed

**CLI:**
- Direct execution
- No HTTP overhead
- Faster for single operations

**Web:**
- HTTP request overhead
- Better for monitoring
- Progress tracking
- Error handling

### Scalability

**CLI:**
- Single process
- Manual parallelization
- Harder to monitor

**Web:**
- Job queue support
- Background processing
- Multiple concurrent users
- Real-time monitoring

---

## Security Considerations

### CLI Security
- Direct file access
- No authentication
- Local machine only

### Web Security
- JWT authentication
- Role-based access
- Rate limiting
- Audit logging
- Network access control

**Migration Recommendation:**
- Use CLI for automated scripts
- Use Web for interactive management
- Restrict web access to trusted networks

---

## Next Steps

1. ✅ Complete migration steps above
2. ✅ Test basic operations via web UI
3. ✅ Configure user roles (if needed)
4. ✅ Set up monitoring
5. ✅ Update your documentation
6. ✅ Train team on new interface
7. ✅ Deprecate old workflows gradually

---

## Getting Help

- 📖 [Backend README](backend/README.md)
- 📖 [Frontend README](frontend/README.md)
- 📖 [API Documentation](API_CONTRACT.md)
- 🐛 [Report Issues](https://github.com/your-repo/issues)

---

**Remember:** The old CLI scripts still work! Migrate at your own pace.
