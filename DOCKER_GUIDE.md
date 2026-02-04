# Docker Deployment Guide for GAdmin-Toolkit

This guide will help you deploy the GAdmin-Toolkit using Docker and Docker Compose.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB of free disk space

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/anaitabd/GAdmin-Toolkit.git
cd GAdmin-Toolkit
```

### 2. Configure Environment Variables

Copy the example environment file and update it with your settings:

```bash
cp .env.example .env
```

**Important:** Edit the `.env` file and update these critical values:

```bash
# Generate a secure JWT secret
JWT_SECRET=$(openssl rand -base64 64)

# Set a strong MongoDB password
MONGO_ROOT_PASSWORD=your_secure_password_here

# Configure your Google Workspace admin email
GOOGLE_ADMIN_USER=admin@yourdomain.com
```

### 3. Start All Services

```bash
docker compose up -d
```

This will start:
- MongoDB database
- Backend API (port 3000)
- Frontend (port 80)
- Redis (port 6379)

### 4. Check Service Status

```bash
docker compose ps
```

All services should show as "healthy" after a few moments.

### 5. Create Admin User

Once the backend is running, create an admin user:

```bash
docker compose exec backend node setup-admin.js admin YourSecurePassword123!
```

### 6. Access the Application

Open your browser and navigate to:
- **Frontend:** http://localhost
- **Backend API:** http://localhost:3000
- **API Health Check:** http://localhost:3000/health

Login with:
- **Username:** admin
- **Password:** YourSecurePassword123! (or the password you set)

## 📊 Service Details

### Backend API
- **Port:** 3000 (configurable via `BACKEND_PORT`)
- **Container Name:** gadmin-backend
- **Image:** Custom built from `main/api/Dockerfile`
- **Health Check:** GET /health

### Frontend
- **Port:** 80 (configurable via `FRONTEND_PORT`)
- **Container Name:** gadmin-frontend
- **Image:** Custom built from `main/frontend/Dockerfile`
- **Server:** nginx

### MongoDB
- **Port:** 27017 (configurable via `MONGO_PORT`)
- **Container Name:** gadmin-mongodb
- **Image:** mongo:7.0
- **Data Volume:** mongodb_data

### Redis
- **Port:** 6379 (configurable via `REDIS_PORT`)
- **Container Name:** gadmin-redis
- **Image:** redis:7-alpine
- **Data Volume:** redis_data

## 🔧 Common Commands

### Start Services
```bash
# Start all services in detached mode
docker compose up -d

# Start specific service
docker compose up -d backend

# Start with build (rebuild images)
docker compose up -d --build
```

### Stop Services
```bash
# Stop all services
docker compose stop

# Stop specific service
docker compose stop backend

# Stop and remove containers
docker compose down
```

### View Logs
```bash
# View all logs
docker compose logs

# Follow logs in real-time
docker compose logs -f

# View logs for specific service
docker compose logs -f backend

# View last 100 lines
docker compose logs --tail=100 backend
```

### Execute Commands in Containers
```bash
# Open shell in backend container
docker compose exec backend sh

# Run a command in backend
docker compose exec backend node setup-admin.js admin password123

# View MongoDB data
docker compose exec mongodb mongosh -u admin -p your_password
```

### Restart Services
```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart backend
```

### View Service Status
```bash
# Check all services
docker compose ps

# Check resource usage
docker stats
```

## 🔄 Updating the Application

### Update Code and Rebuild

```bash
# Pull latest changes
git pull

# Rebuild and restart services
docker compose up -d --build

# Or rebuild specific service
docker compose up -d --build backend
```

## 🗄️ Data Management

### Backup MongoDB Data

```bash
# Create backup
docker compose exec mongodb mongodump --out=/data/backup --authenticationDatabase=admin -u admin -p your_password

# Copy backup to host
docker cp gadmin-mongodb:/data/backup ./mongodb-backup-$(date +%Y%m%d)
```

### Restore MongoDB Data

```bash
# Copy backup to container
docker cp ./mongodb-backup-YYYYMMDD gadmin-mongodb:/data/restore

# Restore backup
docker compose exec mongodb mongorestore /data/restore --authenticationDatabase=admin -u admin -p your_password
```

### View Volumes

```bash
# List all volumes
docker volume ls

# Inspect a volume
docker volume inspect gadmin-toolkit_mongodb_data
```

### Remove All Data (Careful!)

```bash
# Stop and remove containers, networks, and volumes
docker compose down -v
```

## 🐛 Troubleshooting

### Service Won't Start

Check logs for the failing service:
```bash
docker compose logs backend
```

Common issues:
- **JWT_SECRET not set:** Edit .env and set JWT_SECRET
- **Port already in use:** Change port in .env file
- **MongoDB connection failed:** Check MONGO_ROOT_PASSWORD in .env

### Frontend Can't Connect to Backend

1. Check if backend is running and healthy:
```bash
curl http://localhost:3000/health
```

2. Check backend logs:
```bash
docker compose logs backend
```

3. Verify environment variables in .env file

### MongoDB Authentication Failed

1. Stop all services:
```bash
docker compose down -v
```

2. Update MongoDB password in .env file

3. Start services again:
```bash
docker compose up -d
```

### View Container Health Status

```bash
docker compose ps
docker inspect --format='{{.State.Health}}' gadmin-backend
```

## 🔒 Production Deployment

### Security Checklist

- [ ] Change default MongoDB password
- [ ] Generate strong JWT_SECRET (use `openssl rand -base64 64`)
- [ ] Set NODE_ENV=production
- [ ] Configure firewall rules
- [ ] Use HTTPS (add reverse proxy like Traefik or nginx)
- [ ] Regular backups configured
- [ ] Update Google credentials (cred.json)
- [ ] Remove ADMIN_USERNAME and ADMIN_PASSWORD from .env after setup

### Recommended Production Configuration

Create a `docker compose.prod.yml` file:

```yaml
services:
  backend:
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
  
  frontend:
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
  
  mongodb:
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

Deploy with:
```bash
docker compose -f docker compose.yml -f docker compose.prod.yml up -d
```

### HTTPS with Reverse Proxy

Add a reverse proxy (e.g., Traefik or nginx) in front of your services to handle SSL/TLS certificates.

Example nginx configuration:
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🎯 Performance Optimization

### Use Production Builds

The Dockerfiles are already configured for production builds with:
- Multi-stage builds to reduce image size
- Node.js production dependencies only
- Nginx for efficient static file serving
- Gzip compression enabled

### Scale Services

Scale backend for high load:
```bash
docker compose up -d --scale backend=3
```

### Monitor Resource Usage

```bash
# View real-time stats
docker stats

# View specific container
docker stats gadmin-backend
```

## 📝 Development Mode

For local development with hot-reload:

1. Use docker compose for database only:
```bash
docker compose up -d mongodb redis
```

2. Run backend locally:
```bash
cd main/api
npm install
npm run dev
```

3. Run frontend locally:
```bash
cd main/frontend
npm install
npm run dev
```

## 🆘 Support

### Useful Resources
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Project README](README.md)
- [API Documentation](main/api/API_README.md)

### Getting Help

If you encounter issues:
1. Check the logs: `docker compose logs -f`
2. Verify configuration in .env file
3. Ensure all ports are available
4. Check Docker daemon is running: `docker ps`

---

**Last Updated:** 2026-02-04
**Version:** 1.0.0
