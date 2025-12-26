# 🏗️ Architecture Documentation

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Browser                          │
│                    (React SPA + Dark Mode)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             │ (JWT Token in Header)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Nginx / Load Balancer                    │
│                    (Static Files + API Proxy)                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
┌──────────────────────┐      ┌──────────────────────┐
│   Frontend Server    │      │   Backend API        │
│   (Nginx + React)    │      │   (Express.js)       │
│   Port: 80/3000      │      │   Port: 5000         │
└──────────────────────┘      └──────────┬───────────┘
                                         │
                        ┌────────────────┼────────────────┐
                        │                │                │
                        ▼                ▼                ▼
              ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
              │   Google    │  │   Redis     │  │   File      │
              │ Workspace   │  │  (Queue)    │  │  Storage    │
              │     API     │  │ Port: 6379  │  │  (CSV/Logs) │
              └─────────────┘  └─────────────┘  └─────────────┘
                     │
                     ▼
         ┌─────────────────────┐
         │   Python Scripts    │
         │   (Optional)        │
         └─────────────────────┘
```

---

## Component Architecture

### Frontend Architecture (React)

```
frontend/
├── UI Layer (React Components)
│   ├── Pages (Route-based views)
│   ├── Components (Reusable UI)
│   └── Layout (Navigation & Shell)
│
├── State Management (Zustand)
│   ├── Auth Store (User session)
│   ├── App Store (Global state)
│   └── Cache (API responses)
│
├── Services Layer
│   ├── API Client (Axios)
│   ├── Auth Service
│   └── User Service
│
└── Utilities
    ├── Validators
    ├── Formatters
    └── Helpers
```

### Backend Architecture (Node.js + Express)

```
backend/
├── API Layer (Express Routes)
│   ├── Auth Routes
│   ├── User Routes
│   └── SMTP Routes (future)
│
├── Controllers (Request Handlers)
│   ├── Auth Controller
│   ├── User Controller
│   └── Error Controller
│
├── Services (Business Logic)
│   ├── Auth Service
│   ├── User Service
│   ├── Google Service
│   └── Email Service (future)
│
├── Middleware
│   ├── Authentication
│   ├── Authorization
│   ├── Validation
│   ├── Rate Limiting
│   └── Error Handling
│
├── Models (Data Layer)
│   ├── User Model
│   └── Audit Log Model
│
└── Utilities
    ├── Logger (Winston)
    ├── CSV Parser
    └── Helpers
```

---

## Data Flow

### Authentication Flow

```
1. User enters credentials in Login Page
   ↓
2. Frontend sends POST /api/auth/login
   ↓
3. Backend validates credentials (bcrypt)
   ↓
4. Backend generates JWT token
   ↓
5. Frontend stores token in localStorage
   ↓
6. Token included in all subsequent requests
   ↓
7. Backend verifies token on protected routes
```

### User Creation Flow

```
1. Admin clicks "Generate Users"
   ↓
2. Frontend shows modal with form
   ↓
3. User enters domain + count
   ↓
4. Frontend sends POST /api/users/generate
   ↓
5. Backend generates CSV data
   ↓
6. Backend saves to files/user_list.csv
   ↓
7. Admin clicks "Create Users"
   ↓
8. Frontend sends POST /api/users/create
   ↓
9. Backend reads CSV file
   ↓
10. Backend calls Google Workspace API
    ↓
11. Progress updates sent to frontend
    ↓
12. Results displayed in UI
```

---

## Security Architecture

### Authentication & Authorization

```
┌──────────────┐
│   Client     │
└──────┬───────┘
       │ 1. Login Request (username, password)
       ▼
┌──────────────────────────────────────┐
│  Auth Controller                     │
│  • Validate input                    │
│  • Check credentials                 │
└──────┬───────────────────────────────┘
       │ 2. Valid?
       ▼
┌──────────────────────────────────────┐
│  Auth Service                        │
│  • bcrypt.compare(password, hash)    │
│  • Generate JWT token                │
└──────┬───────────────────────────────┘
       │ 3. Return token
       ▼
┌──────────────┐
│   Client     │ Stores token
└──────┬───────┘
       │ 4. Subsequent requests
       │    Authorization: Bearer <token>
       ▼
┌──────────────────────────────────────┐
│  Auth Middleware                     │
│  • Verify JWT signature              │
│  • Check expiration                  │
│  • Decode user info                  │
└──────┬───────────────────────────────┘
       │ 5. Valid token?
       ▼
┌──────────────────────────────────────┐
│  Admin Middleware                    │
│  • Check user role                   │
│  • Allow/Deny access                 │
└──────┬───────────────────────────────┘
       │ 6. Access granted
       ▼
┌──────────────────────────────────────┐
│  Protected Controller                │
│  • Execute business logic            │
└──────────────────────────────────────┘
```

### Security Layers

1. **Transport Layer**
   - HTTPS (TLS 1.3)
   - Secure cookies
   - CORS policy

2. **Application Layer**
   - JWT tokens (7 day expiry)
   - bcrypt password hashing
   - Input validation
   - XSS protection
   - CSRF tokens
   - Rate limiting

3. **API Layer**
   - Authentication required
   - Role-based access
   - Request validation
   - Audit logging

4. **Data Layer**
   - Encrypted credentials
   - Secure file permissions
   - Environment variables

---

## API Architecture

### RESTful API Design

```
/api
├── /auth
│   ├── POST   /login          (Public)
│   ├── POST   /register       (Admin)
│   ├── GET    /me             (Authenticated)
│   └── POST   /verify         (Public)
│
├── /users
│   ├── POST   /generate       (Admin)
│   ├── POST   /create         (Admin)
│   ├── POST   /create-single  (Admin)
│   ├── GET    /list           (Admin)
│   ├── DELETE /:userKey       (Admin)
│   ├── DELETE /delete-all     (Admin)
│   └── POST   /import-csv     (Admin)
│
├── /logs (future)
│   ├── GET    /               (Admin)
│   └── GET    /audit          (Admin)
│
└── /stats (future)
    └── GET    /               (Admin)
