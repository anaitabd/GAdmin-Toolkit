# Implementation Prompt Template

Use this template when starting implementation of missing components. Simply copy the relevant section, customize it with your requirements, and use it as a prompt.

---

## 📝 How to Use This Template

1. **Choose a Feature** from the IMPLEMENTATION_ROADMAP.md
2. **Copy the Relevant Section** below
3. **Customize** the prompt with your specific requirements
4. **Provide Context** by referencing existing code
5. **Submit** as a prompt to start implementation

---

## 🎯 General Implementation Prompt Template

```
Please implement [FEATURE_NAME] for the GAdmin-Toolkit project.

**Context:**
- Repository: anaitabd/GAdmin-Toolkit
- Current Branch: [BRANCH_NAME]
- Technology Stack: React + Express + MongoDB
- Related Files: [LIST_RELEVANT_FILES]

**Requirements:**
1. [REQUIREMENT_1]
2. [REQUIREMENT_2]
3. [REQUIREMENT_3]

**Implementation Steps:**
1. [STEP_1]
2. [STEP_2]
3. [STEP_3]

**Acceptance Criteria:**
- [ ] [CRITERIA_1]
- [ ] [CRITERIA_2]
- [ ] [CRITERIA_3]

**Testing:**
- Write unit tests for new functionality
- Write integration tests for API endpoints
- Ensure existing tests still pass

**Documentation:**
- Update README.md if needed
- Add inline code comments
- Create/update API documentation
```

---

## 🧪 Phase 1: Testing Infrastructure Prompt

```
Implement comprehensive testing infrastructure for the GAdmin-Toolkit.

**Goal:** Establish automated testing with 70%+ code coverage for backend and frontend.

**Backend Testing Requirements:**
1. Setup Jest and Supertest
   - Create `main/api/tests/` directory
   - Configure `jest.config.js`
   - Add test scripts to package.json

2. Write Unit Tests
   - Test `controllers/authController.js` (login, password change)
   - Test `controllers/userController.js` (generate, create, delete)
   - Test `controllers/emailController.js` (send, logs, bounces)
   - Test middleware/auth.js (JWT validation)

3. Write Integration Tests
   - Test all API endpoints with Supertest
   - Test MongoDB operations
   - Test authentication flows

4. Setup Coverage Reporting
   - Configure coverage thresholds
   - Generate HTML coverage reports
   - Add coverage badge to README

**Frontend Testing Requirements:**
1. Setup Vitest and Testing Library
   - Configure `vitest.config.js`
   - Setup test environment

2. Write Component Tests
   - Test Login page
   - Test Dashboard page
   - Test Users page
   - Test Emails page
   - Test ProtectedRoute component

**Deliverables:**
- [ ] Backend tests with 70%+ coverage
- [ ] Frontend component tests
- [ ] Test documentation
- [ ] CI integration ready

**Files to Create:**
- `main/api/tests/auth.test.js`
- `main/api/tests/users.test.js`
- `main/api/tests/emails.test.js`
- `main/api/jest.config.js`
- `main/frontend/vitest.config.js`
- `main/frontend/src/__tests__/Login.test.jsx`
- `TESTING_GUIDE.md`
```

---

## 🐳 Phase 1: Docker Containerization Prompt

```
Containerize the GAdmin-Toolkit application with Docker.

**Goal:** Create Docker containers for frontend, backend, and MongoDB for easy deployment.

**Requirements:**
1. Backend Dockerfile
   - Multi-stage build for optimization
   - Node.js 18 Alpine base image
   - Install dependencies
   - Copy source code
   - Expose port 3000
   - Health check

2. Frontend Dockerfile
   - Build stage with Vite
   - Production stage with nginx
   - Serve static files
   - Expose port 80
   - nginx configuration

3. Docker Compose
   - Backend service
   - Frontend service
   - MongoDB service
   - Redis service (for future use)
   - Environment variables
   - Volume mounts
   - Network configuration

4. Documentation
   - Docker build instructions
   - Docker run instructions
   - Environment setup
   - Volume management
   - Troubleshooting

**Deliverables:**
- [ ] `main/api/Dockerfile`
- [ ] `main/frontend/Dockerfile`
- [ ] `docker-compose.yml`
- [ ] `.dockerignore` files
- [ ] `DOCKER.md` documentation

**Optimization Goals:**
- Backend image < 200MB
- Frontend image < 50MB
- Build time < 5 minutes
- Startup time < 10 seconds
```

---

## 📊 Phase 2: Email Templates Prompt

