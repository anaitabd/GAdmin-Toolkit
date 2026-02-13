# COMPREHENSIVE CODEBASE ANALYSIS
# GAdmin-Toolkit - Google Workspace Automation Platform

**Generated:** February 13, 2026  
**Repository:** anaitabd/GAdmin-Toolkit  
**Purpose:** Complete documentation to enable full application rebuild from scratch

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Detailed File-by-File Analysis](#2-detailed-file-by-file-analysis)
3. [Data Flow & Architecture](#3-data-flow--architecture)
4. [Features & Functionality](#4-features--functionality)
5. [Rebuild Documentation](#5-rebuild-documentation)
6. [Code Quality Assessment](#6-code-quality-assessment)

---

## 1. PROJECT OVERVIEW

### 1.1 Project Identity

**Name:** GAdmin-Toolkit (Google Workspace Automation Toolkit)

**Purpose:** A comprehensive full-stack automation platform for managing Google Workspace (G Suite) users, email campaigns, and lead generation. The system provides:
- Automated Google Workspace user management
- Bulk email sending via Gmail API and SMTP
- Campaign orchestration with real-time monitoring
- Lead tracking and conversion management
- Data provider and affiliate network management
- Role-based access control (RBAC) system

**Target Users:** Email marketers, affiliate marketers, data sponsors, Google Workspace administrators

### 1.2 Technology Stack

#### **Backend Technologies**
- **Runtime:** Node.js (v16+)
- **Framework:** Express.js 4.18.3
- **Database:** PostgreSQL 12+ (46 tables)
- **API Style:** RESTful with 41+ route modules
- **Authentication:** JWT (JSON Web Tokens)
- **Google Integration:** 
  - Google Cloud SDK
  - Gmail API
  - Google Workspace Admin SDK
  - Google Cloud KMS (for credential encryption)

#### **Frontend Technologies**
- **Framework:** React 19.2.0
- **Language:** TypeScript 5.9.3
- **Build Tool:** Vite 7.2.4
- **Routing:** React Router DOM 7.13.0
- **State Management:** TanStack React Query 5.90.20
- **UI Framework:** Tailwind CSS 4.1.18
- **Components:** Headless UI, Heroicons

#### **Supporting Technologies**
- **Python:** 3.8+ (utility scripts)
- **Email:** Nodemailer 6.9.13
- **File Processing:** Multer 2.0.2, CSV Parser
- **Security:** Rate limiting (Express Rate Limit)
- **Performance:** Compression middleware
- **Development:** Nodemon, ESLint
- **Containerization:** Docker & Docker Compose

### 1.3 Architecture Pattern

**Pattern:** Monolithic Full-Stack with Service-Oriented Components

**Architecture Layers:**
1. **Presentation Layer** (Frontend - React/TypeScript)
   - 50+ page components
   - Shared component library
   - API client with React Query

2. **API Layer** (Backend - Express.js)
   - RESTful endpoints
   - Middleware stack (rate limiting, compression, validation)
   - 41 route modules

3. **Business Logic Layer**
   - Job processors (8 types)
   - Email sending services
   - Google Workspace integration
   - Placeholder/template processing

4. **Data Layer** (PostgreSQL)
   - 46 database tables
   - Normalized relational schema
   - Audit logging
   - JSONB for flexible data

### 1.4 Project Structure

```
GAdmin-Toolkit/
├── main/                       # Backend application
│   ├── package.json
│   └── api/
│       ├── server.js          # Express server entry point
│       ├── routes/            # 41 API route modules
│       ├── jobs/              # Background job processors
│       ├── lib/               # Shared libraries
│       ├── middleware/        # Express middleware
│       ├── db/                # Database schema & migrations
│       ├── *.js               # Standalone scripts
│       └── *.sh               # Shell scripts
├── frontend/                  # React frontend
│   ├── package.json
│   ├── src/
│   │   ├── pages/            # 50+ page components
│   │   ├── components/       # Shared components
│   │   ├── api/              # API client & types
│   │   ├── hooks/            # Custom React hooks
│   │   └── main.tsx          # Application entry
│   ├── public/               # Static assets
│   └── vite.config.ts        # Vite configuration
├── py/                        # Python utility scripts
├── files/                     # CSV data files
├── docs/                      # Additional documentation
├── docker-compose.yml         # Multi-container setup
├── Dockerfile                 # Backend container
└── README.md                  # Main documentation
```



### 2.8 Frontend Structure

#### **main.tsx** - Application Entry Point
**Location:** `frontend/src/main.tsx`
**Purpose:** React app initialization

**Configuration:**
- React Query setup with QueryClientProvider
- React Router DOM setup
- Global CSS import
- Tailwind CSS integration

**React Query Config:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
```

---

#### **App.tsx** - Route Configuration
**Routes:** 50+ pages
**Layout:** Sidebar navigation + main content area

**Route Structure:**
```tsx
<Routes>
  <Route path="/" element={<Dashboard />} />
  <Route path="/users" element={<UsersPage />} />
  <Route path="/campaigns" element={<CampaignPage />} />
  // ... 47 more routes
</Routes>
```

---

#### **components/layout/Sidebar.tsx** - Navigation
**Features:**
- Hierarchical collapsible navigation
- 14 main navigation groups
- Icon support (Heroicons)
- Active route highlighting

**Navigation Groups:**
1. Dashboard
2. Campaign Management (3 items)
3. Sponsor Management (7 items)
4. Data Management (5 items)
5. Tracking & Analytics (3 items)
6. User Management (2 items)
7. Team Management (4 items)
8. Google Accounts (1 item)
9. Email Configuration (4 items)
10. Suppression Management (2 items)
11. Tools & Utilities (6 items)
12. System (5 items)
13. Logs & Audit (4 items)
14. Settings (1 item)

**Component Structure:**
```tsx
<CollapsibleNavGroup
  label="Campaign Management"
  icon={RocketLaunchIcon}
  collapsible={true}
  items={[
    { name: 'Campaigns', path: '/campaigns' },
    { name: 'Send Campaign', path: '/campaign-send' },
    { name: 'Campaign Monitor', path: '/campaign-monitor' }
  ]}
/>
```

---

#### **pages/** - 50 Page Components

**Pattern:** All pages follow similar structure:
1. State management with useState
2. API calls with React Query (useQuery, useMutation)
3. Table display with sorting/filtering
4. Modal forms for create/edit
5. Delete confirmations
6. Loading and error states

**Key Pages:**

**Dashboard.tsx** (7,213 lines)
- Overview statistics
- 12+ parallel queries for different metrics
- Real-time campaign monitoring
- Recent activity feed

**CampaignPage.tsx** (72,839 lines)
- Campaign list with filters
- Inline stats (sent, failed, clicks, opens, CTR)
- Pause/resume/stop controls
- Campaign details modal

**CampaignSend.tsx** (29,975 lines)
- 4-step wizard interface
- Cascading dropdowns
- Preview with exclusion breakdown
- Test email functionality
- Validation at each step

**CampaignMonitor.tsx** (9,712 lines)
- Real-time campaign progress
- Live statistics updates
- Pause/resume/stop controls
- Recent email logs

**OffersPage.tsx** (24,287 lines)
- Offer CRUD
- Performance statistics
- Creative management
- From name/subject rotation setup

**TrackingLinksPage.tsx** (30,101 lines)
- Standalone tracking link creation
- HTML snippet generation
- Click statistics
- Batch creation support

**EmailDataPage.tsx** (10,894 lines)
- Recipient list management
- Bulk import
- Flag management (opener, clicker, unsub, bounced)
- Filtering by geo, list, flags

**LeadsPage.tsx** (10,690 lines)
- Lead tracking
- Conversion status
- Payout calculation
- Revenue reporting

**RolesPage.tsx** (5,803 lines)
- RBAC role management
- Permission assignment (80+ permissions)
- User role assignments

**TeamsPage.tsx** (8,319 lines)
- Team creation
- Member management
- Team authorization

**GoogleAccountsPage.tsx** (6,969 lines)
- Google account management
- Quota tracking
- Status monitoring
- Daily limit configuration

---

#### **api/** - API Client Layer

**api/client.ts** - Axios Configuration
```typescript
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Request interceptor for auth
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
    }
    return Promise.reject(error);
  }
);
```

**api/types.ts** - TypeScript Interfaces (40+)
All database entities have corresponding TypeScript interfaces:
```typescript
interface User {
  id: number;
  email: string;
  given_name: string;
  family_name: string;
  created_at: string;
}

interface Campaign {
  id: number;
  name: string;
  description?: string;
  offer_id?: number;
  provider: 'gmail_api' | 'smtp';
  status: string;
  // ... 20+ more fields
}

// ... 38+ more interfaces
```

**api/hooks/** - React Query Hooks
Custom hooks for each entity:
```typescript
// useUsers.ts
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data.data;
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: CreateUserInput) => {
      const { data } = await api.post('/users', user);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
```

---

#### **components/** - Shared Components

**Button.tsx** - Reusable button component with variants
**Input.tsx** - Form input component
**Select.tsx** - Dropdown select component
**Modal.tsx** - Modal dialog component
**Table.tsx** - Data table with sorting
**Pagination.tsx** - Pagination controls
**LoadingSpinner.tsx** - Loading indicator
**ErrorMessage.tsx** - Error display
**ConfirmDialog.tsx** - Confirmation modal

---

### 2.9 Python Utility Scripts (8 Files in py/)

**activateLessSecureApp.py** - Enable less secure app access
**checkSmtp.py** - Test SMTP connection
**chunk.py** - Split large files
**duplicate.py** - Find duplicate emails
**filterProcessedEmail.py** - Filter already processed emails
**send.py** - Python email sender
**split.py** - Split CSV files
**requirement.txt** - Python dependencies

---

### 2.10 Configuration Files

**docker-compose.yml** - Multi-container setup
- PostgreSQL service
- Backend API service
- Frontend service
- Volume management

**Dockerfile** (backend) - Node.js container
**frontend/Dockerfile** - Nginx container with React build

**vite.config.ts** - Vite build configuration
**tsconfig.json** - TypeScript configuration
**eslint.config.js** - ESLint rules
**tailwind.config.js** - Tailwind CSS configuration

---


## 3. DATA FLOW & ARCHITECTURE

### 3.1 Application Architecture

**Architecture Type:** Monolithic Full-Stack with Service-Oriented Backend

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  React + TypeScript + TailwindCSS + React Query + Router    │
│                    (Port 5173 / 80)                         │
└───────────────────┬─────────────────────────────────────────┘
                    │ HTTP/REST API
                    │ JSON responses
┌───────────────────▼─────────────────────────────────────────┐
│                       API Gateway Layer                      │
│          Express.js Server (Port 3000)                      │
│   ┌──────────────────────────────────────────────────┐    │
│   │  Middleware Stack:                                │    │
│   │  - Compression (gzip)                            │    │
│   │  - Body Parser (JSON, URL-encoded)              │    │
│   │  - Rate Limiter (500/15min)                     │    │
│   │  - Error Handler                                │    │
│   └──────────────────────────────────────────────────┘    │
└───────────────────┬─────────────────────────────────────────┘
                    │
      ┌─────────────┼─────────────┐
      │             │             │
┌─────▼─────┐ ┌────▼────┐ ┌─────▼──────┐
│  Route    │ │ Route   │ │   Route    │
│  Module 1 │ │ Module 2│ │  Module 41 │
│  (users)  │ │(campaigns)│ │  (tools)  │
└─────┬─────┘ └────┬────┘ └─────┬──────┘
      │            │            │
      └────────────┼────────────┘
                   │
┌──────────────────▼─────────────────────────────────────────┐
│                    Business Logic Layer                     │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Lib       │  │  Jobs        │  │  Middleware     │  │
│  │ - validation│  │ - sendEmail  │  │ - rateLimiter   │  │
│  │ - placeholder│ │ - campaign   │  │                 │  │
│  │ - filters   │  │ - googleUser │  │                 │  │
│  │ - affAPI    │  │ - bounce     │  │                 │  │
│  └─────────────┘  └──────────────┘  └─────────────────┘  │
└──────────────────┬──────────────────────────────────────────┘
                   │ SQL Queries (parameterized)
┌──────────────────▼─────────────────────────────────────────┐
│                    Data Access Layer                        │
│                PostgreSQL Database                          │
│   ┌─────────────────────────────────────────────────┐     │
│   │  46 Tables organized in groups:                 │     │
│   │  - Core (users, email_data, templates, etc.)    │     │
│   │  - Campaigns (campaigns, jobs, tracking)        │     │
│   │  - Data Management (providers, lists)           │     │
│   │  - Sponsor/Affiliate (offers, networks, leads)  │     │
│   │  - RBAC (roles, teams, permissions)             │     │
│   │  - Audit (logs, sessions)                       │     │
│   └─────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              External Services Integration                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Google      │  │  Affiliate   │  │  Email       │     │
│  │  Cloud       │  │  Networks    │  │  Recipients  │     │
│  │  - Admin SDK │  │  - Postbacks │  │  - SMTP      │     │
│  │  - Gmail API │  │  - API calls │  │  - Gmail API │     │
│  │  - KMS       │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

### 3.2 Complete Data Flow Diagrams

#### 3.2.1 Campaign Send Flow

```
User Action (Frontend)
       ↓
1. Select Offer ──────────────→ POST /api/campaign-send/resolve-offer
       ↓                                    ↓
   [Offer Details]                    Query offers table
       ↓                              Return: from_names, subjects, creatives
       ↓                                    ↓
2. Select Creative ───────────→ POST /api/campaign-send/resolve-creative
       ↓                                    ↓
   [Creative HTML]                   Query creatives table
       ↓                              Return: html_content
       ↓                                    ↓
3. Select Data Lists ─────────→ POST /api/campaign-send/resolve-lists
       ↓                                    ↓
   [Available Lists]              Filter data_lists by:
       ↓                          - Provider compatibility
       ↓                          - Geo requirements
       ↓                          - Offer restrictions
       ↓                                    ↓
4. Configure & Preview ───────→ POST /api/campaign-send/preview
       ↓                                    ↓
   [Recipient Count]              Query email_data with filters:
   [Exclusions]                   - Join blacklist_emails (exclude)
       ↓                          - Join suppression_emails (exclude)
       ↓                          - Filter is_hard_bounced = false
       ↓                          - Filter is_unsub = false
       ↓                          Return: total, excluded breakdown
       ↓                                    ↓
5. (Optional) Test ───────────→ POST /api/campaign-send/test
       ↓                                    ↓
   [Test Email Sent]              Send to test addresses
       ↓                          Validate configuration
       ↓                                    ↓
6. Start Campaign ────────────→ POST /api/campaign-send/start
       ↓                                    ↓
   [Campaign Created]             1. INSERT INTO campaigns
   [Job Started]                  2. INSERT INTO jobs
       ↓                          3. Spawn child process:
       ↓                             - sendCampaignApi.js OR
       ↓                             - sendCampaignSmtp.js
       ↓                                    ↓
       ├──────────────────────────→ Job Execution
       │                                    ↓
       │                          Loop: For each recipient batch
       │                                    ↓
       │                          1. Fetch next batch (LIMIT/OFFSET)
       │                          2. Apply exclusion filters
       │                          3. For each recipient:
       │                             a. Personalize content (placeholders)
       │                             b. Generate tracking links
       │                             c. Insert open pixel
       │                             d. Send email (API or SMTP)
       │                             e. INSERT email_logs record
       │                             f. INSERT click_tracking records
       │                          4. Update job progress
       │                          5. Update campaign stats
       │                                    ↓
       │                          Job completes → UPDATE jobs.status
       │                                    ↓
7. Monitor Campaign ──────────→ GET /api/campaigns/:id
       ↓                        GET /api/campaigns/:id/stats
   [Real-time Stats]                    ↓
   - Sent count                  Query aggregations:
   - Failed count                - COUNT email_logs by status
   - Click count                 - COUNT click_tracking WHERE clicked=true
   - Open count                  - COUNT open_tracking WHERE opened=true
   - CTR                         - Calculate percentages
       ↓
8. (Optional) Control ────────→ POST /api/campaigns/:id/pause
                                POST /api/campaigns/:id/resume
                                POST /api/campaigns/:id/terminate
                                       ↓
                               Update job status
                               Job processor checks status each iteration
```

---

#### 3.2.2 Email Click Tracking Flow

```
Email Sent with Tracked Link
       ↓
   [original: https://offer.com/landing]
   [tracked:  https://yourapp.com/t/c/{trackId}]
       ↓
User Clicks Link
       ↓
GET /t/c/{trackId} ───────────→ tracking.js handler
       ↓                                ↓
       │                        1. Query click_tracking by track_id
       │                           ↓
       │                        2. INSERT INTO click_events
       │                           - ip_address (from request)
       │                           - user_agent (from headers)
       │                           - referer (from headers)
       │                           - Device/Browser/OS detection
       │                           - Geo lookup (IP → country/city)
       │                           ↓
       │                        3. UPDATE click_tracking
       │                           SET clicked = true,
       │                               clicked_at = NOW()
       │                           ↓
       │                        4. Fire-and-forget async updates:
       │                           a. UPDATE email_data
       │                              SET is_clicker = true
       │                              WHERE to_email = (from tracking)
       │                           ↓
       │                           b. UPDATE campaigns stats
       │                              (increment click_count)
       │                           ↓
       │                           c. (if applicable) INSERT INTO
       │                              offer_clickers
       │                           ↓
       │                        5. Redirect to original_url
       │                           ↓
User Lands on Offer Page ←──────┘
```

---

#### 3.2.3 Lead Conversion Flow (Postback)

```
User completes action on Offer Page
       ↓
Affiliate Network detects conversion
       ↓
Network sends postback ──────────→ GET/POST /postback
       ↓                                  ↓
Query Params:                      1. Parse parameters:
- click_id or transaction_id          - Extract identifiers
- email or email_hash                 - Extract payout
- payout                              - Extract status
- status                              ↓
- offer_id                         2. Validate postback:
- (network-specific params)           - Check IP whitelist
       ↓                              - Verify signature/token
       │                              ↓
       │                          3. Find matching click:
       │                             SELECT * FROM click_tracking
       │                             WHERE track_id = click_id
       │                                OR to_email = email
       │                             ↓
       │                          4. INSERT INTO leads
       │                             - to_email
       │                             - transaction_id
       │                             - offer_id
       │                             - campaign_id
       │                             - affiliate_network_id
       │                             - payout
       │                             - status
       │                             - conversion_timestamp
       │                             ↓
       │                          5. UPDATE email_data
       │                             SET is_leader = true
       │                             WHERE to_email = lead.to_email
       │                             ↓
       │                          6. UPDATE campaign stats
       │                             (increment conversion_count, add revenue)
       │                             ↓
Response: "OK" ←──────────────────┘
       ↓
Network marks conversion as tracked
```

---

#### 3.2.4 User Authentication Flow (Future Implementation)

```
User Login (Frontend)
       ↓
POST /api/auth/login ─────────────→ Auth Handler
  { email, password }                      ↓
       ↓                             1. Query users table
       │                                SELECT * FROM users
       │                                WHERE email = $1
       │                                ↓
       │                             2. Verify password
       │                                (bcrypt compare)
       │                                ↓
       │                             3. Check user_roles
       │                                JOIN user_roles
       │                                JOIN roles
       │                                ↓
       │                             4. Generate JWT token
       │                                jwt.sign({
       │                                  userId: user.id,
       │                                  email: user.email,
       │                                  roles: user.roles
       │                                }, JWT_SECRET)
       │                                ↓
       │                             5. INSERT INTO user_sessions
       │                                - user_id
       │                                - token
       │                                - ip_address
       │                                - expires_at
       │                                ↓
Response: { token, user } ←──────────┘
       ↓
Frontend stores token
localStorage.setItem('token', token)
       ↓
Subsequent Requests include:
Authorization: Bearer {token}
       ↓
Middleware validates token on each request
```

---

### 3.3 Database Schema & Relationships

#### 3.3.1 Core Entity Relationships

```
users (Google Workspace users)
  ├─ One-to-Many → email_logs (emails sent from user)
  ├─ One-to-Many → user_roles (RBAC)
  └─ One-to-Many → user_sessions (login sessions)

email_data (recipient data)
  ├─ Many-to-One → data_lists (source list)
  ├─ Flags: is_opener, is_clicker, is_unsub, is_hard_bounced
  └─ Referenced by: email_logs, click_tracking, leads

campaigns
  ├─ Many-to-One → jobs (execution job)
  ├─ Many-to-One → offers (campaign offer)
  ├─ One-to-Many → email_logs (emails sent)
  ├─ One-to-Many → click_tracking (tracking links)
  └─ One-to-Many → leads (conversions)

offers
  ├─ Many-to-One → affiliate_networks
  ├─ Many-to-One → verticals
  ├─ One-to-Many → campaigns
  ├─ One-to-Many → creatives
  ├─ One-to-Many → from_names
  ├─ One-to-Many → subjects
  ├─ One-to-Many → offer_links
  └─ One-to-Many → leads

jobs (background processes)
  ├─ One-to-Many → email_logs
  ├─ One-to-Many → click_tracking
  └─ One-to-One → campaigns

data_providers
  └─ One-to-Many → data_lists

blacklists
  └─ One-to-Many → blacklist_emails

roles (RBAC)
  ├─ One-to-Many → role_permissions
  └─ One-to-Many → user_roles

teams
  ├─ One-to-Many → team_members
  └─ One-to-Many → team_authorizations
```

---

#### 3.3.2 Complete Table List with Primary Purposes

**Core Email Management (10 tables):**
1. `users` - Google Workspace user accounts
2. `email_data` - Recipient/lead database
3. `email_info` - From name + subject combinations
4. `email_templates` - HTML email templates
5. `email_logs` - Send attempt logs (success/failure)
6. `bounce_logs` - Bounced email detections
7. `names` - First/last name database for generation
8. `credentials` - Google API credentials (encrypted)
9. `settings` - Key-value application settings
10. `unsubscribes` - Unsubscribe requests

**Tracking (6 tables):**
11. `click_tracking` - Click tracking links
12. `click_events` - Individual click events (multi-click support)
13. `open_tracking` - Email open tracking
14. `open_events` - Individual open events
15. `offer_clickers` - Offer-specific click aggregation
16. `leads` - Conversions/sales

**Campaign Management (3 tables):**
17. `campaigns` - Campaign definitions
18. `campaign_templates` - Reusable campaign templates
19. `jobs` - Background job execution tracking

**Data Management (6 tables):**
20. `data_providers` - Data source providers
21. `data_lists` - Email lists
22. `blacklists` - Blacklist definitions
23. `blacklist_emails` - Individual blacklisted emails
24. `suppression_emails` - Global suppression list
25. `suppression_processes` - Suppression update jobs

**Sponsor/Affiliate (8 tables):**
26. `offers` - Marketing offers
27. `offer_links` - Multiple offer destinations
28. `verticals` - Industry categories
29. `affiliate_networks` - Network integrations
30. `creatives` - Email HTML creatives
31. `from_names` - Sender name rotation pool
32. `subjects` - Subject line rotation pool
33. `leads` - (already listed above)

**RBAC System (6 tables):**
34. `roles` - Role definitions
35. `role_permissions` - Permission assignments
36. `user_roles` - User-role mappings
37. `teams` - Team definitions
38. `team_members` - Team membership
39. `team_authorizations` - Team permissions

**iResponse-Pro Features (7 tables):**
40. `predefined_headers` - Custom email headers
41. `auto_responders` - Auto-responder configuration
42. `auto_responder_logs` - Auto-responder execution logs
43. `google_accounts` - Multiple Google account management
44. `user_sessions` - User session tracking
45. `application_logs` - System logging
46. `uploaded_images` - Image asset management

---

### 3.4 API Endpoint Reference

**Complete API Endpoint Summary (170+ endpoints):**

#### Core Resources (6 modules, 30+ endpoints)
- **/api/users** (5 endpoints) - User CRUD
- **/api/email-data** (8 endpoints) - Recipient data + bulk operations
- **/api/email-info** (6 endpoints) - From/subject combinations
- **/api/email-templates** (6 endpoints) - Template management
- **/api/names** (5 endpoints) - Name database
- **/api/settings** (3 endpoints) - Application settings

#### Campaign Management (5 modules, 35+ endpoints)
- **/api/campaigns** (10 endpoints) - Campaign CRUD + control
- **/api/campaign-send** (9 endpoints) - Campaign creation wizard
- **/api/campaign-templates** (5 endpoints) - Template management
- **/api/jobs** (7 endpoints) - Job management + control
- **/api/email-send** (5 endpoints) - Direct email sending

#### Tracking (4 modules, 20+ endpoints)
- **/t/c/:trackId** (1 endpoint) - Click redirect
- **/t/o/:trackId** (1 endpoint) - Open pixel
- **/t/u/:trackId** (1 endpoint) - Unsubscribe
- **/api/tracking-links** (9 endpoints) - Standalone tracking links
- **/api/email-logs** (3 endpoints) - Email send logs (read-only)
- **/api/bounce-logs** (3 endpoints) - Bounce logs (read-only)
- **/api/leads** (6 endpoints) - Lead/conversion management

#### Data Management (6 modules, 30+ endpoints)
- **/api/data-providers** (5 endpoints)
- **/api/data-lists** (5 endpoints)
- **/api/blacklists** (7 endpoints) - Including bulk email operations
- **/api/verticals** (5 endpoints)
- **/api/suppression-emails** (5 endpoints)
- **/api/suppression-processes** (5 endpoints)

#### Sponsor/Affiliate (7 modules, 35+ endpoints)
- **/api/offers** (7 endpoints) - Including stats
- **/api/offer-links** (5 endpoints)
- **/api/affiliate-networks** (5 endpoints)
- **/api/creatives** (5 endpoints)
- **/api/from-names** (5 endpoints)
- **/api/subjects** (5 endpoints)
- **/postback** (1 endpoint) - Conversion webhook

#### RBAC & Teams (4 modules, 25+ endpoints)
- **/api/roles** (8 endpoints) - Including permission management
- **/api/teams** (8 endpoints) - Including member management
- **/api/google-accounts** (6 endpoints)
- **/api/audit-logs** (3 endpoints) - Audit trail (read-only)

#### iResponse-Pro Features (4 modules, 20+ endpoints)
- **/api/headers** (5 endpoints)
- **/api/auto-responders** (5 endpoints)
- **/api/sessions** (5 endpoints)
- **/api/logs** (5 endpoints)

#### Utilities (3 modules, 15+ endpoints)
- **/api/credentials** (5 endpoints)
- **/api/images** (5 endpoints) - Image upload
- **/api/tools** (5 endpoints) - Mailbox extract, SPF check, etc.
- **/api/statistics** (5 endpoints) - Dashboard stats

---


## 4. FEATURES & FUNCTIONALITY

### 4.1 Core Features

#### 4.1.1 Google Workspace User Management
**Purpose:** Automate Google Workspace account lifecycle

**Features:**
1. **Batch User Creation**
   - Read users from database
   - Validate email format and password strength
   - Create users via Admin SDK API
   - Set first name, last name, password
   - Handle errors gracefully

2. **Batch User Deletion**
   - List all domain users
   - Exclude admin accounts (safety)
   - Delete users via Admin SDK
   - Progress tracking

3. **Random User Generation**
   - Generate realistic test accounts
   - Use name database for authenticity
   - Configurable domain and count
   - Insert directly into database

**CLI Usage:**
```bash
# Generate 100 test users
node main/api/generate.js example.com 100

# Create users in Google Workspace
node main/api/create.js

# Delete all non-admin users
node main/api/delete.js
```

**Validation:**
- Email format: RFC 5322 compliance
- Password: Minimum 8 characters
- Duplicate detection
- Domain verification

---

#### 4.1.2 Email Campaign Management
**Purpose:** Create, manage, and monitor bulk email campaigns

**Campaign Creation Wizard (9 Steps):**

**Step 1: Resolve Offer**
- Select marketing offer
- Loads associated from names, subjects, creatives

**Step 2: Resolve Creative**
- Select email creative (HTML content)
- Preview HTML

**Step 3: Resolve Lists**
- Select data lists (email recipients)
- Filter by provider, geo, offer requirements

**Step 4: Preview**
- See estimated recipient count
- View exclusion breakdown:
  - Blacklisted: X
  - Suppressed: Y
  - Hard Bounced: Z
  - Unsubscribed: W
- Total deliverable: N

**Step 5: Test (Optional)**
- Send test emails to specified addresses
- Verify content, links, tracking

**Step 6: Start Campaign**
- Creates campaign record
- Spawns background job
- Returns campaign ID and job ID

**Steps 7-9: Control**
- Pause: Temporarily stop sending
- Resume: Continue paused campaign
- Terminate: Stop campaign immediately

**Campaign Monitoring:**
- Real-time statistics dashboard
- Metrics tracked:
  - Sent count
  - Failed count
  - Open count & rate
  - Click count & rate
  - Click-through rate (CTR)
  - Conversion count
  - Revenue generated
- Recent email logs
- Error breakdown

---

#### 4.1.3 Email Sending Methods

**Method 1: Gmail API**
- **Pros:** Better deliverability, full tracking support
- **Cons:** Rate limited (500/day per account by default)
- **Use Case:** High-value campaigns requiring good inbox placement

**Method 2: SMTP**
- **Pros:** Higher volume capacity, cost-effective
- **Cons:** Lower deliverability, more spam risk
- **Use Case:** Mass campaigns, less sensitive to deliverability

**Both Methods Support:**
- Placeholder personalization
- Click tracking
- Open tracking
- Unsubscribe links
- Progress tracking
- Error logging
- Batch processing

---

#### 4.1.4 Placeholder System
**Purpose:** Personalize email content dynamically

**Recipient Personalization:**
```html
Hello [first_name],

Your email is [to] and you're from [domain].
```

**Dynamic Content:**
```html
Today's date: [date]
Random number: [random]
Your unique ID: [md5]
```

**Tracking Links:**
```html
<a href="[click_url]">Click here</a>
<img src="[open_pixel]" width="1" height="1" />
[unsub_link]
```

**Supported Placeholders (17+):**
- `[to]`, `[email]` - Recipient email
- `[first_name]` - First name
- `[last_name]` - Last name
- `[full_name]` - Full name
- `[domain]` - Email domain
- `[date]` - Current date (YYYY-MM-DD)
- `[datetime]` - Current datetime
- `[timestamp]` - Unix timestamp
- `[random]` - Random number (0-999999)
- `[random_N]` - N-digit random
- `[md5]` - MD5 hash of email
- `[click_url]` - Tracked click URL
- `[unsub_url]` - Unsubscribe URL
- `[open_pixel]` - 1x1 tracking pixel
- `[unsub_link]` - Full unsub HTML
- `[offer_name]` - Offer name
- `[from_name]` - From name
- `[subject]` - Subject line

---

#### 4.1.5 Click & Open Tracking
**Purpose:** Track email engagement

**Click Tracking Process:**
1. Original link in HTML: `https://offer.com/page`
2. System generates unique track_id (UUID)
3. Link replaced: `https://yourapp.com/t/c/{track_id}`
4. User clicks link
5. System logs:
   - IP address
   - User agent (browser/device)
   - Referer
   - Country/city (geo lookup)
   - Device type (mobile/desktop/tablet)
   - Browser name/version
   - Operating system
6. Updates flags:
   - `email_data.is_clicker = true`
   - `click_tracking.clicked = true`
7. Increments campaign click count
8. Redirects to original URL

**Open Tracking Process:**
1. System inserts 1x1 transparent pixel in email
2. Pixel URL: `https://yourapp.com/t/o/{track_id}`
3. Email client loads images
4. System logs:
   - IP address
   - User agent
   - Device/browser/OS
5. Updates `email_data.is_opener = true`
6. Increments campaign open count
7. Returns 1x1 transparent GIF

**Privacy Considerations:**
- No personally identifiable information stored beyond email
- Complies with CAN-SPAM Act
- Supports opt-out (unsubscribe)

---

#### 4.1.6 Lead Tracking & Conversion Attribution
**Purpose:** Track conversions from email clicks to sales/signups

**Flow:**
1. User receives email
2. User clicks tracked link → Click logged
3. User lands on offer page
4. User completes action (signup, purchase, etc.)
5. Affiliate network sends postback to `/postback`
6. System receives postback with:
   - Transaction ID or click ID
   - Email (or email hash)
   - Payout amount
   - Status (pending/approved/rejected)
7. System matches postback to click record
8. Creates lead record with attribution:
   - Campaign ID
   - Offer ID
   - Affiliate network ID
   - Data list ID
   - Payout amount
9. Updates statistics:
   - Campaign conversion count
   - Campaign revenue
   - Offer conversion rate
10. Marks email as `is_leader = true`

**Revenue Tracking:**
- Per-campaign revenue
- Per-offer revenue
- Per-affiliate-network revenue
- Per-data-list ROI
- Date range reporting

---

#### 4.1.7 Standalone Tracking Links
**Purpose:** Create tracking links for non-email use cases

**Features:**
- Create individual tracking links
- Batch create multiple links
- Generate HTML embed snippets
- Track clicks with full analytics
- Tag links for organization
- View statistics per link

**Use Cases:**
- Social media posts (Twitter, Facebook, Instagram)
- SMS campaigns
- Website CTAs
- QR codes
- Influencer marketing

**Example HTML Snippet:**
```html
<a href="https://yourapp.com/t/c/abc-123-xyz" 
   target="_blank" 
   rel="nofollow noopener">
  Click Here
</a>
```

---

### 4.2 Data Management Features

#### 4.2.1 Email Data (Recipients)
**Purpose:** Manage recipient/lead database

**Features:**
- Import recipients (individual or bulk CSV)
- Flag management:
  - `is_seed` - Test/seed emails
  - `is_fresh` - New leads
  - `is_clean` - Validated emails
  - `is_opener` - Has opened emails (auto-updated)
  - `is_clicker` - Has clicked links (auto-updated)
  - `is_leader` - Has converted (auto-updated)
  - `is_unsub` - Unsubscribed
  - `is_optout` - Opted out
  - `is_hard_bounced` - Hard bounce detected
- Search and filter by:
  - Geo (country)
  - List name
  - Data list ID
  - Any flag
- Export to CSV
- Bulk delete

#### 4.2.2 Data Providers & Lists
**Purpose:** Organize email sources

**Data Providers:**
- Vendor/source name
- Status (active/inactive/deleted)
- Creator tracking

**Data Lists:**
- Associated with provider
- Name and description
- Total count
- Optional: External table reference
- Status management

**Use Case:** Track ROI per data source

---

#### 4.2.3 Blacklist Management
**Purpose:** Exclude problematic email addresses

**Features:**
- Multiple blacklist definitions
- Bulk import from CSV
- Individual add/remove
- Auto-exclusion during campaign send
- Status toggle (active/inactive)

**Blacklist Sources:**
- Hard bounces
- Spam complaints
- Manual additions
- Imported from affiliate networks

---

#### 4.2.4 Suppression List
**Purpose:** Global opt-out / do-not-contact list

**Features:**
- Add emails individually or bulk
- Automatic exclusion from all campaigns
- Integration with CAN-SPAM compliance
- Suppression process tracking
- Import from affiliate networks

**Legal Compliance:**
- CAN-SPAM Act (USA)
- GDPR (EU)
- CASL (Canada)

---

### 4.3 Sponsor/Affiliate Features

#### 4.3.1 Offer Management
**Purpose:** Manage marketing offers

**Offer Fields:**
- Name and description
- From name (sender name)
- Subject line
- HTML content
- Click URL (destination)
- Unsubscribe URL
- Affiliate network association
- Vertical (industry category)
- Production ID (external reference)
- Payout amount
- Status (active/paused/deleted)
- Rules and requirements

**Offer Analytics:**
- Total clicks
- Total conversions
- Conversion rate
- Total revenue
- Average payout
- ROI

**Associated Resources:**
- Creative assets (multiple HTML versions)
- From names (rotation pool)
- Subject lines (rotation pool)
- Offer links (multiple destinations)

---

#### 4.3.2 Creative Management
**Purpose:** Manage email HTML creatives

**Features:**
- Multiple creatives per offer
- HTML editor
- Preview functionality
- Version control
- Status management
- Vertical association

**Rotation:**
- Randomly select creative during campaign send
- Even distribution across recipients
- A/B testing support

---

#### 4.3.3 From Name & Subject Rotation
**Purpose:** Improve deliverability and engagement

**From Name Rotation:**
- Pool of sender names per offer
- Random selection during send
- Examples: "John Smith", "Marketing Team", "Customer Support"

**Subject Line Rotation:**
- Pool of subject lines per offer
- Random selection during send
- A/B test different approaches

**Benefits:**
- Avoid spam filters (pattern detection)
- Test messaging effectiveness
- Prevent recipient fatigue

---

#### 4.3.4 Affiliate Network Integration
**Purpose:** Integrate with affiliate platforms

**Features:**
- Network configuration
- Postback URL
- API key storage
- Status management

**Postback Handling:**
- Receive conversion notifications
- Parse network-specific formats
- Validate authenticity (IP whitelist, signature)
- Create lead records
- Update statistics

**Supported Networks (configurable):**
- MaxBounty
- PeerFly
- A4D
- CPA Lead
- Custom networks

---

### 4.4 RBAC & Team Features

#### 4.4.1 Role-Based Access Control
**Purpose:** Multi-user access with permission granularity

**Roles:**
- Admin - Full access
- Campaign Manager - Campaign creation/management
- Data Manager - Data list management
- Viewer - Read-only access
- Custom roles

**Permissions (80+):**
Grouped by resource:
- users.read, users.write, users.delete
- campaigns.read, campaigns.write, campaigns.delete
- offers.read, offers.write, offers.delete
- email_data.read, email_data.write, email_data.delete
- [continues for all resources]

**Permission Assignment:**
1. Create role
2. Assign permissions to role
3. Assign users to roles
4. Users inherit all permissions from assigned roles

---

#### 4.4.2 Team Management
**Purpose:** Organize users into teams

**Features:**
- Create teams
- Add/remove members
- Assign team-level permissions
- Team authorization (access to specific resources)

**Use Cases:**
- Separate client teams
- Department isolation
- Partner access control

**Team Authorizations:**
- Limit access to specific:
  - Offers
  - Data lists
  - Campaigns
  - Affiliate networks

---

### 4.5 System Features

#### 4.5.1 Bounce Detection
**Purpose:** Identify invalid email addresses

**Process:**
1. Scan Gmail inbox for "Mail Delivery Subsystem" messages
2. Parse bounce notifications
3. Extract failed email addresses
4. Store in `bounce_logs` table
5. Mark `email_data.is_hard_bounced = true`

**Bounce Types:**
- Hard bounce (permanent failure)
- Soft bounce (temporary failure) - not tracked

**Auto-Exclusion:**
- Hard bounced emails excluded from future campaigns
- Improves sender reputation

---

#### 4.5.2 Audit Logging
**Purpose:** Track all user actions

**Logged Actions:**
- CREATE, UPDATE, DELETE on all entities
- Login/logout events
- Permission changes
- Configuration changes

**Log Fields:**
- User ID
- Action type
- Table name
- Record ID
- Old values (JSONB)
- New values (JSONB)
- IP address
- User agent
- Timestamp

**Use Cases:**
- Security audit trail
- Compliance requirements
- Troubleshooting
- Change history

---

#### 4.5.3 Application Logging
**Purpose:** System-level logging

**Log Levels:**
- DEBUG - Detailed debugging information
- INFO - General informational messages
- WARNING - Warning messages
- ERROR - Error conditions
- FATAL - Critical failures

**Log Storage:**
- Database (`application_logs` table)
- Can be configured for file or external service

---

#### 4.5.4 Rate Limiting
**Purpose:** Prevent abuse and manage quotas

**Rate Limits:**
- General API: 500 requests / 15 minutes per IP
- Email send: 10 requests / hour per IP
- Test emails: 5 requests / 10 minutes per IP
- Auth endpoints: 20 requests / 15 minutes per IP

**Configuration:**
- Adjustable via `RATE_LIMIT_MAX` environment variable
- Can use Redis for distributed rate limiting

---

#### 4.5.5 Google Account Management
**Purpose:** Manage multiple sender accounts

**Features:**
- Store multiple Google account credentials
- Track daily sending quota per account
- Monitor account status (active/suspended)
- Automatic account rotation
- Quota reset tracking

**Account Fields:**
- Email address
- Encrypted credentials (JWT)
- Daily limit
- Current sent today
- Last reset date
- Status

**Benefits:**
- Scale sending capacity
- Distribute load across accounts
- Isolate account issues

---

### 4.6 Utility Features

#### 4.6.1 Image Upload
**Purpose:** Host images for email creatives

**Features:**
- Upload images via multipart form
- Store in file system (configurable to S3)
- Generate public URLs
- Track uploads in database
- Delete images

**Use Cases:**
- Email creative assets
- Logo hosting
- Banner images
- Tracking pixels (custom)

---

#### 4.6.2 Tools

**Mailbox Extractor:**
- Extract email addresses from text
- Regex pattern matching
- Deduplication

**Value Extractor:**
- Extract values by custom pattern
- Useful for parsing logs, data cleaning

**SPF Checker:**
- Check domain SPF records
- Validate email authentication setup

**Reputation Checker:**
- Check domain/IP reputation
- Integration with reputation services

---


## 5. REBUILD DOCUMENTATION

### 5.1 Prerequisites

**Required Software:**
- **Node.js:** v16 or higher (v18 recommended)
- **PostgreSQL:** v12 or higher (v15 recommended)
- **npm:** v8 or higher (comes with Node.js)
- **Python:** 3.8+ (for utility scripts)
- **Git:** For cloning repository
- **Google Cloud Account:** For Workspace API integration (optional)

**System Requirements:**
- **CPU:** 2+ cores recommended
- **RAM:** 4GB minimum, 8GB recommended
- **Disk Space:** 2GB for application + database
- **OS:** Linux (Ubuntu/Debian recommended), macOS, Windows (with WSL)

---

### 5.2 Step-by-Step Setup Instructions

#### Step 1: Clone Repository
```bash
git clone https://github.com/anaitabd/GAdmin-Toolkit.git
cd GAdmin-Toolkit
```

#### Step 2: Install PostgreSQL (if not installed)

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Verify Installation:**
```bash
psql --version
# Should output: psql (PostgreSQL) 15.x
```

#### Step 3: Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE gadmin;
CREATE USER gadmin WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE gadmin TO gadmin;
ALTER DATABASE gadmin OWNER TO gadmin;
\q
```

#### Step 4: Configure Environment Variables

Create `.env` file in project root:
```bash
# Database Configuration (REQUIRED)
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE=gadmin
export PGUSER=gadmin
export PGPASSWORD=your_secure_password
export PGSSL=false  # Set to true for production with SSL

# Application Configuration
export PORT=3000
export NODE_ENV=development
export BASE_URL=http://localhost:3000

# JWT Secret (REQUIRED for authentication)
export JWT_SECRET=your_very_long_random_secret_key_at_least_32_characters

# Google Cloud Configuration (OPTIONAL - for G Suite features)
export GOOGLE_CRED_JSON_B64=base64_encoded_service_account_json
export KMS_KEY_ID=projects/YOUR_PROJECT/locations/global/keyRings/YOUR_RING/cryptoKeys/YOUR_KEY
export ADMIN_EMAIL=admin@yourdomain.com

# Rate Limiting (OPTIONAL - defaults shown)
export RATE_LIMIT_MAX=500  # Requests per 15 minutes

# Email Configuration (OPTIONAL)
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USER=your_email@gmail.com
export SMTP_PASS=your_app_password
```

**Load Environment Variables:**
```bash
source .env
# Or add to ~/.bashrc or ~/.zshrc for persistence
```

#### Step 5: Initialize Database Schema

```bash
# Create database tables
psql "$PGDATABASE" -f main/api/db/schema.sql

# Expected output: CREATE TABLE (x46 times)
```

#### Step 6: (Optional) Import Sample Data

```bash
# Install backend dependencies first
cd main
npm install
cd ..

# Run import script
node main/api/db/import.js

# This imports sample data from files/ directory:
# - users.csv
# - names.csv
# - email_data.csv (if exists)
# - email_info.csv
# - email_templates.csv
```

#### Step 7: Install Backend Dependencies

```bash
cd main
npm install

# Verify installation
npm list
# Should show all dependencies without errors
```

#### Step 8: Install Frontend Dependencies

```bash
cd ../frontend
npm install

# Verify installation
npm list
# Should show all dependencies without errors
```

#### Step 9: (Optional) Install Python Dependencies

```bash
cd ../py
pip install -r requirement.txt
# Or use: pip3 install -r requirement.txt
```

---

### 5.3 Google Cloud Setup (Optional but Recommended)

**Required for:**
- Google Workspace user management
- Gmail API email sending
- Better email deliverability

#### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project"
3. Name: "GAdmin-Toolkit" (or your preference)
4. Note the Project ID

#### Step 2: Enable Required APIs

In Google Cloud Console:
1. Navigate to "APIs & Services" > "Library"
2. Enable the following APIs:
   - **Google Workspace Admin SDK API**
   - **Gmail API**
   - (Optional) **Cloud Key Management Service (KMS) API** for credential encryption

#### Step 3: Create Service Account

1. Navigate to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Name: "gadmin-service-account"
4. Grant roles:
   - Service Account User
   - Service Account Token Creator
5. Click "Done"

#### Step 4: Generate Service Account Key

1. Click on created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Select "JSON"
5. Save the JSON file securely

#### Step 5: Enable Domain-Wide Delegation

1. In service account details, click "Show Domain-Wide Delegation"
2. Enable "Enable Google Workspace Domain-Wide Delegation"
3. Note the Client ID

#### Step 6: Authorize in Google Workspace Admin

1. Go to [Google Workspace Admin Console](https://admin.google.com/)
2. Navigate to Security > API Controls > Domain-wide Delegation
3. Click "Add new"
4. Enter Client ID from service account
5. Add OAuth Scopes:
   ```
   https://www.googleapis.com/auth/admin.directory.user
   https://mail.google.com/
   ```
6. Click "Authorize"

#### Step 7: Encode Credentials

```bash
# Encode service account JSON to base64
cat path/to/service-account.json | base64 -w 0 > credentials.txt

# Copy the output and add to .env:
export GOOGLE_CRED_JSON_B64="<paste_base64_string_here>"
```

#### Step 8: (Optional) Set up KMS Encryption

For enhanced security, encrypt credentials with Google KMS:

1. Create key ring in Cloud KMS
2. Create encryption key
3. Grant service account access to key
4. Encrypt your credentials JSON
5. Set KMS_KEY_ID in environment variables

---

### 5.4 Running the Application

#### Option 1: Development Mode (Recommended for Testing)

**Terminal 1 - Backend API:**
```bash
cd main/api
npm run dev

# Server starts on http://localhost:3000
# Nodemon watches for file changes and auto-restarts
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev

# Vite dev server starts on http://localhost:5173
# Hot module replacement (HMR) enabled
```

**Access Application:**
- Frontend: http://localhost:5173
- API: http://localhost:3000
- API Docs: http://localhost:3000/api

#### Option 2: Production Mode

**Build Frontend:**
```bash
cd frontend
npm run build

# Creates optimized production build in dist/
```

**Serve Frontend (Option A - Serve with Node):**
```bash
cd frontend
npm install -g serve
serve -s dist -p 5173
```

**Serve Frontend (Option B - Serve with Express):**
The backend can serve static files. Copy frontend build to backend:
```bash
cp -r frontend/dist main/api/public
```

Then update `main/api/server.js`:
```javascript
// Add before route definitions
app.use(express.static('public'));
```

**Start Backend:**
```bash
cd main/api
npm start

# Production server on http://localhost:3000
```

#### Option 3: Docker Compose (Recommended for Production)

**Prerequisites:**
- Docker installed
- Docker Compose installed

**Start All Services:**
```bash
# From project root
docker-compose up -d

# Services:
# - PostgreSQL on port 5432
# - Backend API on port 3000
# - Frontend on port 80
```

**Access Application:**
- Frontend: http://localhost
- API: http://localhost:3000

**View Logs:**
```bash
docker-compose logs -f
```

**Stop Services:**
```bash
docker-compose down
```

**Rebuild After Code Changes:**
```bash
docker-compose build
docker-compose up -d
```

---

### 5.5 Running Standalone Scripts

#### Generate Test Users
```bash
cd main/api
node generate.js yourdomain.com 100

# Generates 100 random users with @yourdomain.com emails
# Inserts into database
```

#### Create Users in Google Workspace
```bash
node create.js

# Reads users from database
# Creates them in Google Workspace via Admin SDK
# Requires Google credentials configured
```

#### Delete Users from Google Workspace
```bash
node delete.js

# Lists all users in domain
# Deletes all except admin
# Prompts for confirmation
```

#### Detect Bounced Emails
```bash
node bounce.js

# Scans Gmail for bounce notifications
# Updates bounce_logs table
# Marks affected emails as hard_bounced
```

#### Send Bulk Emails (Gmail API)
```bash
node sendApi.js

# Sends emails to all active recipients
# Uses Gmail API
# Requires active template and email info
```

#### Send Bulk Emails (SMTP)
```bash
node smtp.js

# Sends emails via SMTP
# Requires SMTP configuration
```

---

### 5.6 Database Migrations

**Apply New Migrations:**
```bash
# List available migrations
ls main/api/db/migrations/

# Apply a specific migration
psql "$PGDATABASE" -f main/api/db/migrations/V3__roles_teams_features.sql
```

**Create New Migration:**
```bash
# Create new migration file
touch main/api/db/migrations/V4__your_feature_name.sql

# Add SQL statements
# Follow naming convention: V{number}__{description}.sql
```

**Rollback (Manual):**
```bash
# There's no automatic rollback
# Create reverse migration or restore from backup
```

---

### 5.7 Testing

#### Test API Endpoints
```bash
cd main/api
bash test-api.sh

# Tests all major API endpoints
# Requires server running
```

#### Test Email Sending
```bash
bash test-email-send-endpoints.sh

# Tests email send functionality
# Sends test emails
```

#### Test Tracking Links
```bash
bash test-tracking-links.sh

# Tests click tracking
# Tests open tracking
```

#### Frontend Linting
```bash
cd frontend
npm run lint

# Runs ESLint
# Reports code style issues
```

#### Frontend Build (TypeScript Check)
```bash
cd frontend
npm run build

# Compiles TypeScript
# Fails if type errors exist
```

---

### 5.8 Configuration Files Reference

**main/package.json** - Backend dependencies
```json
{
  "dependencies": {
    "express": "^4.18.3",
    "pg": "^8.12.0",
    "googleapis": "^133.0.0",
    "nodemailer": "^6.9.13",
    "multer": "^2.0.2",
    "jsonwebtoken": "^9.0.2",
    "axios": "^1.6.8",
    // ... more
  }
}
```

**frontend/package.json** - Frontend dependencies
```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.13.0",
    "@tanstack/react-query": "^5.90.20",
    "axios": "^1.13.4",
    "tailwindcss": "^4.1.18"
    // ... more
  }
}
```

**docker-compose.yml** - Container orchestration
**Dockerfile** - Backend container definition
**frontend/Dockerfile** - Frontend container definition
**vite.config.ts** - Vite bundler configuration
**tsconfig.json** - TypeScript compiler options

---

### 5.9 Troubleshooting

#### Database Connection Issues
```bash
# Test connection
psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE

# Common issues:
# 1. PostgreSQL not running
sudo systemctl status postgresql
sudo systemctl start postgresql

# 2. Wrong credentials
# Check .env file

# 3. Database doesn't exist
psql -U postgres -c "CREATE DATABASE gadmin"
```

#### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000
# Or
netstat -tulpn | grep 3000

# Terminate process or change PORT in .env
```

#### Google API Errors
```bash
# Verify credentials
echo $GOOGLE_CRED_JSON_B64 | base64 -d | jq

# Common issues:
# 1. Service account not authorized in Workspace Admin
# 2. APIs not enabled in Google Cloud Console
# 3. Invalid base64 encoding
```

#### NPM Install Fails
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

---

### 5.10 Production Deployment Checklist

- [ ] Set NODE_ENV=production
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Enable PGSSL=true for database
- [ ] Configure proper CORS settings
- [ ] Set up HTTPS (use Nginx/Caddy as reverse proxy)
- [ ] Configure production rate limits
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Set up monitoring (error tracking)
- [ ] Use environment-specific credentials
- [ ] Secure Google credentials (use KMS)
- [ ] Configure firewall rules
- [ ] Set up CDN for static assets
- [ ] Enable gzip compression (already in code)
- [ ] Configure proper session management
- [ ] Set up health check endpoints
- [ ] Document API endpoints
- [ ] Create admin user accounts
- [ ] Test disaster recovery plan

---


## 6. CODE QUALITY ASSESSMENT

### 6.1 Security Analysis

#### 6.1.1 Security Strengths ✅

**SQL Injection Prevention:**
- ✅ All queries use parameterized statements ($1, $2, etc.)
- ✅ No string concatenation for SQL queries
- ✅ PostgreSQL pg library with native parameterization

**Credential Management:**
- ✅ Google credentials stored as base64 (not plaintext)
- ✅ Optional KMS encryption support
- ✅ Credentials table for encrypted storage
- ✅ No hardcoded credentials in code

**Rate Limiting:**
- ✅ Express-rate-limit middleware active
- ✅ Different limits for different endpoint types
- ✅ IP-based rate limiting

**Input Validation:**
- ✅ Email validation using RFC 5322 regex
- ✅ Domain validation
- ✅ Password strength requirements
- ✅ Dedicated validation.js library

**CORS Protection:**
- ✅ Can be configured for production

---

#### 6.1.2 Security Vulnerabilities & Recommendations 🔴

**HIGH PRIORITY:**

1. **No Authentication System**
   - ❌ API endpoints are currently unprotected
   - ❌ No JWT validation middleware active
   - ❌ Anyone can access all endpoints
   - **Fix:** Implement JWT authentication middleware
   - **Impact:** Critical - full data exposure

2. **No Authorization/RBAC Enforcement**
   - ❌ RBAC tables exist but not enforced
   - ❌ Permissions not checked before actions
   - **Fix:** Add permission checking middleware
   - **Impact:** High - unauthorized actions possible

3. **Password Storage**
   - ⚠️ Users table has passwords in TEXT (hopefully hashed?)
   - ❌ No evidence of bcrypt usage in user creation
   - **Fix:** Use bcrypt to hash passwords before storage
   - **Example:**
   ```javascript
   const bcrypt = require('bcrypt');
   const hashedPassword = await bcrypt.hash(password, 10);
   ```

4. **Session Management**
   - ⚠️ user_sessions table exists but not actively used
   - ❌ No session expiration enforcement
   - **Fix:** Implement session validation and expiration

5. **API Key Exposure**
   - ⚠️ Affiliate network API keys stored in plaintext
   - **Fix:** Encrypt sensitive configuration

6. **Environment Variables**
   - ⚠️ .env file not in .gitignore (risk of commit)
   - **Fix:** Ensure .env in .gitignore, use .env.example

**MEDIUM PRIORITY:**

7. **XSS Prevention**
   - ⚠️ Email HTML content not sanitized
   - ⚠️ User input reflected in emails
   - **Fix:** Sanitize HTML input, use DOMPurify
   - **Impact:** Medium - XSS in emails

8. **CSRF Protection**
   - ❌ No CSRF tokens implemented
   - **Fix:** Add CSRF middleware (csurf package)

9. **Error Information Leakage**
   - ⚠️ Full error messages returned to client
   - ⚠️ Stack traces visible in development
   - **Fix:** Generic error messages in production

10. **File Upload Security**
    - ⚠️ Image upload uses multer but no file type validation
    - ⚠️ No file size limits
    - **Fix:** Validate file types, set size limits

**LOW PRIORITY:**

11. **Audit Log Completeness**
    - ⚠️ Not all actions logged
    - **Fix:** Ensure comprehensive audit trail

12. **API Versioning**
    - ⚠️ No API versioning (/api/v1/)
    - **Impact:** Low - breaking changes difficult

---

### 6.2 Performance Analysis

#### 6.2.1 Performance Strengths ✅

**Database Optimization:**
- ✅ Proper indexing on foreign keys
- ✅ Pagination support (LIMIT/OFFSET)
- ✅ Connection pooling via pg library

**Compression:**
- ✅ Gzip compression enabled globally
- ✅ Reduces payload size significantly

**Caching (Frontend):**
- ✅ React Query with 5-minute staleTime
- ✅ Prevents redundant API calls

**Batch Processing:**
- ✅ Email sending in configurable batches
- ✅ Reduces database round trips

---

#### 6.2.2 Performance Issues & Recommendations ⚠️

**HIGH PRIORITY:**

1. **N+1 Query Problem**
   - ❌ Multiple queries in loops (email sending)
   - **Example:** Fetching recipients one batch at a time
   - **Fix:** Fetch larger batches, use JOINs
   - **Impact:** High latency in campaign sends

2. **No Database Indexes on Frequently Queried Columns**
   - ❌ Missing indexes on:
     - email_data.to_email (searches)
     - email_data.geo (filtering)
     - email_logs.campaign_id (stats)
     - click_tracking.track_id (lookups)
   - **Fix:** Add indexes
   ```sql
   CREATE INDEX idx_email_data_to_email ON email_data(to_email);
   CREATE INDEX idx_email_data_geo ON email_data(geo);
   CREATE INDEX idx_email_logs_campaign_id ON email_logs(campaign_id);
   CREATE INDEX idx_click_tracking_track_id ON click_tracking(track_id);
   ```

3. **Frontend Bundle Size**
   - ⚠️ No code splitting
   - ⚠️ All 50 pages loaded upfront
   - **Fix:** Implement lazy loading
   ```tsx
   const CampaignPage = lazy(() => import('./pages/CampaignPage'));
   ```

4. **Database Connection Pooling**
   - ⚠️ No explicit pool size configuration
   - **Fix:** Configure pg pool
   ```javascript
   const pool = new Pool({
     max: 20,
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   });
   ```

**MEDIUM PRIORITY:**

5. **Rate Limiter Store**
   - ⚠️ In-memory rate limiting (not distributed)
   - **Fix:** Use Redis for distributed deployments

6. **Large Payload Sizes**
   - ⚠️ Some API responses return full objects with all fields
   - **Fix:** Implement field selection, pagination

7. **No CDN for Static Assets**
   - ⚠️ Images served from application server
   - **Fix:** Use S3 + CloudFront or similar CDN

8. **Frontend Re-renders**
   - ⚠️ Some components re-render unnecessarily
   - **Fix:** Use React.memo, useMemo, useCallback

---

### 6.3 Code Quality Issues

#### 6.3.1 Code Organization ✅

**Strengths:**
- ✅ Clear separation of concerns (routes, jobs, lib)
- ✅ Consistent file naming conventions
- ✅ Modular route structure (41 modules)
- ✅ Shared library functions

---

#### 6.3.2 Code Quality Issues 📋

**HIGH PRIORITY:**

1. **Inconsistent Error Handling**
   - ⚠️ Some routes use try-catch, others don't
   - ⚠️ Error responses not standardized
   - **Fix:** Global error handler middleware
   ```javascript
   app.use((err, req, res, next) => {
     console.error(err.stack);
     res.status(err.status || 500).json({
       success: false,
       error: process.env.NODE_ENV === 'production' 
         ? 'Internal server error' 
         : err.message
     });
   });
   ```

2. **No Request Validation Middleware**
   - ❌ Manual validation in each route
   - ❌ Inconsistent validation approach
   - **Fix:** Use express-validator or Joi
   ```javascript
   const { body, validationResult } = require('express-validator');
   
   app.post('/api/users',
     body('email').isEmail(),
     body('password').isLength({ min: 8 }),
     (req, res) => {
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return res.status(400).json({ errors: errors.array() });
       }
       // ... create user
     }
   );
   ```

3. **Hardcoded Values**
   - ⚠️ Magic numbers scattered in code
   - **Examples:** Batch size (300), delays, timeouts
   - **Fix:** Move to configuration file or environment variables

4. **Large Files**
   - ⚠️ CampaignPage.tsx (72,839 lines) - too large
   - ⚠️ sendCampaignApi.js (14,246 lines) - too large
   - **Fix:** Break into smaller components/modules

5. **Code Duplication**
   - ⚠️ Similar CRUD patterns in all route modules
   - **Fix:** Create generic CRUD controller
   ```javascript
   const createCrudController = (tableName) => ({
     getAll: async (req, res) => { /* generic get all */ },
     getById: async (req, res) => { /* generic get by id */ },
     create: async (req, res) => { /* generic create */ },
     update: async (req, res) => { /* generic update */ },
     delete: async (req, res) => { /* generic delete */ }
   });
   ```

**MEDIUM PRIORITY:**

6. **No Type Checking on Backend**
   - ⚠️ JavaScript backend (no TypeScript)
   - **Fix:** Migrate to TypeScript or add JSDoc types

7. **Lack of Unit Tests**
   - ❌ No test files found
   - **Fix:** Add Jest tests for critical functions

8. **No API Documentation**
   - ⚠️ Manual API_DOCUMENTATION.md (can get outdated)
   - **Fix:** Use Swagger/OpenAPI for auto-generated docs

9. **Console.log Debugging**
   - ⚠️ Many console.log statements in code
   - **Fix:** Use proper logging library (winston, pino)

10. **No Linting on Backend**
    - ⚠️ No ESLint configuration for backend
    - **Fix:** Add ESLint to main/
    ```json
    {
      "extends": "eslint:recommended",
      "env": { "node": true, "es6": true }
    }
    ```

---

### 6.4 Technical Debt

#### High-Priority Technical Debt:

1. **Authentication System Missing**
   - Priority: Critical
   - Effort: 2-3 days
   - Impact: Enables production deployment

2. **RBAC Enforcement Missing**
   - Priority: High
   - Effort: 3-5 days
   - Impact: Proper access control

3. **Database Indexes Missing**
   - Priority: High
   - Effort: 1 day
   - Impact: Significant performance improvement

4. **Frontend Code Splitting**
   - Priority: Medium
   - Effort: 2-3 days
   - Impact: Faster initial page load

5. **Migration to TypeScript Backend**
   - Priority: Medium
   - Effort: 2-4 weeks
   - Impact: Better maintainability

6. **Comprehensive Test Suite**
   - Priority: Medium
   - Effort: 3-4 weeks
   - Impact: Confidence in changes

7. **API Versioning**
   - Priority: Low
   - Effort: 1 week
   - Impact: Better API management

---

### 6.5 Best Practice Violations

#### Violations Found:

1. **Passwords in User Table**
   - ❌ Should be hashed with bcrypt
   - ❌ Should have minimum length enforced at DB level

2. **Sensitive Data in Logs**
   - ⚠️ Credentials, emails may be logged
   - **Fix:** Sanitize logs, exclude sensitive fields

3. **No Health Check Endpoint**
   - ❌ No /health or /status endpoint
   - **Fix:** Add health check
   ```javascript
   app.get('/health', (req, res) => {
     res.json({ status: 'ok', timestamp: new Date().toISOString() });
   });
   ```

4. **No Graceful Shutdown**
   - ⚠️ Server doesn't handle SIGTERM gracefully
   - **Fix:** Handle process signals
   ```javascript
   process.on('SIGTERM', async () => {
     console.log('SIGTERM received, closing server...');
     server.close(() => {
       pool.end(() => {
         process.exit(0);
       });
     });
   });
   ```

5. **Frontend Environment Variables Not Protected**
   - ⚠️ API URLs hardcoded or in .env (exposed in build)
   - **Fix:** Use Vite env variables properly (VITE_ prefix)

---

### 6.6 Recommendations Summary

#### Immediate Actions (Week 1):
1. ✅ Add authentication middleware with JWT
2. ✅ Hash passwords with bcrypt
3. ✅ Add database indexes for performance
4. ✅ Implement RBAC permission checking
5. ✅ Add health check endpoint

#### Short-Term (Month 1):
1. ✅ Add comprehensive error handling
2. ✅ Implement request validation middleware
3. ✅ Add logging library (winston)
4. ✅ Set up monitoring and alerts
5. ✅ Add unit tests for critical functions
6. ✅ Configure CORS properly
7. ✅ Add CSRF protection

#### Medium-Term (Quarter 1):
1. ✅ Migrate backend to TypeScript
2. ✅ Implement frontend code splitting
3. ✅ Add Swagger/OpenAPI documentation
4. ✅ Comprehensive test suite (unit + integration)
5. ✅ Refactor large files into smaller modules
6. ✅ Set up CI/CD pipeline
7. ✅ Add Redis for distributed rate limiting

#### Long-Term (Year 1):
1. ✅ Consider microservices architecture
2. ✅ Implement WebSocket for real-time updates
3. ✅ Add GraphQL API option
4. ✅ Implement caching layer (Redis)
5. ✅ Add advanced analytics/reporting
6. ✅ Mobile app support

---

### 6.7 Overall Assessment

**Strengths:**
- Comprehensive feature set
- Well-organized codebase structure
- Modern tech stack (React, PostgreSQL, Express)
- Good separation of concerns
- Solid foundation for email marketing platform

**Weaknesses:**
- Missing authentication/authorization enforcement
- Security vulnerabilities need addressing
- Performance optimizations needed
- Lack of automated testing
- Some code quality issues

**Grade:** B- (75/100)
- Functionality: A (95/100) - Feature-complete and functional
- Security: C (60/100) - Critical gaps in auth/authz
- Performance: B (80/100) - Good but can be optimized
- Code Quality: B (75/100) - Well-structured but needs polish
- Testing: D (40/100) - Minimal test coverage
- Documentation: A- (90/100) - Excellent documentation

**Recommendation:**
This is a solid MVP with excellent functionality and good documentation. Before production deployment, critical security issues (authentication, authorization, password hashing) MUST be addressed. The codebase is production-ready after implementing the "Immediate Actions" recommendations.

---

## APPENDIX

### A. Key Files Quick Reference

**Backend Core:**
- `main/api/server.js` - Entry point
- `main/api/routes/*.js` - 41 API route modules
- `main/api/jobs/*.js` - 8 background job processors
- `main/api/lib/*.js` - Shared libraries
- `main/api/db/schema.sql` - Database schema (46 tables)

**Frontend Core:**
- `frontend/src/main.tsx` - Entry point
- `frontend/src/App.tsx` - Route configuration
- `frontend/src/pages/*.tsx` - 50 page components
- `frontend/src/components/layout/Sidebar.tsx` - Navigation
- `frontend/src/api/client.ts` - API client

**Configuration:**
- `docker-compose.yml` - Container orchestration
- `main/package.json` - Backend dependencies
- `frontend/package.json` - Frontend dependencies
- `frontend/vite.config.ts` - Build configuration
- `.env` - Environment variables

---

### B. Database Quick Reference

**Tables:** 46 total
**Largest Tables:**
- email_data (recipients)
- email_logs (send logs)
- click_events (click history)
- leads (conversions)

**Key Relationships:**
- campaigns → jobs (one-to-one)
- campaigns → offers (many-to-one)
- offers → creatives (one-to-many)
- email_data → data_lists (many-to-one)

---

### C. API Endpoint Count by Category

- Core Resources: 30+ endpoints
- Campaign Management: 35+ endpoints
- Tracking: 20+ endpoints
- Data Management: 30+ endpoints
- Sponsor/Affiliate: 35+ endpoints
- RBAC & Teams: 25+ endpoints
- Utilities: 15+ endpoints

**Total: 170+ API endpoints**

---

### D. Technology Dependency Versions

**Backend:**
- Node.js: v16+
- Express: 4.18.3
- PostgreSQL driver (pg): 8.12.0
- Google APIs: 133.0.0
- Nodemailer: 6.9.13

**Frontend:**
- React: 19.2.0
- TypeScript: 5.9.3
- Vite: 7.2.4
- React Router: 7.13.0
- React Query: 5.90.20
- Tailwind: 4.1.18

---

## CONCLUSION

This comprehensive analysis provides everything needed to understand, rebuild, and improve the GAdmin-Toolkit application. The codebase is well-structured with a solid foundation, but requires security hardening before production deployment.

**Next Steps:**
1. Address critical security issues (authentication, password hashing)
2. Add database indexes for performance
3. Implement comprehensive testing
4. Set up monitoring and logging
5. Deploy to production with proper configuration

The application is feature-complete for email marketing and campaign management, with excellent potential for growth and scalability.

---

**Document Version:** 1.0  
**Last Updated:** February 13, 2026  
**Maintainer:** Development Team  
**Contact:** See repository for contact information

---

END OF COMPREHENSIVE CODEBASE ANALYSIS
