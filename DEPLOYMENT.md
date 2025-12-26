# Deployment Guide - GAdmin Toolkit

This guide covers deploying the GAdmin Toolkit web application to production.

## Prerequisites

- Node.js 16+ installed
- Google Workspace Admin account
- Google Cloud Project with Admin SDK enabled
- Service Account with domain-wide delegation
- Domain name (for production)
- SSL certificate (for HTTPS)

## Google Cloud Setup (Required)

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Note the Project ID

### 2. Enable Admin SDK API

1. Navigate to "APIs & Services" > "Library"
2. Search for "Admin SDK API"
3. Click "Enable"

### 3. Create Service Account

1. Navigate to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Name: `gadmin-toolkit-service`
4. Description: "Service account for GAdmin Toolkit"
5. Click "Create and Continue"
6. Grant role: "Service Account User"
7. Click "Done"

### 4. Create Service Account Key

1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Click "Create"
6. Save the downloaded JSON file as `cred.json`

### 5. Enable Domain-Wide Delegation

1. Click on your service account
2. Click "Show Advanced Settings"
3. Under "Domain-wide delegation", click "Enable"
4. Note the Client ID

### 6. Configure Google Workspace

1. Go to [Google Admin Console](https://admin.google.com/)
2. Navigate to "Security" > "API Controls"
3. Click "Manage Domain Wide Delegation"
4. Click "Add new"
5. Enter the Client ID from step 5
6. OAuth Scopes: `https://www.googleapis.com/auth/admin.directory.user`
7. Click "Authorize"

## Deployment Options

## Option 1: Traditional Server Deployment

### Backend Deployment

```bash
# 1. Clone repository
git clone https://github.com/anaitabd/GAdmin-Toolkit.git
cd GAdmin-Toolkit

# 2. Install backend dependencies
cd backend
npm ci --production

# 3. Create configuration directory
mkdir -p config

# 4. Copy your Google credentials
cp /path/to/your/cred.json config/cred.json

# 5. Create .env file
cat > .env << EOF
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h
GOOGLE_ADMIN_EMAIL=admin@yourdomain.com
GOOGLE_CREDENTIALS_PATH=./config/cred.json
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE_MB=10
EOF

# 6. Test the server
npm start

# 7. Install PM2 for production
npm install -g pm2

# 8. Start with PM2
pm2 start server.js --name gadmin-backend
pm2 save
pm2 startup
```

### Frontend Deployment

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Create production .env
cat > .env.production << EOF
VITE_API_BASE_URL=https://api.your-domain.com
EOF

# 3. Install dependencies and build
npm ci
npm run build

# 4. The built files are in dist/ directory
# Serve with nginx or any static file server
```

### Nginx Configuration

Create `/etc/nginx/sites-available/gadmin-toolkit`:

```nginx
# Backend API
server {
    listen 80;
    server_name api.your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    # SSL Configuration
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    root /path/to/GAdmin-Toolkit/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/gadmin-toolkit /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Option 2: Docker Deployment

### Using Docker Compose

```bash
# 1. Clone repository
git clone https://github.com/anaitabd/GAdmin-Toolkit.git
cd GAdmin-Toolkit

# 2. Create .env.docker file
cat > .env.docker << EOF
JWT_SECRET=$(openssl rand -base64 32)
GOOGLE_ADMIN_EMAIL=admin@yourdomain.com
EOF

# 3. Copy Google credentials
mkdir -p backend/config
cp /path/to/your/cred.json backend/config/cred.json

# 4. Build and start containers
docker-compose up -d

# 5. Check logs
docker-compose logs -f

# 6. Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

### Production Docker Setup

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: gadmin-backend
    restart: always
    environment:
      - NODE_ENV=production
      - PORT=3001
      - FRONTEND_URL=https://your-domain.com
      - JWT_SECRET=${JWT_SECRET}
      - GOOGLE_ADMIN_EMAIL=${GOOGLE_ADMIN_EMAIL}
      - GOOGLE_CREDENTIALS_PATH=/app/config/cred.json
    volumes:
      - ./backend/config:/app/config:ro
    networks:
      - gadmin-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: gadmin-frontend
    restart: always
    depends_on:
      - backend
    networks:
      - gadmin-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    container_name: gadmin-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - frontend
    networks:
      - gadmin-network

networks:
  gadmin-network:
    driver: bridge
```

## Option 3: Cloud Platform Deployment

### Heroku Deployment

**Backend:**

```bash
# 1. Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# 2. Login to Heroku
heroku login

# 3. Create Heroku app
cd backend
heroku create gadmin-toolkit-api

# 4. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set GOOGLE_ADMIN_EMAIL=admin@yourdomain.com
heroku config:set FRONTEND_URL=https://your-frontend-app.vercel.app

# 5. Upload Google credentials (base64 encoded)
cat config/cred.json | base64 | heroku config:set GOOGLE_CREDENTIALS_BASE64=-

# 6. Modify server.js to decode base64 credentials
# Add to backend/server.js before starting:
if (process.env.GOOGLE_CREDENTIALS_BASE64) {
  const fs = require('fs');
  const credentials = Buffer.from(
    process.env.GOOGLE_CREDENTIALS_BASE64, 
    'base64'
  ).toString('utf-8');
  fs.writeFileSync('./config/cred.json', credentials);
}

# 7. Deploy
git add .
git commit -m "Prepare for Heroku deployment"
git push heroku main

# 8. View logs
heroku logs --tail
```

**Frontend (Vercel):**

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Navigate to frontend
cd frontend

# 3. Build for production
npm run build

# 4. Deploy
vercel --prod

# 5. Set environment variable
vercel env add VITE_API_BASE_URL
# Enter: https://gadmin-toolkit-api.herokuapp.com
```

### AWS Deployment

**Backend (Elastic Beanstalk):**

```bash
# 1. Install EB CLI
pip install awsebcli

# 2. Initialize EB
cd backend
eb init -p node.js gadmin-toolkit-api

# 3. Create environment
eb create production

# 4. Set environment variables
eb setenv NODE_ENV=production \
  JWT_SECRET=$(openssl rand -base64 32) \
  GOOGLE_ADMIN_EMAIL=admin@yourdomain.com \
  FRONTEND_URL=https://your-cloudfront-url.com

# 5. Upload credentials via S3 and configure path

# 6. Deploy
eb deploy

# 7. View logs
eb logs
```

**Frontend (S3 + CloudFront):**

```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Create S3 bucket
aws s3 mb s3://gadmin-toolkit-frontend

# 3. Configure bucket for static website
aws s3 website s3://gadmin-toolkit-frontend \
  --index-document index.html \
  --error-document index.html

# 4. Upload files
aws s3 sync dist/ s3://gadmin-toolkit-frontend --delete

# 5. Create CloudFront distribution
# Follow AWS Console to create distribution pointing to S3 bucket

# 6. Update bucket policy for CloudFront OAI
```

## Security Checklist

- [ ] Change default admin password immediately
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Enable HTTPS/SSL for all traffic
- [ ] Restrict CORS to specific origins
- [ ] Set appropriate rate limits
- [ ] Keep credentials file secure (never commit)
- [ ] Use environment variables for all secrets
- [ ] Enable firewall rules
- [ ] Regular security updates
- [ ] Monitor API usage
- [ ] Enable audit logging
- [ ] Backup configuration regularly

## Monitoring Setup

### PM2 Monitoring

```bash
# Install PM2 Plus (optional)
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Monitor
pm2 monit

# View logs
pm2 logs gadmin-backend
```

### Health Check Endpoint

The backend exposes `/health` endpoint:

```bash
curl https://api.your-domain.com/health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2025-12-26T22:00:00.000Z"
}
```

## Backup & Recovery

### Backup Configuration

```bash
# Backup .env file
cp backend/.env backend/.env.backup

# Backup Google credentials (encrypted)
tar -czf credentials.tar.gz backend/config/cred.json
gpg -c credentials.tar.gz
rm credentials.tar.gz
```

### Recovery

```bash
# Restore configuration
cp backend/.env.backup backend/.env

# Restore credentials
gpg credentials.tar.gz.gpg
tar -xzf credentials.tar.gz -C backend/config/
```

## Troubleshooting

### Backend Issues

**Server won't start:**
```bash
# Check if port is available
lsof -i :3001

# Check environment variables
cat .env

# Check credentials file
ls -la config/cred.json

# View logs
pm2 logs gadmin-backend --lines 100
```

**API returns 500 errors:**
- Check Google credentials are valid
- Verify service account has domain-wide delegation
- Check Google Admin email is correct
- View backend logs for details

### Frontend Issues

**Can't login:**
- Check backend is running
- Verify CORS configuration
- Check JWT_SECRET is set
- Verify default credentials

**API calls fail:**
- Check VITE_API_BASE_URL is correct
- Verify backend health endpoint
- Check browser console for errors

### Google API Issues

**Permission denied:**
- Verify service account has domain-wide delegation
- Check OAuth scope is correct
- Ensure admin email matches domain

**Rate limiting:**
- Implement exponential backoff
- Reduce concurrent requests
- Contact Google for quota increase

## Performance Optimization

### Backend

```bash
# Enable compression
npm install compression
```

Add to server.js:
```javascript
const compression = require('compression');
app.use(compression());
```

### Frontend

Build optimizations are already configured in Vite.

### Database (Future)

For better performance with large operations:
- Add Redis for caching
- Use PostgreSQL for operation logs
- Implement connection pooling

## Scaling

### Horizontal Scaling

1. Use load balancer (nginx, AWS ALB)
2. Run multiple backend instances
3. Use Redis for shared session state
4. Implement sticky sessions if needed

### Vertical Scaling

- Increase server resources
- Optimize database queries
- Use CDN for static assets
- Enable caching

## Maintenance

### Regular Tasks

- Update dependencies monthly
- Review security advisories
- Monitor disk space and logs
- Test backup/recovery procedures
- Review access logs for anomalies
- Rotate JWT secrets periodically

### Updates

```bash
# Update backend
cd backend
npm update
npm audit fix

# Update frontend
cd frontend
npm update
npm audit fix

# Rebuild
npm run build

# Deploy
pm2 restart gadmin-backend
```

## Support

For issues and questions:
- Review logs first
- Check [ARCHITECTURE.md](ARCHITECTURE.md) for system details
- Review [README_NEW.md](README_NEW.md) for usage
- Open GitHub issue with details

## Production Checklist

Before going live:

- [ ] Google Cloud setup complete
- [ ] Service account configured
- [ ] Domain-wide delegation enabled
- [ ] Backend deployed and tested
- [ ] Frontend deployed and tested
- [ ] HTTPS enabled
- [ ] Environment variables set
- [ ] Default password changed
- [ ] Monitoring configured
- [ ] Backup procedures tested
- [ ] Security checklist completed
- [ ] Documentation reviewed
- [ ] Team trained on usage