```
Implement an email templates system with variable substitution.

**Goal:** Allow users to create, save, and reuse email templates with dynamic variables.

**Backend Requirements:**
1. Database Schema
   - Collection: `email_templates`
   - Fields: name, subject, body, variables, category, createdAt, updatedAt
   - Indexes on name and category

2. API Endpoints
   - POST `/api/templates` - Create template
   - GET `/api/templates` - List all templates (paginated)
   - GET `/api/templates/:id` - Get specific template
   - PUT `/api/templates/:id` - Update template
   - DELETE `/api/templates/:id` - Delete template

3. Template Processing
   - Variable replacement (e.g., {{name}}, {{email}})
   - Support for custom variables
   - HTML sanitization
   - Preview functionality

**Frontend Requirements:**
1. Templates Page
   - List all templates
   - Create new template button
   - Edit/delete actions
   - Search and filter

2. Template Editor
   - Template name input
   - Subject line input
   - Rich HTML editor
   - Variable insertion buttons
   - Preview pane
   - Save/cancel actions

3. Template Selection
   - Add to email sending form
   - Template dropdown
   - Load template on selection
   - Variable values input

**Deliverables:**
- [ ] `controllers/templateController.js`
- [ ] `routes/templates.js`
- [ ] Templates page UI
- [ ] Template editor component
- [ ] Variable replacement logic
- [ ] API tests for templates

**Example Variables:**
- {{name}} - Recipient name
- {{email}} - Recipient email
- {{date}} - Current date
- {{custom_field}} - Custom fields
```

---

## 🔍 Phase 2: Advanced Search & Filtering Prompt

```
Implement advanced search and filtering for users and email logs.

**Goal:** Enable users to quickly find specific users or email logs with multiple filter options.

**Backend Requirements:**
1. User Search Endpoint
   - GET `/api/users/search?q={query}&filter={filter}&sort={sort}`
   - Search by email, first name, last name
   - Filter by Google creation status
   - Sort by date, name, email
   - Pagination support

2. Email Logs Search Endpoint
   - GET `/api/emails/logs/search?q={query}&method={method}&status={status}`
   - Search by recipient, sender, subject
   - Filter by method (API/SMTP)
   - Filter by status (success/failed)
   - Date range filtering
   - Pagination support

3. Query Optimization
   - Database indexes for search fields
   - Full-text search for efficiency
   - Debounced search to reduce load

**Frontend Requirements:**
1. Search Components
   - Search input with icon
   - Real-time search (debounced)
   - Clear search button
   - Search results count

2. Filter Components
   - Filter dropdown/checkboxes
   - Date range picker
   - Status filter
   - Method filter
   - Clear all filters button

3. Results Display
   - Highlight search terms
   - No results message
   - Loading state
   - Result count

**Deliverables:**
- [ ] Search API endpoints
- [ ] Database indexes
- [ ] Search UI components
- [ ] Filter UI components
- [ ] Debounce utility
- [ ] Search tests

**Performance Goals:**
- Search response time < 500ms
- Handle 10,000+ records efficiently
- Smooth user experience
```

---

## 🔐 Phase 2: Password Reset Flow Prompt

```
Implement a complete password reset flow with email notifications.

**Goal:** Allow users to securely reset their passwords via email.

**Backend Requirements:**
1. Password Reset Endpoints
   - POST `/api/auth/forgot-password` - Request reset
   - POST `/api/auth/reset-password` - Reset with token
   - POST `/api/auth/verify-reset-token` - Validate token

2. Reset Token Management
   - Generate secure reset tokens
   - Store tokens with expiration (1 hour)
   - Validate tokens
   - Invalidate used tokens

3. Email Notification
   - Send password reset email
   - Include reset link with token
   - Email template with branding
   - Handle email failures

**Frontend Requirements:**
1. Forgot Password Page
   - Email input
   - Submit button
   - Success message
   - Error handling

2. Reset Password Page
   - Token validation from URL
   - New password input
   - Confirm password input
   - Password strength indicator
   - Submit button

3. Email Sent Confirmation
   - Confirmation message
   - Check email instructions
   - Resend email option

**Security Requirements:**
- [ ] Tokens expire after 1 hour
- [ ] Tokens are single-use
- [ ] Rate limit reset requests
- [ ] Secure token generation
- [ ] Email delivery confirmation

**Deliverables:**
- [ ] Password reset API endpoints
- [ ] Forgot password page
- [ ] Reset password page
- [ ] Email templates
- [ ] Token management logic
- [ ] Security tests

**User Flow:**
1. User clicks "Forgot Password"
2. User enters email
3. System sends reset email
4. User clicks link in email
5. User enters new password
6. Password is updated
7. User can log in with new password
```

