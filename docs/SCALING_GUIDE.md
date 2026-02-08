# Application Scaling Guide

## Overview
This guide provides recommendations for scaling the GAdmin-Toolkit application to handle increased load, more users, and higher email volumes.

## Current Architecture

### Components
1. **Node.js API Server**: Express-based REST API
2. **PostgreSQL Database**: Relational database for data storage
3. **React Frontend**: Single-page application
4. **Job Workers**: Child processes for background tasks
5. **Email Providers**: Gmail API and SMTP

## Scaling Strategies

### 1. Horizontal Scaling (Recommended)

#### Application Tier
- **Deploy multiple API server instances** behind a load balancer
- Use PM2 or similar process managers for clustering
- Implement session-less architecture (stateless APIs)
- Store job state in database, not in-memory

**Implementation Steps:**
```bash
# Install PM2
npm install -g pm2

# Start multiple instances
cd main/api
pm2 start server.js -i max  # max = number of CPU cores

# Monitor
pm2 monit
```

#### Load Balancer Options
- **NGINX**: Open-source, high-performance
- **HAProxy**: Feature-rich load balancer
- **AWS ALB**: Managed service (if on AWS)
- **Google Cloud Load Balancing**: Managed service (if on GCP)

**NGINX Configuration Example:**
```nginx
upstream api_servers {
    least_conn;
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    listen 80;
    location /api {
        proxy_pass http://api_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. Database Scaling

#### Read Replicas
- Set up PostgreSQL read replicas for read-heavy operations
- Direct read queries to replicas
- Keep writes on primary database

**Connection Pooling:**
```javascript
const { Pool } = require('pg');
const pool = new Pool({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    max: 20, // Maximum pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
```

#### Database Optimization
1. **Indexing**: Ensure all frequently queried columns are indexed
2. **Query optimization**: Use EXPLAIN ANALYZE to identify slow queries
3. **Partitioning**: Partition large tables (email_logs, click_tracking) by date
4. **Archiving**: Move old data to archive tables

**Partitioning Example:**
```sql
-- Partition email_logs by month
CREATE TABLE email_logs_2024_01 PARTITION OF email_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### 3. Caching Strategy

#### Redis Implementation
Add Redis for caching and session management

```bash
npm install redis ioredis
```

**Use Cases:**
- Cache frequently accessed data (email templates, settings)
- Store job progress for faster updates
- Implement rate limiting
- Session storage (if needed)

**Example:**
```javascript
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

// Cache email templates
async function getTemplate(id) {
    const cached = await redis.get(`template:${id}`);
    if (cached) return JSON.parse(cached);
    
    const template = await db.query('SELECT * FROM email_templates WHERE id = $1', [id]);
    await redis.setex(`template:${id}`, 3600, JSON.stringify(template));
    return template;
}
```

### 4. Job Queue System

#### Migrate to Message Queue
Replace child_process.fork() with a robust job queue

**Recommended Options:**
- **Bull**: Redis-based queue for Node.js
- **BullMQ**: Next-gen Bull with better TypeScript support
- **RabbitMQ**: Enterprise-grade message broker
- **AWS SQS**: Managed queue service

**Bull Implementation Example:**
```javascript
const Queue = require('bull');
const campaignQueue = new Queue('campaigns', process.env.REDIS_URL);

// Producer
await campaignQueue.add('send-campaign', {
    campaignId: 123,
    provider: 'gmail_api'
}, {
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 2000
    }
});

// Worker
campaignQueue.process('send-campaign', async (job) => {
    const { campaignId, provider } = job.data;
    await sendCampaignEmails(campaignId, provider, (progress) => {
        job.progress(progress);
    });
});
```

### 5. Email Sending Optimization

#### Provider Rotation
- Use multiple email providers
- Rotate between providers to distribute load
- Implement failover mechanisms

**Example:**
```javascript
const providers = [
    { name: 'sendgrid', limit: 10000, sent: 0 },
    { name: 'ses', limit: 50000, sent: 0 },
    { name: 'mailgun', limit: 5000, sent: 0 }
];

function selectProvider() {
    return providers.find(p => p.sent < p.limit) || providers[0];
}
```

#### Rate Limiting
- Implement per-provider rate limits
- Use token bucket or sliding window algorithms
- Monitor and respect provider limits

### 6. Monitoring and Observability

#### Essential Metrics
- API response times
- Database query performance
- Job queue length and processing time
- Email delivery rates
- Error rates and types
- System resources (CPU, memory, disk)

#### Recommended Tools
- **Prometheus + Grafana**: Metrics and dashboards
- **ELK Stack**: Log aggregation and analysis
- **Datadog**: All-in-one monitoring (paid)
- **New Relic**: APM and infrastructure monitoring (paid)

**Basic Prometheus Integration:**
```javascript
const promClient = require('prom-client');
const register = new promClient.Registry();

// Define metrics
const httpDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code']
});

register.registerMetric(httpDuration);

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});
```

### 7. Infrastructure Recommendations

#### Cloud Providers
**AWS Setup:**
- EC2 for API servers (use Auto Scaling)
- RDS for PostgreSQL (with read replicas)
- ElastiCache for Redis
- SQS for job queue
- CloudWatch for monitoring
- S3 for file storage

**Cost Estimate (AWS):**
- 2x t3.medium EC2 instances: ~$60/month
- RDS PostgreSQL db.t3.medium: ~$80/month
- ElastiCache t3.micro: ~$12/month
- Load Balancer: ~$20/month
- **Total**: ~$172/month (excluding email sending costs)

**Google Cloud Setup:**
- Compute Engine for API servers (with autoscaling)
- Cloud SQL for PostgreSQL
- Memorystore for Redis
- Cloud Tasks or Pub/Sub for job queue
- Cloud Monitoring

**Docker + Kubernetes:**
```yaml
# docker-compose.yml for development
version: '3.8'
services:
  api:
    build: ./main/api
    ports:
      - "3000-3003:3000"
    environment:
      - PGHOST=db
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    deploy:
      replicas: 4
  
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: gadmin
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - api

volumes:
  pgdata:
```

### 8. Performance Optimization

#### Database Queries
- Use prepared statements
- Batch inserts where possible
- Avoid N+1 queries
- Use database transactions appropriately

**Batch Insert Example:**
```javascript
// Instead of multiple inserts
for (const email of emails) {
    await query('INSERT INTO email_data (to_email) VALUES ($1)', [email]);
}

// Use single batch insert
const values = emails.map((email, i) => `($${i + 1})`).join(',');
const params = emails;
await query(`INSERT INTO email_data (to_email) VALUES ${values}`, params);
```

#### API Optimization
- Implement response compression (gzip)
- Use HTTP/2
- Implement proper caching headers
- Paginate large result sets
- Use field selection (return only needed fields)

### 9. Security at Scale

- Implement rate limiting per IP/user
- Use API keys for authentication
- Enable HTTPS/TLS everywhere
- Regular security updates
- Database encryption at rest
- Secrets management (AWS Secrets Manager, HashiCorp Vault)
- DDoS protection (Cloudflare, AWS Shield)

### 10. Disaster Recovery

#### Backup Strategy
- Automated daily database backups
- Point-in-time recovery capability
- Store backups in multiple regions
- Regular backup restoration tests

**PostgreSQL Backup:**
```bash
# Daily backup cron job
0 2 * * * pg_dump -h $PGHOST -U $PGUSER $PGDATABASE | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz
```

#### High Availability
- Multi-AZ deployment
- Automated failover
- Health checks and auto-recovery
- Regular disaster recovery drills

## Scaling Roadmap

### Phase 1: Immediate (0-100k emails/day)
- ✅ Current setup with Gmail API
- Add connection pooling
- Implement basic monitoring
- Set up automated backups

### Phase 2: Short-term (100k-500k emails/day)
- Migrate to dedicated email service (Amazon SES)
- Implement Redis caching
- Add read replicas for database
- Deploy multiple API instances with load balancer

### Phase 3: Medium-term (500k-1M emails/day)
- Migrate to message queue system (Bull/RabbitMQ)
- Implement database partitioning
- Add comprehensive monitoring (Prometheus/Grafana)
- Multi-region deployment preparation

### Phase 4: Long-term (1M+ emails/day)
- Multi-provider email sending
- Kubernetes orchestration
- Multi-region active-active deployment
- Advanced analytics and ML-based optimization

## Cost Projections

| Daily Volume | Infrastructure | Email Provider | Total/Month |
|--------------|---------------|----------------|-------------|
| 10k emails | $50 | $10 | $60 |
| 100k emails | $200 | $100 | $300 |
| 500k emails | $500 | $200 | $700 |
| 1M emails | $1,000 | $300 | $1,300 |
| 5M emails | $2,500 | $500 | $3,000 |

*Estimates based on AWS pricing and Amazon SES*

## Performance Targets

| Metric | Current | Target (Optimized) |
|--------|---------|-------------------|
| API Response Time | <200ms | <100ms |
| Email Send Rate | 300/min | 10,000/min |
| Concurrent Users | 10 | 1,000 |
| Database Queries/sec | 100 | 1,000 |
| Job Processing | Serial | Parallel (10x) |

## Resources
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [12-Factor App Methodology](https://12factor.net/)
