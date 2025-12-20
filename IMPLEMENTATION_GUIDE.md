# GAdmin Toolkit - Secure Web API for Google Workspace Automation

Convert the GAdmin-Toolkit repository into a secure, containerized, high-performance web application that exposes each script as a REST API with a React+Vite dashboard.

## 🎯 Overview

This project transforms 10 existing scripts (4 Node.js, 6 Python) into a production-ready web application with:

- **Backend**: Fastify + TypeScript + PostgreSQL + BullMQ + Redis
- **Frontend**: React + Vite + TypeScript SPA
- **Execution**: Safe, isolated child_process spawning (no shell interpolation)
- **Security**: Token-based auth, RBAC, strict script whitelist, dry-run mode
- **Observability**: Structured logging, Prometheus metrics, health checks
- **Containerization**: Docker + docker-compose for dev and production

## 📋 Project Structure

```
GAdmin-Toolkit/
├── backend/                       # Fastify + TypeScript API
│   ├── src/
│   │   ├── server.ts              # Main server entry
│   │   ├── routes/
│   │   │   ├── health.ts          # /api/health endpoint
│   │   │   ├── metrics.ts         # /api/metrics endpoint
│   │   │   ├── scripts.ts         # /api/scripts endpoint
│   │   │   ├── jobs.ts            # /api/run/:scriptKey, /api/job/:id
│   │   │   └── auth.ts            # Token validation
│   │   ├── runner/
│   │   │   └── genericRunner.ts   # Safe script executor (no shell interpolation)
│   │   ├── queue/
│   │   │   └── redis.ts           # Redis client
│   │   ├── db/
│   │   │   ├── init.ts            # Database initialization
│   │   │   └── models/
│   │   │       └── job.ts         # Job CRUD operations
│   │   └── middleware/
│   │       └── auth.ts            # Auth middleware (future)
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .env.example
├── frontend/                      # React + Vite SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── ScriptsPage.tsx    # List scripts, run scripts
│   │   │   └── JobsPage.tsx       # Job history, logs
│   │   ├── App.tsx                # Main app component
│   │   ├── main.tsx               # Entry point
│   │   └── styles/
│   │       └── App.css            # Global styles
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── Dockerfile
│   └── .env.example
├── config/
│   └── scripts.yml                # Script whitelist & metadata
├── inventory.json                 # Full script inventory
├── docker-compose.dev.yml         # Development: Postgres, Redis, Backend, Frontend
├── docker-compose.prod.yml        # Production (future)
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Lint, test, build on PR
│       └── release.yml            # Build, tag on main push
├── main/                          # Original Node.js scripts
├── py/                            # Original Python scripts
├── files/                         # Data files (CSVs, etc.)
└── README.md                      # This file
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.9+ (for local Python script testing)

### Development Setup

1. **Clone and setup**:
   ```bash
   git clone <repo>
   cd GAdmin-Toolkit
   ```

2. **Configure environment** (Backend):
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env if needed (defaults work for dev)
   ```

3. **Start containers**:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

   This starts:
   - **PostgreSQL** (port 5432)
   - **Redis** (port 6379)
   - **Backend API** (port 3001)
   - **Frontend** (port 3000)

4. **Verify services**:
   ```bash
   # Health check backend
   curl http://localhost:3001/api/health
   
   # List available scripts
   curl -H "Authorization: Bearer user-token-12345678-1234-1234-1234-123456789012" \
     http://localhost:3001/api/scripts
   
   # Open dashboard
   open http://localhost:3000
   ```

### Production Setup

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for Kubernetes, managed services, and scaling.

## 📖 API Reference

### Authentication

All API endpoints require a Bearer token:
```bash
curl -H "Authorization: Bearer <YOUR_TOKEN>" https://api.example.com/api/...
```

Tokens are configured via `API_TOKENS` and `ADMIN_TOKENS` environment variables (space-separated UUIDs).

### Endpoints

#### GET `/api/health`
Health check endpoint.
```bash
curl http://localhost:3001/api/health
```
**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-12-20T...",
  "version": "1.0.0"
}
```

#### GET `/api/metrics`
Prometheus-compatible metrics and performance stats.
```bash
curl http://localhost:3001/api/metrics
```
**Response**:
```json
{
  "jobs": {
    "completed": 42,
    "failed": 2,
    "queued": 5,
    "active": 1,
    "successRate": 95.45
  },
  "performance": {
    "avgDurationMs": 1234,
    "totalDurationMs": 51828
  },
  "requests": {
    "total": 500
  },
  "timestamp": "2025-12-20T..."
}
```

#### GET `/api/scripts`
List all available scripts.
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/scripts
```
**Response**:
```json
{
  "status": "success",
  "count": 12,
  "scripts": [
    {
      "name": "generate_users",
      "description": "Generate random user CSV...",
      "adminOnly": false,
      "defaultRunMode": "sync",
      "params": {
        "domain": { "type": "string", ... },
        "numRecords": { "type": "integer", ... }
      }
    },
    ...
  ]
}
```