---

## 📅 Phase 3: Email Scheduling Prompt

```
Implement email scheduling with Redis-based job queue.

**Goal:** Allow users to schedule emails for future delivery and manage scheduled emails.

**Backend Requirements:**
1. Redis & Bull Setup
   - Install Redis
   - Configure Bull queue
   - Create email queue
   - Setup queue processors

2. Scheduling Endpoints
   - POST `/api/emails/schedule` - Schedule email
   - GET `/api/emails/scheduled` - List scheduled emails
   - DELETE `/api/emails/scheduled/:id` - Cancel scheduled email
   - PUT `/api/emails/scheduled/:id` - Reschedule email

3. Job Processing
   - Process scheduled jobs
   - Handle job failures
   - Retry logic
   - Job completion notifications

4. Queue Monitoring
   - GET `/api/queue/stats` - Queue statistics
   - GET `/api/queue/failed` - Failed jobs
   - POST `/api/queue/retry/:id` - Retry failed job

**Frontend Requirements:**
1. Scheduling UI
   - Date/time picker component
   - Timezone selection
   - Schedule preview
   - Schedule button

2. Scheduled Emails List
   - View all scheduled emails
   - Schedule status (pending/processing/completed/failed)
   - Cancel action
   - Reschedule action

3. Queue Dashboard (Optional)
   - Active jobs count
   - Completed jobs count
   - Failed jobs count
   - Queue health status

**Deliverables:**
- [ ] Redis integration
- [ ] Bull queue configuration
- [ ] Scheduling API endpoints
- [ ] Queue processors
- [ ] Scheduling UI components
- [ ] Scheduled emails management page
- [ ] Queue monitoring dashboard

**Technical Considerations:**
- Handle timezone conversions
- Validate schedule dates
- Prevent past date scheduling
- Handle Redis connection failures
- Implement retry logic for failed jobs
```

---

## 📈 Phase 3: Email Analytics Prompt

```
Implement email analytics with tracking and reporting.

**Goal:** Track email opens, clicks, and provide analytics dashboard.

**Backend Requirements:**
1. Tracking System
   - Tracking pixel for opens
   - Link tracking for clicks
   - Store tracking events
   - Associate events with emails

2. Analytics Endpoints
   - GET `/api/analytics/overview` - Overall statistics
   - GET `/api/analytics/emails/:id` - Email-specific stats
   - GET `/api/analytics/trends` - Time-series data
   - GET `/api/analytics/export` - Export data

3. Database Schema
   - Collection: `email_events`
   - Fields: emailId, eventType (open/click), timestamp, ipAddress, userAgent

**Frontend Requirements:**
1. Analytics Dashboard
   - Overview cards (total sent, opens, clicks, bounces)
   - Open rate chart
   - Click-through rate chart
   - Engagement trends over time

2. Email Details View
   - Individual email statistics
   - Recipient list with open status
   - Click heatmap
   - Timeline view

3. Charts and Visualizations
   - Install Recharts or Chart.js
   - Line charts for trends
   - Pie charts for distributions
   - Bar charts for comparisons

**Deliverables:**
- [ ] Tracking system implementation
- [ ] Analytics API endpoints
- [ ] Analytics dashboard UI
- [ ] Chart components
- [ ] Export functionality

**Metrics to Track:**
- Total emails sent
- Open rate (%)
- Click-through rate (%)
- Bounce rate (%)
- Unsubscribe rate (%)
- Delivery rate (%)
- Engagement over time
```

---

## 📚 Phase 3: API Documentation (Swagger) Prompt

```
Create comprehensive API documentation with Swagger/OpenAPI.

**Goal:** Provide interactive, always-up-to-date API documentation.

**Backend Requirements:**
1. Swagger Setup
   - Install swagger-jsdoc and swagger-ui-express
   - Configure Swagger middleware
   - Setup OpenAPI specification

2. Document All Endpoints
   - Authentication endpoints
   - User management endpoints
   - Email operation endpoints
   - Template endpoints (if implemented)

3. Documentation Details
   - Request schemas
   - Response schemas
   - Authentication requirements
   - Error responses
   - Examples for each endpoint

4. Swagger UI
   - Serve at `/api-docs`
   - Try-it-out functionality
   - Authentication support
   - Export OpenAPI spec

**Documentation Structure:**
```yaml
openapi: 3.0.0
info:
  title: GAdmin Toolkit API
  description: API for Google Workspace automation
  version: 1.0.0
servers:
  - url: http://localhost:3000
    description: Development server
