# Google Workspace Automation Toolkit

This project is a full automation suite designed to manage users in Google Workspace. It includes scripts for creating, deleting, and configuring accounts using Node.js and Python.

## 🚀 New: REST API Backend

The `main/api` folder now includes a **fully functional REST API backend** with:
- ✅ **Admin-only authentication** with JWT tokens
- ✅ **MongoDB NoSQL database** integration
- ✅ **Rate limiting** for security
- ✅ **RESTful endpoints** for all operations
- ✅ **Password hashing** with bcrypt
- ✅ **Comprehensive documentation**

👉 **[API Documentation](main/api/API_README.md)** | **[Testing Guide](main/api/TESTING.md)**

### Quick Start - API Server

```bash
# 1. Setup environment
cd main/api
cp .env.example .env
# Edit .env with your MongoDB URI and JWT_SECRET

# 2. Start MongoDB (if running locally)
mongod --dbpath /path/to/data

# 3. Create admin user
node setup-admin.js admin YourSecurePassword123!

# 4. Start the server
npm start
```

The API will be available at `http://localhost:3000`

---

## Project Structure

```bash
.
├── files/                    # CSV and configuration files
│   ├── arcore_01.csv
│   ├── data.csv
│   ├── html.txt
│   ├── info.csv
│   ├── names.csv
│   ├── user_list.csv
│   └── users.csv
├── main/
│   ├── package.json
│   └── api/
│       ├── server.js         # NEW: Main API server
│       ├── config/           # NEW: Database configuration
│       ├── controllers/      # NEW: API controllers
│       ├── middleware/       # NEW: Auth & rate limiting
│       ├── routes/           # NEW: API routes
│       ├── bounce.js         # Original bounce detection script
│       ├── create.js         # Original user creation script
│       ├── delete.js         # Original user deletion script
│       ├── generate.js       # Original user generation script
│       ├── sendApi.js        # Original Gmail API send script
│       └── smtp.js           # Original SMTP send script
├── py/                       # Python utilities
│   ├── activateLessSecureApp.py
│   ├── checkSmtp.py
│   ├── chunk.py
│   ├── duplicate.py
│   ├── filterProssesdEmail.py
│   ├── requirement.txt
│   ├── send.py
│   └── split.py
└── script.sh                 # Automated workflow script
```

---

## ⚙️ Setup Instructions

### Option 1: REST API (Recommended)

See the [API Documentation](main/api/API_README.md) for complete setup instructions.

Quick setup:
```bash
cd main
npm install
cd api
cp .env.example .env
# Edit .env with your configuration
node setup-admin.js admin YourPassword123!
npm start
```

### Option 2: Original Scripts

**1. Install Dependencies**

**Node.js**
```bash
cd main
npm install
```

**Python**
```bash
pip install -r py/requirement.txt
```

**2. Google API Credentials**

Add your Google API credentials:
- Place your `cred.json` file in the `main/api/` directory.

---

## 🚀 Usage

### Using the REST API

```bash
# Start the server
cd main && npm start

# Login to get a token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YourPassword123!"}'

# Use the API with the token
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

See [TESTING.md](main/api/TESTING.md) for complete API examples.

### Using Original Scripts

**1. Run All Scripts (Automated)**

Use the automated `script.sh` to:
- Delete existing users
- Generate new user data
- Create users in Google Workspace
- Activate less secure app access

```bash
bash script.sh
```

**2. Run Scripts Individually**

Generate User Data:
```bash
node main/api/generate.js
```

Create Users:
```bash
node main/api/create.js
```

Delete Users:
```bash
node main/api/delete.js
```

Activate Less Secure App Access:
```bash
python py/activateLessSecureApp.py
```

---

## 🛠 Configuration

### API Configuration
- Edit `main/api/.env` for database, JWT secrets, and server settings
- See `.env.example` for all available options

### Script Configuration
- Update CSV files in the `files/` directory: `data.csv`, `info.csv`, `names.csv`, `users.csv`, etc.
- Modify constants like `emailsPerWorker` and `REQUESTS_PER_EMAIL` inside the scripts if needed

---

## 🔒 Security Features

The new API backend includes:
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for secure password storage
- **Rate Limiting**: Protects against brute force and DoS attacks
  - Auth endpoints: 5 requests per 15 minutes
  - Email operations: 10 requests per hour
  - General API: 100 requests per 15 minutes
- **Environment Variables**: Sensitive data protected in .env files
- **Input Validation**: Request validation on all endpoints
- **CORS Support**: Configurable cross-origin resource sharing

---

---

## 📄 License

This project is licensed under the MIT License.
See the LICENSE file for more information.

---

## 🤝 Contributing

Contributions are welcome!
Please submit a pull request or open an issue for enhancements or bug fixes.

