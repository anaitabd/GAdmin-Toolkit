# GAdmin-Toolkit - Quick Start Guide

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 15+ (optional, can use Docker)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/anaitabd/GAdmin-Toolkit.git
cd GAdmin-Toolkit
```

### 2. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and fill in your values
# At minimum, set:
# - DB_PASSWORD
# - JWT_SECRET
# - ENCRYPTION_KEY
# - TRACKING_SECRET
```

Or use the provided script to generate secure secrets:

```bash
# Generate secure secrets (embedded in .env.example)
openssl rand -base64 32 | tr -d '/+=' | cut -c1-32  # For JWT_SECRET
openssl rand -base64 32 | tr -d '/+=' | cut -c1-32  # For ENCRYPTION_KEY
openssl rand -base64 32 | tr -d '/+=' | cut -c1-32  # For TRACKING_SECRET
```

### 3. Start Services with Docker Compose

```bash
# Start all services
docker compose up -d

# Or start specific services
docker compose up -d postgres redis
```

### 4. Create Admin User

```bash
# Connect to the database
docker exec -it gadmin-postgres psql -U gadmin -d gadmin_toolkit

# In the psql prompt, create an admin user
# First generate a bcrypt hash for your password
# Outside psql, run:
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YOUR_PASSWORD', 10, (err, hash) => { console.log(hash); });"

# Then in psql:
INSERT INTO admin_users (username, password_hash, role) 
VALUES ('admin', 'YOUR_BCRYPT_HASH', 'admin');
```

Or use the quick create script:

```bash
npm install
DATABASE_URL="postgresql://gadmin:YOUR_PASSWORD@localhost:5432/gadmin_toolkit" \
node src/scripts/quickCreateAdmin.js
```

### 5. Access the Application

The API server runs on port 3000 by default:

- Health Check: http://localhost:3000/health
- API Base URL: http://localhost:3000/api

### 6. Test Authentication

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## Local Development

For local development without Docker:

### 1. Install Dependencies

```bash
npm install
```

### 2. Start PostgreSQL and Redis

```bash
# Start only database and cache services
docker compose up -d postgres redis
```

### 3. Run Database Migrations

Migrations run automatically when PostgreSQL starts via docker-entrypoint-initdb.d.
If you need to run them manually:

```bash
# Migrations are in src/db/migrations/
# They are applied in alphanumeric order
```

### 4. Create Required Directories

```bash
mkdir -p logs files
```

### 5. Start the Server

```bash
# Using the startup script
./start.sh

# Or manually
DATABASE_URL="postgresql://gadmin:YOUR_PASSWORD@localhost:5432/gadmin_toolkit" \
NODE_ENV=development \
node src/server.js
```

## Default Credentials

**⚠️ IMPORTANT: Change these immediately after first login!**

- Username: `admin`
- Password: `admin123`

## Available Services

- **API Server**: Port 3000
- **PostgreSQL**: Port 5432
- **Redis**: Port 6379

## Verification Steps

1. Check service status:
```bash
docker compose ps
```

2. Check logs:
```bash
# All services
docker compose logs

# Specific service
docker compose logs api
docker compose logs postgres
```

3. Test database connection:
```bash
docker exec -it gadmin-postgres psql -U gadmin -d gadmin_toolkit -c "SELECT NOW();"
```

4. Test API health:
```bash
curl http://localhost:3000/health
```

## Troubleshooting

### Database Connection Issues

If you see "relation 'admin_users' does not exist":
- Ensure migrations have run
- Check docker logs: `docker compose logs postgres`
- Verify tables: `docker exec -it gadmin-postgres psql -U gadmin -d gadmin_toolkit -c "\dt"`

### Docker Build Failures

If npm install fails during Docker build:
- Install dependencies locally first: `npm install`
- Then build: `docker compose build`

### Port Already in Use

If port 3000, 5432, or 6379 is already in use:
- Stop the conflicting service
- Or change the port in docker-compose.yml

## Next Steps

- Review API documentation in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- Check architecture details in [ARCHITECTURE.md](./ARCHITECTURE.md)
- Follow deployment guide in [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## Security Notes

1. Change default admin password immediately
2. Use strong, random secrets for JWT, encryption, and tracking
3. Never commit `.env` file to git
4. Rotate secrets regularly in production
5. Enable SSL/TLS for production deployments

## Support

For issues and questions:
- Check existing documentation
- Review logs for error messages
- Open an issue on GitHub