paths:
  /api/auth/login:
    post:
      summary: User login
      ...
```

**Deliverables:**
- [ ] Swagger configuration
- [ ] OpenAPI specification file
- [ ] Endpoint documentation (JSDoc comments)
- [ ] Interactive Swagger UI
- [ ] API documentation page

**Best Practices:**
- Use consistent naming
- Provide clear descriptions
- Include examples
- Document error codes
- Show authentication requirements
```

---

## 🎨 Phase 4: Dark Mode Prompt

```
Implement dark mode with theme switching.

**Goal:** Provide dark mode option for better user experience in low-light conditions.

**Frontend Requirements:**
1. Theme System
   - Create ThemeContext
   - Define color schemes (light/dark)
   - Theme toggle functionality
   - Persist theme preference

2. Color Variables
   - Define CSS variables for colors
   - Light theme colors
   - Dark theme colors
   - Smooth transitions

3. Update All Components
   - Apply theme variables to all components
   - Test readability in both modes
   - Ensure contrast ratios (WCAG AA)
   - Update charts/visualizations

4. Theme Toggle UI
   - Toggle button in header
   - Sun/moon icon
   - Smooth animation
   - Auto-detect system preference

**Color Scheme Example:**
```css
/* Light Theme */
--bg-primary: #ffffff;
--bg-secondary: #f8f9fa;
--text-primary: #333333;
--text-secondary: #6c757d;

/* Dark Theme */
--bg-primary: #1a1a1a;
--bg-secondary: #2d2d2d;
--text-primary: #ffffff;
--text-secondary: #b0b0b0;
```

**Deliverables:**
- [ ] ThemeContext implementation
- [ ] CSS variables for colors
- [ ] Dark mode styles
- [ ] Theme toggle component
- [ ] Theme persistence (localStorage)
- [ ] Auto-detect system preference

**Accessibility:**
- Maintain contrast ratios
- Test with screen readers
- Support keyboard toggle
- Respect system preferences
```

---

## 🌍 Phase 4: Internationalization Prompt

```
Implement multi-language support with i18n.

**Goal:** Support multiple languages for global user base.

**Frontend Requirements:**
1. i18n Setup
   - Install react-i18next
   - Configure i18n
   - Setup language detection
   - Create translation files

2. Translations
   - English (en) - default
   - French (fr)
   - Spanish (es)
   - German (de)
   - [Add more as needed]

3. Translation Files Structure
```json
{
  "nav": {
    "dashboard": "Dashboard",
    "users": "Users",
    "emails": "Emails"
  },
  "auth": {
    "login": "Login",
    "username": "Username",
    "password": "Password"
  }
}
```

4. Language Switcher
   - Dropdown in header
   - Flag icons
   - Persist language choice
   - Auto-detect browser language

**Implementation Steps:**
1. Wrap app with I18nextProvider
2. Replace hardcoded strings with useTranslation hook
3. Create translation files for each language
4. Add language switcher component
5. Test all languages

**Deliverables:**
- [ ] i18n configuration
- [ ] Translation files for each language
- [ ] Language switcher component
- [ ] Updated components with translations
- [ ] Translation documentation

**Best Practices:**
- Use namespace organization
- Provide context in keys
- Use pluralization rules
- Handle date/time formatting
- Support RTL languages if needed
```

---

## 🔒 Phase 5: Role-Based Access Control Prompt

```
Implement role-based access control (RBAC) system.

**Goal:** Support multiple user roles with different permissions.

**Backend Requirements:**
1. Define Roles & Permissions
   - Super Admin (full access)
   - Admin (manage users, send emails)
   - Viewer (read-only access)
   - Editor (create/edit, no delete)

2. Database Updates
   - Add role field to admin collection
   - Create permissions collection
   - Role-permission mapping

3. Authorization Middleware
   - Check user role
   - Verify permissions
   - Protect endpoints by role
   - Custom permission checks

4. RBAC Endpoints
   - GET `/api/roles` - List roles
   - POST `/api/users/:id/role` - Assign role
   - GET `/api/permissions` - List permissions

**Frontend Requirements:**
1. Role Management UI
   - View user roles
   - Assign roles to users
   - View permissions per role
   - Create custom roles

2. Conditional Rendering
   - Hide features based on role
   - Disable actions without permission
   - Show role badges
   - Permission-based navigation

**Deliverables:**
- [ ] RBAC middleware
- [ ] Role management endpoints
- [ ] Database schema updates
- [ ] Role management UI
- [ ] Permission checks throughout app

**Permission Examples:**
- users.create
- users.read
- users.update
- users.delete
- emails.send
- emails.view
- settings.manage
```

