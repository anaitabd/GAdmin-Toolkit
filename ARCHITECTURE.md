# GAdmin Toolkit - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Web Browser                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              React Frontend (Port 3000)                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │ Login Page  │  │  Dashboard  │  │  User Management│   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  │         │                │                    │            │  │
│  │         └────────────────┴────────────────────┘            │  │
│  │                          │                                 │  │
│  │                    Zustand Store                           │  │
│  │                    (State Mgmt)                            │  │
│  └───────────────────────────┬─────────────────────────────────┘
│                               │ HTTPS/REST API                   │
└───────────────────────────────┼──────────────────────────────────┘
                                │
                                │ JWT Token Auth
                                │
┌───────────────────────────────┼──────────────────────────────────┐
│           Backend API (Port 3001)                                │
│  ┌────────────────────────────┴─────────────────────────────┐   │
│  │              Express.js Server                            │   │
│  │                                                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │ Auth Routes  │  │ User Routes  │  │Status Routes │   │   │
│  │  │ /api/auth/*  │  │ /api/users/* │  │/api/status/* │   │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │   │
│  │         │                  │                  │           │   │
│  │  ┌──────┴──────────────────┴──────────────────┴───────┐  │   │
│  │  │              Middleware Layer                       │  │   │
│  │  │  • JWT Authentication                               │  │   │
│  │  │  • Request Validation (Joi)                         │  │   │
│  │  │  • Rate Limiting                                    │  │   │
│  │  │  • CORS                                             │  │   │
│  │  │  • Security Headers (Helmet)                        │  │   │
│  │  └─────────────────────────┬───────────────────────────┘  │   │
│  │                             │                              │   │
│  │  ┌──────────────────────────┴──────────────────────────┐  │   │
│  │  │         Google Workspace Service                    │  │   │
│  │  │  • User Creation                                    │  │   │
│  │  │  • User Deletion                                    │  │   │
│  │  │  • User Listing                                     │  │   │
│  │  │  • Bulk Operations                                  │  │   │
│  │  └─────────────────────────┬───────────────────────────┘  │   │
│  └────────────────────────────┼──────────────────────────────┘   │
└───────────────────────────────┼──────────────────────────────────┘
                                │
                                │ Google APIs
                                │ (Service Account)
┌───────────────────────────────┼──────────────────────────────────┐
│                Google Workspace Admin                            │
│  ┌────────────────────────────┴─────────────────────────────┐   │
│  │              Admin SDK API                                │   │
│  │  • Directory API                                          │   │
│  │  • User Management                                        │   │
│  │  • Domain Operations                                      │   │
│  └───────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

## Component Details

### Frontend (React + Vite)

**Technology Stack:**
- React 18 - UI framework
- Vite - Build tool and dev server
- Zustand - Lightweight state management
- Axios - HTTP client
- React Router - Client-side routing

**Key Components:**
- `App.jsx` - Main application router
- `LoginPage.jsx` - Authentication page
- `DashboardPage.jsx` - Main dashboard with tabs
- `Navbar.jsx` - Navigation bar
- `PrivateRoute.jsx` - Protected route wrapper

**State Management:**
- `useAuthStore` - Authentication state (user, token)
- `useUsersStore` - Users data and loading states

### Backend (Node.js + Express)

**Technology Stack:**
- Express.js - Web framework
- googleapis - Google Workspace integration
- jsonwebtoken - JWT authentication
- bcryptjs - Password hashing
- Joi - Input validation
- Helmet - Security headers
- CORS - Cross-origin support
- express-rate-limit - Rate limiting

**API Routes:**

```
/health                    GET    - Health check
/api/auth/login           POST   - User login
/api/auth/verify          GET    - Token verification
/api/users                GET    - List users
/api/users                POST   - Create single user
/api/users                DELETE - Delete all users
/api/users/:userKey       DELETE - Delete specific user
/api/users/bulk           POST   - Create multiple users
/api/users/upload         POST   - Upload CSV file
/api/users/generate       POST   - Generate random users
/api/status/operation     POST   - Create operation tracker
/api/status/:operationId  GET    - Get operation status
/api/status/:operationId  PUT    - Update operation status
/api/status/:operationId  DELETE - Delete operation
```

**Services:**
- `googleWorkspace.js` - Google Workspace API integration

**Middleware:**
- `auth.js` - JWT token verification
- `validator.js` - Request validation

### Security Features

**Authentication:**
- JWT tokens with configurable expiration
- Bcrypt password hashing (10 rounds)
- Token stored in localStorage
- Automatic logout on 401 responses

**Authorization:**
- Role-based access (admin role)
- Protected API endpoints
- Frontend route protection

**Input Validation:**
- Joi schemas for all inputs
- Email format validation
- Password strength requirements
- File upload size limits

**Rate Limiting:**
- 100 requests per 15 minutes per IP
- Configurable via environment variables

**Security Headers:**
- Helmet.js for security headers
- CORS with configurable origins
- Content Security Policy

**Data Protection:**
- Environment variables for sensitive data
- Credentials stored outside repository
- Safe localStorage parsing

## Data Flow

### User Creation Flow

```
1. User fills form in UI
   ↓
2. Frontend validates input
   ↓
3. POST /api/users with JWT token
   ↓
4. Backend validates token
   ↓
5. Backend validates request body
   ↓
6. Google Workspace Service creates user
   ↓
7. Response sent back to frontend
   ↓
8. UI updates and shows success message
```

### Bulk User Creation Flow

```
1. User uploads CSV file or generates users
   ↓
2. Frontend sends file/data to backend
   ↓
3. Backend parses CSV or generates data
   ↓
4. Creates users one by one with delay
   ↓
5. Tracks success/failed operations
   ↓
6. Returns summary to frontend
   ↓
7. UI displays results
```

## Deployment Options

### Option 1: Traditional Deployment

**Backend:**
```bash
# Install dependencies
cd backend && npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start with PM2
pm2 start server.js --name gadmin-backend
```

**Frontend:**
```bash
# Build production bundle
cd frontend && npm run build

# Serve with nginx
# Point nginx to frontend/dist/
```

### Option 2: Docker Deployment

```bash
# Configure environment
cp .env.docker.example .env.docker
# Edit .env.docker

# Start all services
docker-compose up -d
```

### Option 3: Cloud Platforms

**Backend Deployment:**
- Heroku, Render, Railway
- AWS Elastic Beanstalk
- Google Cloud Run
- Azure App Service

**Frontend Deployment:**
- Vercel, Netlify
- AWS S3 + CloudFront
- Google Cloud Storage
- Azure Static Web Apps

## Environment Configuration

### Backend (.env)

```
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
JWT_SECRET=your-strong-random-secret
JWT_EXPIRES_IN=24h
GOOGLE_ADMIN_EMAIL=admin@yourdomain.com
GOOGLE_CREDENTIALS_PATH=./config/cred.json
```

### Frontend (Vite env)

```
VITE_API_BASE_URL=https://your-api-domain.com
```

## Database (Future Enhancement)

Currently, the application is stateless with:
- JWT tokens stored client-side
- User data fetched from Google Workspace
- Operation tracking in-memory

**Potential Database Integration:**
- PostgreSQL/MySQL for:
  - Operation logs and history
  - Audit trails
  - User preferences
  - Scheduled tasks
- Redis for:
  - Session management
  - Rate limiting
  - Caching

## Monitoring & Logging

**Current Implementation:**
- Console logging
- Error tracking in responses
- Operation status tracking

**Recommended Enhancements:**
- Winston/Bunyan for structured logging
- Sentry for error tracking
- Prometheus metrics
- Health check endpoints

## Scalability Considerations

**Current State:**
- Single instance backend
- Synchronous user operations
- In-memory operation tracking

**Scaling Options:**
- Load balancer for multiple backend instances
- Redis for shared session state
- Message queue (Bull, RabbitMQ) for async operations
- Database for persistent operation tracking
- CDN for frontend static assets

## Security Best Practices

1. **Never commit credentials** - Use .env files
2. **Rotate JWT secret** regularly
3. **Use HTTPS** in production
4. **Keep dependencies updated**
5. **Enable rate limiting** appropriately
6. **Monitor API usage**
7. **Regular security audits**
8. **Implement audit logging**
9. **Use strong passwords**
10. **Enable 2FA** for admin accounts (future)

## Backup & Recovery

**Google Workspace:**
- Data managed by Google
- Use Google Vault for data retention

**Application:**
- Backup environment configuration
- Version control for code
- Document API credentials securely
- Test disaster recovery procedures

## Performance Optimization

**Frontend:**
- Code splitting with React.lazy
- Image optimization
- Minification and compression
- CDN for static assets
- Service worker for offline support

**Backend:**
- Response caching
- Database query optimization
- Connection pooling
- Async operations
- Compression middleware

## Future Enhancements

1. **User Features:**
   - Email templates management
   - Scheduled user creation
   - User groups management
   - Custom user attributes
   - User suspension/reactivation

2. **Admin Features:**
   - Multi-admin support
   - Role-based permissions
   - Activity dashboard
   - Reporting and analytics
   - Audit logs

3. **Integration:**
   - Webhook notifications
   - Slack/Teams integration
   - LDAP/Active Directory sync
   - SSO support
   - API webhooks

4. **Operations:**
   - Background job processing
   - Scheduled tasks
   - Email notifications
   - Export functionality
   - Import validation

5. **Developer:**
   - API versioning
   - GraphQL endpoint
   - SDK libraries
   - Comprehensive tests
   - CI/CD pipeline