```

### Response Format

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
```

---

## Database Architecture

### Current: In-Memory Storage

```javascript
// User storage
const users = new Map();
users.set('username', {
  username: 'admin',
  email: 'admin@example.com',
  password: 'hashed_password',
  role: 'admin',
  createdAt: Date
});
```

### Future: Database Integration

```
┌─────────────────┐
│   PostgreSQL    │
├─────────────────┤
│ • users         │
│ • sessions      │
│ • audit_logs    │
│ • jobs          │
└─────────────────┘
```

---

## Logging Architecture

### Log Levels

1. **ERROR** - System errors, exceptions
2. **WARN** - Warning conditions
3. **INFO** - General information
4. **DEBUG** - Debugging information

### Log Types

```
logs/
├── app.log          # General application logs
├── error.log        # Error logs only
└── audit.log        # Security & audit events
```

### Log Format

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "info",
  "message": "User logged in",
  "service": "gadmin-toolkit",
  "username": "admin",
  "ip": "127.0.0.1"
}
```

---

## Deployment Architecture

### Development Environment

```
Developer Machine
├── Backend (localhost:5000)
│   └── npm run dev (nodemon)
├── Frontend (localhost:3000)
│   └── npm run dev (vite)
└── Files & Credentials (local)
```

### Production Environment (Docker)

```
┌────────────────────────────────────────┐
│           Docker Host                  │
│                                        │
│  ┌──────────────┐  ┌──────────────┐  │
│  │  Frontend    │  │   Backend    │  │
│  │  Container   │  │  Container   │  │
│  │  (Nginx)     │  │  (Node.js)   │  │
│  │  Port: 80    │  │  Port: 5000  │  │
│  └──────────────┘  └──────────────┘  │
│         │                  │          │
│  ┌──────────────────────────────┐    │
│  │     Redis Container          │    │
│  │     Port: 6379               │    │
│  └──────────────────────────────┘    │
│                                        │
│  Volumes:                              │
│  • /logs                               │
│  • /uploads                            │
│  • /files                              │
└────────────────────────────────────────┘
```

### Container Communication

```
frontend → nginx → proxy → backend:5000
backend → redis:6379
backend → google-apis.googleapis.com:443
```

---

## Scalability Architecture

### Current: Single Instance

```
Client → Backend → Google API
```

### Future: Horizontal Scaling

```
                    ┌→ Backend Instance 1
                    │
Client → Load Balancer ─→ Backend Instance 2
                    │
                    └→ Backend Instance 3
                            ↓
                    Shared Redis Queue
                            ↓
                    Google Workspace API
```

---

## Error Handling Architecture

### Error Flow

```
1. Error occurs in application
   ↓
2. Try-catch block captures error
   ↓
3. Error logged to Winston
   ↓
4. Custom error object created
   ↓
5. Error middleware processes
   ↓
6. Formatted response sent to client
   ↓
7. Frontend displays user-friendly message
```

### Error Types

1. **Validation Errors** (400)
   - Invalid input
   - Missing fields

2. **Authentication Errors** (401)
   - Invalid token
   - Expired token

3. **Authorization Errors** (403)
   - Insufficient permissions

4. **Not Found Errors** (404)
   - Resource not found

5. **Server Errors** (500)
   - Unexpected errors
   - Google API errors

---

## Monitoring Architecture

### Metrics to Track

1. **Performance**
   - API response time
   - Request throughput
   - Error rate

2. **Usage**
   - Active users
   - API calls per endpoint
   - User operations

3. **Security**
   - Failed login attempts
   - Token validations
   - Rate limit hits

4. **Resources**
   - CPU usage
   - Memory usage
   - Disk space

---

## Future Enhancements

### Planned Features

1. **WebSocket Integration**
   ```
   Client ←→ WebSocket Server ←→ Backend
   Real-time updates for long-running operations
   ```

2. **Job Queue System**
   ```
   API → Redis Queue → Workers → Google API
   Background processing of bulk operations
   ```

3. **Microservices Architecture**
   ```
   API Gateway → Auth Service
              → User Service
              → Email Service
              → Notification Service
   ```

4. **Database Layer**
   ```
   Backend → ORM (Sequelize/TypeORM) → PostgreSQL
   Persistent storage for users, logs, jobs
   ```

---

## Technology Decisions

### Why These Choices?

| Technology | Reason |
|------------|--------|
| **Express.js** | Mature, flexible, large ecosystem |
| **React** | Component-based, virtual DOM, huge community |
| **Vite** | Fast HMR, modern build tool |
| **Tailwind CSS** | Utility-first, rapid development |
| **JWT** | Stateless auth, scalable |
| **Winston** | Flexible logging, multiple transports |
| **Docker** | Easy deployment, environment consistency |
| **Zustand** | Lightweight state management |
| **Recharts** | React-native charts, customizable |

---

## Performance Considerations

### Frontend Optimization
- Code splitting
- Lazy loading
- Image optimization
- Bundle size optimization
- Browser caching

### Backend Optimization
- Response caching
- Database query optimization
- Connection pooling
- Rate limiting
- Compression (gzip)

### API Optimization
- Pagination
- Field filtering
- Batch operations
- Async processing

---

This architecture provides a solid foundation for scalability, maintainability, and future enhancements.