---

## 🔐 Phase 5: Multi-Factor Authentication Prompt

```
Implement two-factor authentication (2FA) with TOTP.

**Goal:** Enhance security with optional 2FA for admin users.

**Backend Requirements:**
1. 2FA Setup
   - Install speakeasy and qrcode
   - Generate 2FA secrets
   - Create QR codes
   - Verify TOTP tokens

2. 2FA Endpoints
   - POST `/api/auth/2fa/setup` - Initialize 2FA
   - POST `/api/auth/2fa/verify` - Verify and enable
   - POST `/api/auth/2fa/disable` - Disable 2FA
   - POST `/api/auth/2fa/validate` - Validate during login

3. Backup Codes
   - Generate backup codes
   - Store hashed codes
   - Allow single-use
   - Regenerate option

4. Updated Login Flow
   - Check if 2FA enabled
   - Request TOTP code
   - Validate code
   - Allow backup code

**Frontend Requirements:**
1. 2FA Setup Page
   - Display QR code
   - Manual entry code
   - Verification input
   - Backup codes display
   - Enable button

2. 2FA Login
   - Additional step after password
   - TOTP input field
   - "Use backup code" option
   - Remember device checkbox

3. 2FA Management
   - Enable/disable toggle
   - Regenerate backup codes
   - View 2FA status

**Deliverables:**
- [ ] 2FA backend logic
- [ ] 2FA setup UI
- [ ] 2FA login flow
- [ ] Backup codes system
- [ ] Recovery options
- [ ] 2FA tests

**Security Considerations:**
- Rate limit 2FA attempts
- Secure secret storage
- Invalidate old secrets
- Provide recovery options
```

---

## 📊 Phase 6: Performance Optimization Prompt

```
Optimize application performance with caching and database improvements.

**Goal:** Improve response times and handle higher load.

**Backend Requirements:**
1. Redis Caching
   - Setup Redis connection
   - Cache frequently accessed data
   - Cache invalidation strategy
   - TTL policies

2. Database Optimization
   - Add indexes to collections
   - Optimize queries
   - Use projections
   - Implement connection pooling

3. API Optimization
   - Response compression
   - Pagination optimization
   - Query optimization
   - N+1 query prevention

**Frontend Requirements:**
1. Code Splitting
   - Route-based splitting
   - Lazy load components
   - Dynamic imports

2. Asset Optimization
   - Image optimization
   - Font optimization
   - Bundle size reduction
   - Tree shaking

3. Performance Monitoring
   - Add performance metrics
   - Monitor load times
   - Track slow operations

**Deliverables:**
- [ ] Redis caching layer
- [ ] Database indexes
- [ ] Optimized queries
- [ ] Code splitting
- [ ] Performance monitoring
- [ ] Optimization report

**Performance Goals:**
- API response < 200ms (95th percentile)
- Page load < 2 seconds
- Bundle size < 300KB
- Database queries < 100ms
```

---

## 🎯 Implementation Checklist Template

Use this checklist for any feature implementation:

```markdown
## [Feature Name] Implementation

### Planning
- [ ] Review requirements
- [ ] Check existing code
- [ ] Identify dependencies
- [ ] Create branch
- [ ] Update roadmap

### Implementation
- [ ] Backend logic
- [ ] Database changes
- [ ] API endpoints
- [ ] Frontend components
- [ ] Integration

### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing
- [ ] Edge cases
- [ ] Error scenarios

### Documentation
- [ ] Code comments
- [ ] API documentation
- [ ] User documentation
- [ ] Update README
- [ ] Add examples

### Quality Assurance
- [ ] Code review
- [ ] Security check
- [ ] Performance test
- [ ] Accessibility test
- [ ] Browser testing

### Deployment
- [ ] Build successful
- [ ] Deploy to staging
- [ ] Smoke tests
- [ ] Deploy to production
- [ ] Monitor logs

### Post-Launch
- [ ] Gather feedback
- [ ] Fix bugs
- [ ] Optimize
- [ ] Iterate
```

---

## 💡 Tips for Successful Implementation

1. **Start Small** - Implement one feature at a time
2. **Test Early** - Write tests alongside code
3. **Document Continuously** - Update docs as you go
4. **Review Often** - Get feedback early and often
5. **Iterate Quickly** - Make small, incremental changes
6. **Monitor Performance** - Track metrics from the start
7. **Follow Standards** - Maintain code consistency
8. **Seek Help** - Ask questions when stuck

---

*Use these prompts as starting points. Customize based on your specific needs and project constraints.*