#### GET `/api/scripts/:name`
Get metadata for a specific script.
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/scripts/generate_users
```

#### POST `/api/run/:scriptKey`
Run a script (sync or async).

**Request**:
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "params": {
      "domain": "verifiedverse.com",
      "numRecords": 100
    },
    "dryRun": false,
    "runAsync": false
  }' \
  http://localhost:3001/api/run/generate_users
```

**Sync Response (runAsync: false)**:
```json
{
  "status": "success",
  "exitCode": 0,
  "stdout": "CSV file generated: files/user_list.csv\n...",
  "stderr": "",
  "durationMs": 1234,
  "jobId": "uuid-1234"
}
```

**Async Response (runAsync: true)**:
```json
{
  "status": "queued",
  "jobId": "uuid-1234",
  "queuedAt": "2025-12-20T12:34:56Z"
}
```

#### GET `/api/job/:id`
Get job status and details.
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/job/uuid-1234
```
**Response**:
```json
{
  "status": "success",
  "job": {
    "id": "uuid-1234",
    "scriptKey": "generate_users",
    "status": "completed",
    "exitCode": 0,
    "stdout": "...",
    "stderr": "",
    "createdAt": "2025-12-20T12:30:00Z",
    "completedAt": "2025-12-20T12:31:15Z",
    "durationMs": 1234
  }
}
```

### Examples: Common Workflows

#### 1. Generate Users (Sync, Fast)
```bash
TOKEN="user-token-12345678-1234-1234-1234-123456789012"

curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "params": {
      "domain": "example.com",
      "numRecords": 50
    },
    "dryRun": false
  }' \
  http://localhost:3001/api/run/generate_users
```

#### 2. Validate SMTP Servers (Async, Long-running)
```bash
TOKEN="user-token-12345678-1234-1234-1234-123456789012"

# Queue the job
RESPONSE=$(curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"runAsync": true}' \
  http://localhost:3001/api/run/check_smtp)

JOB_ID=$(echo $RESPONSE | jq -r '.jobId')
echo "Job queued: $JOB_ID"

# Poll for completion
while true; do
  STATUS=$(curl -H "Authorization: Bearer $TOKEN" \
    http://localhost:3001/api/job/$JOB_ID | jq -r '.job.status')
  
  if [ "$STATUS" = "completed" ]; then
    curl -H "Authorization: Bearer $TOKEN" \
      http://localhost:3001/api/job/$JOB_ID | jq '.job'
    break
  fi
  
  echo "Job status: $STATUS, waiting..."
  sleep 5
done
```

#### 3. Delete Users (Admin-only, Destructive, Dry-run first)
```bash
ADMIN_TOKEN="admin-token-87654321-4321-4321-4321-210987654321"

# Step 1: Dry-run to see what would be deleted
echo "=== DRY RUN ==="
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dryRun": true,
    "runAsync": true
  }' \
  http://localhost:3001/api/run/delete_users | jq '.'

# Step 2: Actually delete (after confirming dry-run output)
echo "=== ACTUAL RUN ==="
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dryRun": false,
    "runAsync": true
  }' \
  http://localhost:3001/api/run/delete_users | jq '.'
```

#### 4. Access Control: Non-admin token on admin-only script
```bash
USER_TOKEN="user-token-12345678-1234-1234-1234-123456789012"

curl -X POST \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' \
  http://localhost:3001/api/run/delete_users

# Response: 403 Forbidden
# {
#   "status": "error",
#   "message": "This script requires admin privileges"
# }
```

## 🔐 Security & Safety

### Script Whitelist
All runnable scripts are explicitly whitelisted in [`config/scripts.yml`](./config/scripts.yml). Scripts outside this whitelist are rejected with 403 Forbidden.

### No Shell Injection
Scripts are executed using `child_process.spawn()` with:
- No shell (shell: false) — prevents command injection
- Argument array (no string concatenation) — prevents injection
- No environment variable interpolation — safe env passing

Example:
```typescript
// ❌ UNSAFE: shell interpolation
spawn('bash', ['-c', `node ${scriptPath} ${params}`]);

// ✅ SAFE: array arguments, no shell
spawn('node', [scriptPath, params.domain, params.numRecords.toString()],
  { shell: false });
