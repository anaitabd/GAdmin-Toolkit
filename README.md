# GAdmin-Toolkit: Production-Grade Email Delivery Platform

A horizontally scalable, self-hosted email delivery platform built on Node.js, designed to safely send high volumes of emails while protecting sender accounts and maintaining excellent deliverability.

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

# Start in development mode
npm run dev
\`\`\`

## 📚 Documentation

Comprehensive documentation is available:

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and design principles
- **[DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)** - Database schema and indexing strategy
- **[WORKER_DESIGN.md](docs/WORKER_DESIGN.md)** - Worker lifecycle and sending logic
- **[TRACKING_DESIGN.md](docs/TRACKING_DESIGN.md)** - Tracking implementation (opens, clicks, bounces)
- **[DELIVERABILITY.md](docs/DELIVERABILITY.md)** - Deliverability best practices and safety rules
- **[API_DESIGN.md](docs/API_DESIGN.md)** - API endpoints and integration guide
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Production deployment guide
- **[IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md)** - 14-week implementation plan

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

Built with Node.js, Express, PostgreSQL, Gmail API, and Nodemailer.

---

**Built with ❤️ for reliable, scalable email delivery**
