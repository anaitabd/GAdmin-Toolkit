# GAdmin Toolkit - Quick Start

Get up and running in 15 minutes.

## Prerequisites

- Docker & Docker Compose
- Google Workspace with admin access
- AWS account (optional, for EC2 tracking)

## Setup

### 1. Clone & Configure

```bash
git clone https://github.com/anaitabd/GAdmin-Toolkit.git
cd GAdmin-Toolkit
cp .env.example .env
nano .env  # Set DB_PASSWORD, ENCRYPTION_KEY (32 chars), JWT_SECRET
```

### 2. Start Services

```bash
docker-compose up -d
docker-compose exec api node src/scripts/createAdmin.js
curl http://localhost:3000/health
```

## Documentation

- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Complete setup
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API reference
- [NEW_FEATURES.md](NEW_FEATURES.md) - Features overview