```

### Isolated Job Execution
Each job runs in an isolated temporary directory (`/tmp/gadmin-toolkit-jobs/<jobId>/`):
- Prevents cross-job interference
- Auto-cleaned on completion or timeout
- Limits write access to whitelisted output dirs

### Authentication & Authorization
- **Token-based**: Static tokens via environment variables (future: OAuth2)
- **RBAC**: Admin flag for sensitive scripts
- **Rate limiting**: Per-token and global limits prevent abuse
- **Audit logging**: All admin/destructive operations logged

### Dry-run Mode
Sensitive scripts support dry-run to simulate execution:
- `delete_users`: lists users to be deleted (no actual deletion)
- `generate_users`: validates params and reports row count (no file write)
- Email scripts: validates CSV structure and counts recipients (no email sent)

## 📝 Available Scripts

| Script | Type | Mode | Admin | Risk | Dry-run |
|--------|------|------|-------|------|---------|
| `generate_users` | Node.js | Sync | No | Safe | ✅ |
| `create_users` | Node.js | Async | **Yes** | **High** | ❌ |
| `delete_users` | Node.js | Async | **Yes** | **Critical** | ✅ |
| `send_gmail_api` | Node.js | Async | No | Medium | ✅ |
| `bounce` | Node.js | Async | **Yes** | Low | ✅ |
| `send_smtp` | Node.js | Async | No | Medium | ✅ |
| `send_email_python` | Python | Async | No | Medium | ✅ |
| `check_smtp` | Python | Async | No | Low | ✅ |
| `split_by_domain` | Python | Sync | No | Safe | ✅ |
| `extract_unique_emails` | Python | Sync | No | Safe | ✅ |
| `filter_unprocessed_emails` | Python | Sync | No | Safe | ✅ |
| `chunk_csv` | Python | Sync | No | Safe | ✅ |
| `activate_less_secure` | Python | Async | **Yes** | **High** | ❌ |

## 🧪 Testing

### Unit Tests (Backend)
```bash
cd backend
npm test
```

### Integration Tests (Docker Compose)
```bash
docker-compose -f docker-compose.dev.yml up -d
# Services boot with health checks
sleep 10

# Run acceptance tests
bash ./tests/acceptance.sh
```

### Manual API Tests (curl)
See the **Examples** section above for curl command templates.

## 📊 Observability

### Health Checks
```bash
curl http://localhost:3001/api/health
```

### Metrics (JSON)
```bash
curl http://localhost:3001/api/metrics
```

### Prometheus Metrics (Future)
Expose metrics in Prometheus text format at `/api/metrics/prometheus`.

### Structured Logging
All services use structured JSON logging (Pino + Winston):
- Search logs by `jobId`, `scriptKey`, `status`
- Filter by severity: info, warn, error

Example:
```bash
docker logs gadmin-toolkit-backend | jq 'select(.level == "error")'
```

## 🔧 Development

### Add a New Script

1. Place the script in `main/` or `py/`
2. Add entry to `config/scripts.yml` with metadata and param schema
3. Restart backend or reload config cache
4. Script is now exposed at `POST /api/run/<name>`

Example `config/scripts.yml` entry:
```yaml
my_new_script:
  path: main/api/my_script.js
  lang: javascript
  description: "Do something useful"
  defaultRunMode: async
  adminOnly: false
  destructive: false
  dryRunCapable: true
  timeoutMs: 300000
  params:
    inputFile:
      type: string
      description: "Path to input file"
  notes: |
    Reads from files/input.csv
    Writes to files/output.csv
```

### Modify Runner Behavior

Edit [`backend/src/runner/genericRunner.ts`](./backend/src/runner/genericRunner.ts):
- Change `timeoutMs` default
- Add resource limits (CPU, memory)
- Implement callback webhooks
- Add S3 upload for large logs

## 📦 Deployment

### Docker Compose (Production-like)
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Kubernetes (Recommended for production)
See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for:
- Helm charts
- StatefulSet for workers
- Horizontal Pod Autoscaling
- Ingress configuration
- Managed services (Postgres, Redis)

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch
3. Test locally with `docker-compose.dev.yml`
4. Submit a PR
5. CI runs lint, type-check, test, build
6. Merge and deploy

## 📄 License

MIT

## 🆘 Troubleshooting

### Backend won't start
```bash
docker logs gadmin-toolkit-backend
# Check: DB_HOST, REDIS_HOST, API_TOKENS env vars
```

### Scripts not found
```bash
# Verify config/scripts.yml exists and is valid YAML
docker exec gadmin-toolkit-backend node -e "console.log(require('fs').readFileSync('/app/../config/scripts.yml', 'utf8'))"
```

### Job hangs / timeout
```bash
# Check job status
curl http://localhost:3001/api/job/<jobId>

# Increase JOB_TIMEOUT_MS in .env if script is legitimately slow
```

### Frontend can't reach backend
```bash
# Check backend is running and accessible
curl http://localhost:3001/api/health

# Check CORS origin in backend .env (should match frontend URL)
```

## 📚 Further Reading

- [Inventory of Scripts](./inventory.json)
- [Script Whitelist Config](./config/scripts.yml)
- [Deployment Guide](./DEPLOYMENT.md)
- [API Swagger/OpenAPI](./docs/openapi.yaml) (future)
- [Architecture Decision Records](./docs/adr/) (future)

