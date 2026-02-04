# GAdmin-Toolkit: Production-Grade Email Delivery Platform

A horizontally scalable, self-hosted email delivery platform built on Node.js, designed to safely send high volumes of emails while protecting sender accounts and maintaining excellent deliverability.

## 🚀 Implementation Status

**✅ Core Platform Implemented (85% Complete)**

- ✅ **Database Layer**: PostgreSQL with migrations and connection pooling
- ✅ **Worker System**: Send workers with orchestrator and cron scheduler
- ✅ **API Layer**: Complete REST API with JWT authentication
- ✅ **Tracking System**: Open, click, and unsubscribe tracking
- ✅ **Safety Features**: Warmup schedules, rate limiting, bounce monitoring
- ✅ **Analytics**: Real-time metrics and reporting
- ✅ **Testing**: Unit tests for core functionality

**See [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for complete details.**

## 🎯 Key Features

- **Horizontal Scaling**: Scale by adding sender accounts, not increasing per-account volume
- **Account Protection**: Strict per-account limits with automatic enforcement and warm-up schedules
- **Multi-Provider Support**: Works with both Gmail API and generic SMTP servers
- **Advanced Tracking**: Open, click, bounce, and unsubscribe tracking with privacy controls
- **Worker-Based Architecture**: One worker process per sender account for complete isolation
- **Production-Ready**: PostgreSQL database, PM2 process management, comprehensive monitoring

## 🏗️ Architecture Overview

```
         ┌─────────────────┐
         │  Load Balancer  │
         └────────┬────────┘
                  │
    ┌─────────────▼─────────────┐
    │  Express.js API (Cluster) │
    │  • Admin Dashboard        │
    │  • Campaign Management    │
    │  • Tracking Endpoints     │
    └─────────────┬─────────────┘
                  │
    ┌─────────────▼─────────────┐
    │  Worker Orchestrator      │
    │  • Spawns send workers    │
    │  • Enforces limits        │
    │  • Handles failures       │
    └─────────────┬─────────────┘
                  │
       ┌──────────┴──────────┐
       │                     │
    ┌──▼───┐            ┌────▼──┐
    │Worker│   ...      │WorkerN│
    │Acct 1│            │Acct N │
    └──┬───┘            └────┬──┘
       └──────────┬──────────┘
                  │
         ┌────────▼─────────┐
         │  PostgreSQL DB   │
         └──────────────────┘
```

**Core Principle**: 1 Worker = 1 Account
- Each worker manages exactly one Gmail/SMTP account
- Workers send emails sequentially (never parallel within one worker)
- Horizontal scaling via adding more accounts/workers
- Complete failure isolation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Google Workspace account (for Gmail API) or SMTP server

### Installation

\`\`\`bash
# Clone repository
git clone https://github.com/anaitabd/GAdmin-Toolkit.git
cd GAdmin-Toolkit

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run migrate

# Create admin user
npm run create-admin

# Start all services with PM2 (recommended)
pm2 start ecosystem.config.js

# Or start in development mode
npm run dev
```

**For detailed setup instructions, see [QUICKSTART.md](QUICKSTART.md)**

## 📚 Documentation

Comprehensive documentation is available:

### Getting Started
- **[QUICKSTART.md](QUICKSTART.md)** - Quick setup and testing guide
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - What's been implemented
- **[IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md)** - Implementation status and roadmap

### Architecture & Design
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and design principles
- **[DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)** - Database schema and indexing strategy
- **[WORKER_DESIGN.md](docs/WORKER_DESIGN.md)** - Worker lifecycle and sending logic
- **[TRACKING_DESIGN.md](docs/TRACKING_DESIGN.md)** - Tracking implementation (opens, clicks, bounces)
- **[DELIVERABILITY.md](docs/DELIVERABILITY.md)** - Deliverability best practices and safety rules
- **[API_DESIGN.md](docs/API_DESIGN.md)** - API endpoints and integration guide
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Production deployment guide

## 💻 Requirements

**Production** (for ~50-100 workers):
- AWS EC2 t3.medium or Azure Standard_B2s
- 2 vCPUs, 4 GB RAM
- PostgreSQL 14+
- Google Workspace or SMTP credentials

## ⚙️ Configuration

### Environment Variables

\`\`\`env
NODE_ENV=production
PORT=3000
BASE_URL=https://yourdomain.com
DATABASE_URL=postgresql://user:pass@localhost/emaildb
JWT_SECRET=your_secret_here
GMAIL_SERVICE_ACCOUNT_PATH=./cred.json
MAX_WORKERS=50
\`\`\`

### Warm-Up Schedule

New accounts automatically follow a 6-week warm-up schedule:
- Week 1: 50 emails/day
- Week 2: 100 emails/day
- Week 3: 250 emails/day
- Week 4: 500 emails/day
- Week 5: 1,000 emails/day
- Week 6+: 2,000 emails/day (full capacity)

## 🚢 Deployment

### PM2 (Recommended)

\`\`\`bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
\`\`\`

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete production guide.

## 📈 Scaling

**Scaling Formula**:
- 10 accounts @ 2,000/day = 20,000 emails/day
- 100 accounts @ 2,000/day = 200,000 emails/day
- 1,000 accounts @ 2,000/day = 2,000,000 emails/day

## 📊 Monitoring

\`\`\`bash
# Health check
curl https://yourdomain.com/api/health

# View stats
curl https://yourdomain.com/api/admin/stats \\
  -H "Authorization: Bearer TOKEN"
\`\`\`

## 🔒 Security

- JWT Authentication
- Rate Limiting (100 req/15 min)
- Encrypted credentials at rest
- SSL/TLS for all communication
- Input validation and sanitization

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments
### Option 1: Docker Deployment (Recommended for Production) 🐳

**The easiest way to deploy the complete application with all services!**

#### Quick Setup (Automated)

```bash
# 1. Clone the repository
git clone https://github.com/anaitabd/GAdmin-Toolkit.git
cd GAdmin-Toolkit

# 2. Run the automated setup script
chmod +x docker-setup.sh
./docker-setup.sh
```

The script will:
- ✓ Validate Docker installation
- ✓ Check and create .env file
- ✓ Validate configuration
- ✓ Build Docker images
- ✓ Start all services
- ✓ Help create admin user

#### Manual Setup

```bash
# 1. Clone the repository
git clone https://github.com/anaitabd/GAdmin-Toolkit.git
cd GAdmin-Toolkit

# 2. Copy and configure environment variables
cp .env.example .env
# Edit .env with your settings (see DOCKER_GUIDE.md)

# 3. Start all services
docker compose up -d

# 4. Create admin user
docker compose exec backend node setup-admin.js admin YourPassword123!

# 5. Access the application
# Frontend: http://localhost
# Backend API: http://localhost:3000
```

✅ **Includes:** MongoDB, Backend API, Frontend, and Redis
📖 **Full guide:** See [DOCKER_GUIDE.md](DOCKER_GUIDE.md) for complete documentation

---

### Option 2: Full Stack with Frontend (Development)

**1. Install Backend Dependencies**
```bash
cd main
npm install
```

**2. Setup Backend API**
```bash
cd api
cp .env.example .env
# Edit .env with your MongoDB URI and JWT_SECRET
node setup-admin.js admin YourPassword123!
```

**3. Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

**4. Start Both Services**

In one terminal (Backend):
```bash
cd main/api
node server.js
```

In another terminal (Frontend):
```bash
cd main/frontend
npm run dev
```

Now visit `http://localhost:5173` to access the web interface!

### Option 3: API Only

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

### Option 4: Original Scripts

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

### Using the React Frontend (Easiest)

1. **Start the backend API:**
```bash
cd main/api
node server.js
```

2. **Start the frontend (in a new terminal):**
```bash
cd main/frontend
npm run dev
```

3. **Open your browser:**
- Navigate to `http://localhost:5173`
- Login with username: `admin` and password: `YourSecurePassword123!`
- Use the intuitive web interface to:
  - View dashboard statistics
  - Generate and manage users
  - Send emails via Gmail API or SMTP
  - Monitor email logs and bounced emails

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

Built with Node.js, Express, PostgreSQL, Gmail API, and Nodemailer.

---

**Built with ❤️ for reliable, scalable email delivery**

## 🤝 Contributing

Contributions are welcome!
Please submit a pull request or open an issue for enhancements or bug fixes.

