# Docker Troubleshooting Guide

Common issues and solutions for running GAdmin-Toolkit with Docker.

## Quick Diagnostics

```bash
# Check if all services are running
docker compose ps

# View logs for all services
docker compose logs

# View logs for specific service
docker compose logs backend
docker compose logs frontend
docker compose logs mongodb

# Check service health
docker inspect --format='{{.State.Health.Status}}' gadmin-backend
docker inspect --format='{{.State.Health.Status}}' gadmin-frontend
docker inspect --format='{{.State.Health.Status}}' gadmin-mongodb
```

---

## Common Issues

### 1. Port Already in Use

**Error:** `Bind for 0.0.0.0:80 failed: port is already allocated`

**Solution:**

Edit `.env` file and change the port:

```bash
# For frontend (default 80)
FRONTEND_PORT=8080

# For backend (default 3000)
BACKEND_PORT=3001

# For MongoDB (default 27017)
MONGO_PORT=27018

# For Redis (default 6379)
REDIS_PORT=6380
```

Then restart:
```bash
docker compose down
docker compose up -d
```

---

### 2. JWT_SECRET Not Set

**Error:** `ERROR: JWT_SECRET environment variable is required!`

**Solution:**

Generate a secure JWT secret:

```bash
# Generate a secure secret
openssl rand -base64 64

# Or use this command to directly update .env
echo "JWT_SECRET=$(openssl rand -base64 64)" >> .env
```

Then restart the backend:
```bash
docker compose restart backend
```

---

### 3. MongoDB Connection Failed

**Error:** `MongoServerError: Authentication failed`

**Solution:**

1. Stop all services and remove volumes:
```bash
docker compose down -v
```

2. Update MongoDB credentials in `.env`:
```bash
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your_new_secure_password
```

3. Start services again:
```bash
docker compose up -d
```

---

### 4. Backend Service Unhealthy

**Error:** Backend container status shows "unhealthy"

**Solution:**

1. Check backend logs:
```bash
docker compose logs backend
```

2. Common causes:
   - MongoDB not ready: Wait 30-60 seconds for MongoDB to initialize
   - Missing JWT_SECRET: Set it in .env
   - Port conflict: Change BACKEND_PORT in .env

3. Restart backend:
```bash
docker compose restart backend
```

---

### 5. Frontend Can't Connect to Backend

**Error:** Frontend shows network errors or can't login

**Solution:**

1. Verify backend is healthy:
```bash
curl http://localhost:3000/health
```

2. Check if API proxy is working:
```bash
curl http://localhost/api/
```

3. Check nginx logs:
```bash
docker compose logs frontend
```

4. If nginx config is wrong, rebuild:
```bash
docker compose up -d --build frontend
```

---

### 6. Permission Denied Errors

**Error:** `Permission denied` when accessing files in container

**Solution:**

This usually happens with volume mounts. Fix permissions:

```bash
# Stop services
docker compose down

# Fix permissions (Linux/Mac)
sudo chown -R $USER:$USER .

# Restart services
docker compose up -d
```

---

### 7. Build Failed - Network Issues

**Error:** `fetch https://dl-cdn.alpinelinux.org/alpine/... Permission denied`

**Solution:**

This indicates network issues during build. Try:

1. Check your internet connection
2. Try building again (sometimes it's temporary):
```bash
docker compose build --no-cache
```

3. If behind a proxy, configure Docker to use it:
```bash
# Create ~/.docker/config.json
{
  "proxies": {
    "default": {
      "httpProxy": "http://proxy.example.com:8080",
      "httpsProxy": "http://proxy.example.com:8080"
    }
  }
}
```

---

### 8. Container Keeps Restarting

**Error:** Container status shows "Restarting"

**Solution:**

1. Check logs for the restarting container:
```bash
docker compose logs <service-name>
```

2. Common causes:
   - Application crash: Check application logs
   - Health check failing: Check health endpoint
   - Insufficient resources: Free up memory/disk space

3. Stop the problematic service:
```bash
docker compose stop <service-name>
```

4. Fix the issue based on logs, then start again:
```bash
docker compose start <service-name>
```

---

### 9. Out of Disk Space

**Error:** `no space left on device`

**Solution:**

1. Check Docker disk usage:
```bash
docker system df
```

2. Remove unused images and containers:
```bash
docker system prune -a
```

3. Remove unused volumes (careful - this deletes data):
```bash
docker volume prune
```

4. If you want to keep current project data:
```bash
docker system prune -a --volumes --filter "label!=com.docker.compose.project=gadmin-toolkit"
```

---

### 10. Admin User Already Exists

**Error:** `Admin user 'admin' already exists`

**Solution:**

To reset admin password:

1. Connect to MongoDB:
```bash
docker compose exec mongodb mongosh -u admin -p your_password
```

2. Delete existing admin:
```javascript
use gadmin-toolkit
db.admin.deleteOne({username: "admin"})
exit
```

3. Create new admin:
```bash
docker compose exec backend node setup-admin.js admin NewPassword123!
```

---

### 11. Cannot Access Frontend

**Error:** Browser shows "This site can't be reached"

**Solution:**

1. Check if frontend container is running:
```bash
docker compose ps frontend
```

2. Check frontend logs:
```bash
docker compose logs frontend
```

3. Verify port mapping:
```bash
docker compose port frontend 80
```

4. Try accessing on the mapped port:
```bash
# If output shows 0.0.0.0:8080 instead of 80
curl http://localhost:8080
```

---

### 12. Database Data Lost After Restart

**Error:** Data disappears when containers restart

**Solution:**

This happens if you used `docker compose down -v` which removes volumes.

1. Always use `docker compose down` (without -v) to preserve data

2. To backup data before removing volumes:
```bash
# Backup MongoDB
docker compose exec mongodb mongodump --out=/data/backup --authenticationDatabase=admin -u admin -p your_password

# Copy backup to host
docker cp gadmin-mongodb:/data/backup ./mongodb-backup-$(date +%Y%m%d)

# Now you can safely remove volumes
docker compose down -v
```

3. To restore:
```bash
# Start services
docker compose up -d

# Copy backup to container
docker cp ./mongodb-backup-YYYYMMDD gadmin-mongodb:/data/restore

# Restore
docker compose exec mongodb mongorestore /data/restore --authenticationDatabase=admin -u admin -p your_password
```

---

## Advanced Troubleshooting

### View Container Details

```bash
# Full container details
docker inspect gadmin-backend

# Just health check
docker inspect --format='{{json .State.Health}}' gadmin-backend | jq

# Container resource usage
docker stats gadmin-backend
```

### Execute Commands in Container

```bash
# Open shell in container
docker compose exec backend sh

# Run specific command
docker compose exec backend node --version
docker compose exec backend npm list

# Check environment variables
docker compose exec backend env
```

### Network Debugging

```bash
# Check if containers can communicate
docker compose exec backend ping mongodb
docker compose exec frontend ping backend

# Check network configuration
docker network ls
docker network inspect gadmin-toolkit_gadmin-network
```

### Force Rebuild

```bash
# Rebuild everything from scratch
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## Getting More Help

### Enable Debug Logging

Edit `docker-compose.yml` and add:

```yaml
services:
  backend:
    environment:
      DEBUG: "*"
      NODE_ENV: development
```

Then restart:
```bash
docker compose up -d
```

### Collect Logs for Support

```bash
# Save all logs to a file
docker compose logs > docker-logs.txt

# Check service status
docker compose ps > docker-status.txt

# Check configuration
docker compose config > docker-config.txt

# Send these files when asking for help
```

---

## Prevention Tips

1. **Always check logs first:**
   ```bash
   docker compose logs -f
   ```

2. **Use health checks:**
   ```bash
   docker compose ps
   ```

3. **Regular backups:**
   ```bash
   # Weekly MongoDB backup
   docker compose exec mongodb mongodump --out=/data/backup
   ```

4. **Keep Docker updated:**
   ```bash
   docker --version
   docker compose version
   ```

5. **Monitor resources:**
   ```bash
   docker stats
   ```

---

**Still having issues?** 

- Check the main [DOCKER_GUIDE.md](DOCKER_GUIDE.md)
- Review [README.md](README.md) for setup instructions
- Open an issue on GitHub with your logs
