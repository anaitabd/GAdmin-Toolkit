# 🎯 GAdmin Toolkit - Ultimate Frontend Development Prompt

## 📋 Project Overview

Develop a **production-grade, modern, and scalable React/Next.js frontend** for the GAdmin Toolkit - a professional email delivery platform with G Suite management capabilities. This is an **enterprise-level application** that manages large-scale email campaigns, sender accounts, G Suite domains, and tracking analytics.

---

## 🏗️ System Architecture (Backend Context)

### Core Backend Features

The backend is a **horizontally scalable email delivery platform** built with:
- **Node.js + Express.js** REST API
- **PostgreSQL** database with partitioned tables for millions of records
- **Worker-based architecture** (1 worker = 1 sender account)
- **Gmail API & SMTP** support for email sending
- **Real-time tracking** (opens, clicks, unsubscribes, bounces)
- **G Suite management** (domain-wide delegation, bulk user operations)
- **JWT authentication** with role-based access control

### Key Backend Capabilities

1. **Email Delivery System**
   - Send up to 2M+ emails/day (1000 accounts × 2000 emails)
   - Smart rate limiting and account warm-up
   - Automatic retry logic with exponential backoff
   - Daily limit enforcement per sender account
   - Health monitoring and auto-pause on failures

2. **G Suite Management**
   - Multi-domain support
   - Service account authentication (JWT/Domain-wide delegation)
   - Bulk user generation (fake data for testing)
   - Bulk user creation/deletion in Google Workspace
   - User synchronization from Google to local database
   - Auto-create sender accounts from G Suite users

3. **Campaign Management**
   - Create and manage email campaigns
   - Queue emails for batch processing
   - Track campaign performance (sent, opens, clicks, bounces)
   - Campaign-level analytics and reports
   - Status tracking (draft, active, paused, completed)

4. **Sender Accounts**
   - Gmail API (OAuth2) and SMTP support
   - Warm-up schedules (6-week gradual increase)
   - Daily counters (sent, bounces, errors)
   - Status management (active, paused, suspended, warming_up)
   - Per-account statistics and health monitoring

5. **Tracking & Analytics**
   - Open tracking (1×1 pixel)
   - Click tracking (safe URL rewrites)
   - Unsubscribe handling (one-click RFC 8058)
   - Bounce processing (hard, soft, complaint)
   - Real-time event logging to database
   - Time-series analytics with PostgreSQL partitioning

6. **Queue Management**
   - Atomic batch fetching (no duplicates)
   - Priority-based queuing
   - Retry mechanism (max 3 attempts)
   - Suppression lists (bounces, unsubscribes)
   - Real-time queue status monitoring

---

## 🎨 Frontend Requirements

### Technology Stack

**Primary Framework:**
- **Next.js 14+** (App Router) with React 18+
- TypeScript for type safety
- TailwindCSS for styling

**State Management:**
- React Query (TanStack Query) for server state
- Zustand for global UI state
- Context API for auth state

**UI Component Library:**
- shadcn/ui (Radix UI primitives + Tailwind)
- Recharts for data visualization
- React Hook Form for form management
- Zod for validation

**Additional Libraries:**
- Axios for API calls with interceptors
- date-fns for date formatting
- lucide-react for icons
- sonner for toast notifications
- next-themes for dark mode support

---

## 📱 Required Pages & Features

### 1. Authentication

#### Login Page (`/login`)
- Modern, centered card design
- Username/password fields with validation
- "Remember me" checkbox
- Error handling with clear feedback
- Loading states
- Redirect to dashboard on success
- Auto-redirect if already authenticated

#### Session Management
- JWT token stored in httpOnly cookies (if possible) or secure localStorage
- Auto-refresh token before expiration
- Logout functionality (clear token + redirect)
- 401 interceptor to handle expired tokens
- Protected routes (HOC or middleware)

---

### 2. Dashboard (`/dashboard`)

#### Overview Cards (Top Row)
- **Total Sender Accounts**: Active, paused, suspended counts
- **Emails Sent Today**: Progress bar toward daily limits
- **Active Campaigns**: Running campaigns count
- **Queue Status**: Pending emails count with trend

#### Statistics Charts (Middle Section)
- **Send Volume Timeline** (last 7/30 days)
  - Line chart: emails sent per day
  - Breakdown by status (sent, failed, pending)
- **Open & Click Rates** (last 7/30 days)
  - Area chart: open rate %, click rate %
  - Comparison to previous period
- **Sender Account Health**
  - Horizontal bar chart: accounts by status
  - Color-coded (green=active, yellow=warming, red=suspended)

#### Recent Activity (Bottom Section)
- **Recent Campaigns**: 5 latest with quick stats
- **Recent Send Logs**: Last 10 emails sent
- **System Alerts**: Errors, warnings, paused accounts

---

### 3. Sender Accounts Management (`/accounts`)

#### Accounts List View
**Table with columns:**
- Email address (sortable)
- Provider (Gmail API / SMTP badge)
- Status (colored badge: active, paused, suspended, warming_up)
- Daily Sent / Daily Limit (progress bar)
- Warmup Stage (if warming_up status)
- Last Used (time ago)
- Actions (view, edit, pause, delete)

**Filters:**
- Status dropdown (all, active, paused, suspended, warming_up)
- Provider filter (all, gmail, smtp)
- Search by email

**Actions:**
- **Add Account** button (top-right)
- **Bulk Actions**: Pause/resume selected accounts
- **Export to CSV**

#### Add/Edit Account Form (Modal or Slide-over)
**Gmail API Fields:**
- Email address
- Display name (optional)
- Client ID, Client Secret, Refresh Token
- Daily limit (default: 2000)
- Send delay (ms, default: 100)
- Enable warm-up toggle

**SMTP Fields:**
- Email address
- Display name
- SMTP host, port
- SMTP username, password
- Use TLS toggle
- Daily limit, send delay

**Validation:**
- Required fields validation
- Email format validation
- Port number range validation

#### Account Details Page (`/accounts/[id]`)
**Top Section:**
- Account info card (email, provider, status)
- Quick actions (pause, resume, delete)

**Statistics (Last 30 Days):**
- Total sent, successful, failed counts
- Opens, clicks counts
- Average response time
- Bounce rate

**Charts:**
- Daily send volume (bar chart)
- Success rate timeline (line chart)

**Send Logs Table:**
- Recent emails sent from this account
- Recipient, subject, status, timestamp
- Pagination

---

### 4. Campaigns Management (`/campaigns`)

#### Campaigns List View
**Card Grid Layout:**
Each card shows:
- Campaign name
- Status badge (draft, active, paused, completed)
- Stats: Sent / Opens / Clicks
- Progress bar (emails sent / total queued)
- Created date
- Actions menu (view, edit, pause, delete)

**Filters:**
- Status tabs (all, active, paused, completed)
- Sort by: created date, name, sent count

**Actions:**
- **New Campaign** button (top-right)

#### Create Campaign Form (`/campaigns/new`)
**Step 1: Campaign Details**
- Campaign name
- Description (optional)
- Sponsor ID (optional)

**Step 2: Email Content**
- Subject line
- From name
- HTML body (rich text editor: Tiptap or Quill)
- Text body (fallback)
- Preview pane (side-by-side)

**Step 3: Recipients**
- Upload CSV file
- OR paste email list (one per line)
- OR select from contacts list
- Validation: check against bounce/unsubscribe lists
- Show total valid recipients

**Step 4: Sender Selection**
- Select sender accounts (multiple select)
- Show available capacity per account
- Auto-distribute emails across accounts

**Step 5: Schedule**
- Send immediately OR schedule for later
- Set priority (1-10, default: 5)

**Step 6: Review & Launch**
- Summary of all settings
- Estimated send time
- Confirm button

#### Campaign Details Page (`/campaigns/[id]`)
**Header:**
- Campaign name, status, created date
- Action buttons: Pause, Resume, Cancel, Duplicate

**Real-Time Stats Cards:**
- Total Sent, Delivered, Failed
- Open Rate (% + count)
- Click Rate (% + count)
- Bounce Rate (% + count)
- Unsubscribe Rate (% + count)

**Timeline Chart:**
- Sends per hour/day
- Opens and clicks overlay
- Interactive (hover for details)

**Email Queue Table:**
- Status tabs (pending, processing, sent, failed)
- Recipient, status, sent_at, error message
- Pagination & search
- Retry failed button

**Top Performers:**
- Most opened emails (recipient list)
- Most clicked links (URLs + counts)

---

### 5. Queue Management (`/queue`)

#### Queue Overview
**Status Cards:**
- Pending emails count
- Processing emails count
- Failed emails count (with retry button)
- Estimated completion time

**Account Utilization:**
- List of all active sender accounts
- Each shows: email, processing count, sent today / limit
- Visual indicator (progress bar)

**Queue Table:**
- Campaign name
- Recipient email
- Status (pending, processing, sent, failed)
- Priority (1-10)
- Retry count
- Next retry time (if failed)
- Created at
- Actions: View details, Retry, Delete

**Bulk Actions:**
- Retry all failed
- Clear all failed
- Pause queue
- Resume queue

---

### 6. G Suite Management (`/gsuite`)

#### Domains Tab (`/gsuite/domains`)
**Domains List:**
- Domain name
- Customer ID
- Admin email
- Status (active, suspended)
- User count
- Service account count
- Last sync time
- Actions (view, sync, delete)

**Add Domain Button:**
- Form: domain, customer_id, admin_email, max_users

#### Domain Details (`/gsuite/domains/[id]`)
**Tabs:**

**Tab 1: Overview**
- Domain info
- Status
- User count, max users
- Service accounts count
- Last sync timestamp
- Sync now button

**Tab 2: Service Accounts**
- List service accounts
  - Email, status, last auth success
  - Actions: View, Test, Delete
- Upload new service account JSON button
- Test authentication button (with user to impersonate)

**Tab 3: Users**
- User table:
  - Email, first name, last name
  - Status (pending, creating, active, suspended)
  - Google Created (yes/no badge)
  - Created at
  - Actions: View, Edit, Delete
- Actions:
  - **Generate Users** (count, password) → creates fake users in DB
  - **Bulk Create in Google** → creates users in Google Workspace
  - **Bulk Delete from Google** → deletes users from Google
  - **Sync from Google** → pulls all users from Google to DB
  - **Create Sender Accounts** → creates sender_accounts from active users

**Tab 4: Sender Accounts**
- List all sender accounts created from this domain's users
- Link to sender account details

---

### 7. Analytics & Reporting (`/analytics`)

#### Overview Tab
**Date Range Picker:**
- Last 7 days, Last 30 days, Custom range

**Key Metrics (Cards):**
- Total Sent, Delivered, Bounced
- Open Rate (avg %)
- Click Rate (avg %)
- Bounce Rate (avg %)

**Charts:**
- **Send Volume Over Time**: Line chart
- **Engagement Rates**: Multi-line (opens, clicks)
- **Bounces by Type**: Pie chart (hard, soft, complaint)
- **Top Campaigns**: Bar chart (by sent volume)
- **Top Sender Accounts**: Bar chart (by success rate)

#### Campaign Analytics Tab
- Select campaign from dropdown
- Detailed stats for selected campaign
- Timeline chart (sends, opens, clicks per hour)
- Recipient engagement list
- Link performance table

#### Account Analytics Tab
- Select sender account from dropdown
- Performance metrics (last 30 days)
- Daily send volume chart
- Success/failure rate chart
- Recent send logs

#### Export Options
- Export to CSV (all data)
- Export to PDF (report with charts)

---

### 8. Tracking Events (`/tracking`)

#### Tabs:

**Tab 1: Open Events**
- Table: Email (recipient), campaign, opened_at, IP address, user agent
- Filters: Date range, campaign
- Pagination

**Tab 2: Click Events**
- Table: Email, campaign, URL clicked, clicked_at, IP, user agent
- Filters: Date range, campaign, URL
- Pagination

**Tab 3: Unsubscribes**
- Table: Email, source (link/complaint), unsubscribed_at
- Filters: Date range, source
- Actions: Remove from list (re-subscribe)

**Tab 4: Bounces**
- Table: Email, bounce type (hard/soft/complaint), reason, bounced_at
- Filters: Date range, bounce type
- Actions: Remove from list, view details

---

### 9. Settings (`/settings`)

#### Tabs:

**Tab 1: Account Settings**
- Change username
- Change password
- Email notifications preferences

**Tab 2: System Configuration**
- Default daily limit
- Default send delay
- Max retry attempts
- Bounce rate threshold (auto-pause)
- Error rate threshold

**Tab 3: API Keys**
- Generate API key for external integrations
- List existing API keys
- Revoke API key

**Tab 4: Logs**
- System logs viewer
- Filter by level (info, warn, error)
- Search logs
- Download logs

---

## 🎯 Design System

### Color Palette

**Light Mode:**
- Primary: `#667eea` → `#764ba2` (Purple gradient)
- Success: `#10b981` (Green)
- Warning: `#f59e0b` (Orange)
- Danger: `#ef4444` (Red)
- Info: `#3b82f6` (Blue)
- Background: `#f9fafb` (Light gray)
- Surface: `#ffffff` (White)
- Text Primary: `#111827` (Dark gray)
- Text Secondary: `#6b7280` (Medium gray)

**Dark Mode:**
- Primary: Same gradient
- Success/Warning/Danger: Brighter versions
- Background: `#111827` (Dark blue-gray)
- Surface: `#1f2937` (Lighter dark)
- Text Primary: `#f9fafb` (White)
- Text Secondary: `#9ca3af` (Light gray)

### Typography
- **Font Family**: Inter (sans-serif)
- **Headings**: Font weight 700, tight letter spacing
- **Body**: Font weight 400, comfortable line height (1.6)
- **Code**: JetBrains Mono (monospace)

### Spacing
- Base unit: 4px
- Use Tailwind spacing scale (4, 8, 12, 16, 24, 32, 48, 64px)

### Shadows
- Small: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- Medium: `0 4px 6px -1px rgb(0 0 0 / 0.1)`
- Large: `0 10px 15px -3px rgb(0 0 0 / 0.1)`

### Border Radius
- Small: 4px (buttons, inputs)
- Medium: 8px (cards)
- Large: 12px (modals, panels)

---

## 🚀 API Integration

### Base Configuration

```typescript
// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (add auth token)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor (handle errors)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### API Endpoints Reference

**Authentication:**
- `POST /api/auth/login` - Login and get JWT token

**Sender Accounts:**
- `GET /api/accounts` - List all accounts
- `GET /api/accounts/:id` - Get account details
- `POST /api/accounts` - Create new account
- `PATCH /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Archive account
- `GET /api/accounts/:id/stats` - Get account statistics

**Campaigns:**
- `GET /api/campaigns` - List all campaigns
- `GET /api/campaigns/:id` - Get campaign details
- `POST /api/campaigns` - Create campaign
- `DELETE /api/campaigns/:id` - Cancel campaign

**Queue:**
- `POST /api/queue/enqueue` - Add emails to queue
- `GET /api/queue/status` - Get queue status
- `POST /api/queue/clear-failed` - Clear failed emails
- `POST /api/queue/retry-failed` - Retry failed emails

**Analytics:**
- `GET /api/analytics/overview?days=7` - Get overview stats
- `GET /api/analytics/campaigns/:id` - Campaign analytics
- `GET /api/analytics/accounts/:id` - Account analytics

**G Suite Management:**
- `GET /api/gsuite/domains` - List domains
- `GET /api/gsuite/domains/:id` - Get domain details
- `POST /api/gsuite/domains` - Add domain
- `DELETE /api/gsuite/domains/:id` - Delete domain
- `POST /api/gsuite/domains/:id/service-accounts` - Upload service account JSON
- `GET /api/gsuite/domains/:id/service-accounts` - List service accounts
- `POST /api/gsuite/domains/:id/users/generate` - Generate fake users
- `POST /api/gsuite/domains/:id/users/bulk-create` - Create users in Google
- `DELETE /api/gsuite/domains/:id/users/bulk-delete` - Delete users from Google
- `GET /api/gsuite/domains/:id/users` - List users
- `POST /api/gsuite/domains/:id/sync` - Sync users from Google
- `POST /api/gsuite/domains/:id/create-senders` - Create sender accounts from users
- `POST /api/gsuite/test-auth` - Test service account auth

**Tracking:**
- `GET /track/open/:token` - Track email open (returns pixel)
- `GET /track/click/:token?url=...` - Track click and redirect
- `GET /track/unsubscribe/:token` - Unsubscribe page

---

## 📊 Data Models (TypeScript Interfaces)

```typescript
// types/index.ts

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
}

export interface SenderAccount {
  id: number;
  email: string;
  display_name?: string;
  provider: 'gmail' | 'smtp';
  status: 'active' | 'paused' | 'suspended' | 'warming_up' | 'paused_limit_reached';
  current_daily_limit: number;
  emails_sent_today: number;
  warmup_stage?: number;
  created_at: string;
  last_used_at?: string;
  // Gmail fields
  client_id?: string;
  client_secret?: string;
  refresh_token?: string;
  // SMTP fields
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  smtp_secure?: boolean;
}

export interface Campaign {
  id: number;
  name: string;
  description?: string;
  sponsor_id?: number;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface EmailQueue {
  id: number;
  campaign_id: number;
  recipient_email: string;
  subject: string;
  html_body: string;
  text_body?: string;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  priority: number;
  retry_count: number;
  tracking_token: string;
  custom_data?: Record<string, any>;
  assigned_worker_id?: number;
  next_retry_at?: string;
  last_error?: string;
  created_at: string;
}

export interface SendLog {
  id: number;
  email_queue_id: number;
  sender_account_id: number;
  campaign_id: number;
  status: 'sent' | 'failed';
  response_time_ms: number;
  provider_response?: string;
  error_message?: string;
  created_at: string;
}

export interface GSuiteDomain {
  id: number;
  domain: string;
  customer_id: string;
  admin_email: string;
  status: 'active' | 'suspended' | 'deleted';
  verified: boolean;
  max_users: number;
  created_at: string;
  last_sync_at?: string;
}

export interface GSuiteServiceAccount {
  id: number;
  gsuite_domain_id: number;
  service_account_email: string;
  client_email: string;
  status: 'active' | 'inactive';
  last_auth_success_at?: string;
  created_at: string;
}

export interface GSuiteUser {
  id: number;
  gsuite_domain_id: number;
  email: string;
  user_id?: string;
  given_name: string;
  family_name: string;
  full_name: string;
  status: 'pending' | 'creating' | 'active' | 'suspended' | 'deleted' | 'failed';
  is_admin: boolean;
  google_created_at?: string;
  created_at: string;
}

export interface OpenEvent {
  id: number;
  email_queue_id: number;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface ClickEvent {
  id: number;
  email_queue_id: number;
  url: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface UnsubscribeRecord {
  id: number;
  email: string;
  source: 'link' | 'complaint' | 'manual';
  created_at: string;
}

export interface BounceRecord {
  id: number;
  email: string;
  bounce_type: 'hard' | 'soft' | 'complaint';
  reason?: string;
  created_at: string;
}
```

---

## 🛠️ Implementation Best Practices

### State Management
- Use **React Query** for all server state (caching, refetching, mutations)
- Use **Zustand** for UI state (sidebar open/closed, theme, filters)
- Use **Context API** for auth state

### Forms
- Use **React Hook Form** with Zod validation
- Show validation errors inline
- Disable submit button during submission
- Show success/error toasts after submission

### Tables
- Implement sorting, filtering, pagination
- Use virtualization for large datasets (>1000 rows)
- Sticky headers
- Row selection with checkboxes for bulk actions

### Charts
- Use Recharts with responsive containers
- Show loading skeletons while fetching data
- Add tooltips with detailed info
- Make charts interactive (click to filter)

### Error Handling
- Show user-friendly error messages
- Retry failed requests automatically (with limit)
- Fallback UI for critical errors
- Log errors to console in dev mode

### Performance
- Code splitting (dynamic imports)
- Image optimization (Next.js Image)
- Lazy load heavy components
- Debounce search inputs
- Memoize expensive calculations

### Accessibility
- Semantic HTML
- ARIA labels for screen readers
- Keyboard navigation support
- Focus management in modals
- Color contrast ratios (WCAG AA)

---

## 🎁 Bonus Features (Nice to Have)

1. **Dark Mode Toggle** - Persist user preference
2. **Real-Time Updates** - WebSocket for live queue status
3. **Email Template Library** - Pre-built email templates
4. **CSV Import/Export** - For recipients, sender accounts
5. **Drag & Drop** - For file uploads (CSV, JSON)
6. **Search Everything** - Global search (Cmd+K)
7. **Keyboard Shortcuts** - Power user shortcuts
8. **Multi-Language Support** - i18n with next-intl
9. **Audit Log** - Who did what, when
10. **Notification Center** - In-app notifications for events

---

## 📦 Project Structure

```
frontend/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx           # Shared layout (sidebar, header)
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── accounts/
│   │   │   ├── page.tsx         # List view
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx     # Details view
│   │   │   └── new/
│   │   │       └── page.tsx     # Create form
│   │   ├── campaigns/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   ├── queue/
│   │   │   └── page.tsx
│   │   ├── gsuite/
│   │   │   ├── page.tsx         # Domains list
│   │   │   └── [id]/
│   │   │       └── page.tsx     # Domain details with tabs
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   ├── tracking/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   ├── layout.tsx               # Root layout
│   └── globals.css
├── components/
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── table.tsx
│   │   ├── modal.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   └── ...
│   ├── dashboard/
│   │   ├── stats-card.tsx
│   │   ├── recent-activity.tsx
│   │   └── charts/
│   │       ├── send-volume-chart.tsx
│   │       ├── engagement-chart.tsx
│   │       └── account-health-chart.tsx
│   ├── accounts/
│   │   ├── accounts-table.tsx
│   │   ├── account-form.tsx
│   │   └── account-stats.tsx
│   ├── campaigns/
│   │   ├── campaign-card.tsx
│   │   ├── campaign-form.tsx
│   │   └── campaign-stats.tsx
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── user-menu.tsx
│   └── shared/
│       ├── data-table.tsx       # Reusable table with sorting/filtering
│       ├── page-header.tsx
│       ├── loading-spinner.tsx
│       ├── error-boundary.tsx
│       └── status-badge.tsx
├── lib/
│   ├── api.ts                   # Axios instance with interceptors
│   ├── auth.ts                  # Auth helpers
│   ├── utils.ts                 # Utility functions
│   └── constants.ts             # App constants
├── hooks/
│   ├── use-accounts.ts          # React Query hooks for accounts
│   ├── use-campaigns.ts
│   ├── use-queue.ts
│   ├── use-analytics.ts
│   ├── use-gsuite.ts
│   └── use-auth.ts
├── types/
│   └── index.ts                 # TypeScript interfaces
├── store/
│   ├── auth-store.ts            # Zustand auth store
│   └── ui-store.ts              # Zustand UI store
├── public/
│   ├── logo.svg
│   └── ...
├── .env.local
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 🚦 Development Phases

### Phase 1: Foundation (Week 1)
- [ ] Project setup (Next.js, TypeScript, Tailwind, shadcn/ui)
- [ ] Authentication (login page, auth context, protected routes)
- [ ] Layout components (sidebar, header, navigation)
- [ ] API client setup (axios, interceptors)
- [ ] Basic routing structure

### Phase 2: Core Features (Week 2-3)
- [ ] Dashboard page with stats and charts
- [ ] Sender Accounts CRUD (list, create, edit, delete)
- [ ] Campaigns CRUD
- [ ] Queue management page

### Phase 3: Advanced Features (Week 4)
- [ ] G Suite management (domains, service accounts, users)
- [ ] Analytics & reporting pages
- [ ] Tracking events pages

### Phase 4: Polish (Week 5)
- [ ] Settings page
- [ ] Dark mode implementation
- [ ] Responsive design refinement
- [ ] Performance optimization
- [ ] Error handling improvement

### Phase 5: Testing & Deployment (Week 6)
- [ ] Unit tests (Jest + React Testing Library)
- [ ] E2E tests (Playwright)
- [ ] Build optimization
- [ ] Deployment setup (Vercel/Netlify)
- [ ] Documentation

---

## 🎯 Success Criteria

✅ **Functional:**
- All API endpoints integrated and working
- Real-time data updates with React Query
- Smooth navigation and routing
- Forms with validation and error handling
- Tables with sorting, filtering, pagination

✅ **Performance:**
- Lighthouse score > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- No layout shifts

✅ **UX/UI:**
- Consistent design system
- Responsive on mobile, tablet, desktop
- Intuitive navigation
- Clear feedback for all actions
- Loading states and error messages

✅ **Code Quality:**
- TypeScript strict mode
- ESLint + Prettier configured
- Components under 300 lines
- Reusable components and hooks
- Clear file organization

---

## 🔥 Final Notes

This is an **enterprise-grade application** that handles **millions of emails** and **thousands of sender accounts**. The frontend must be:

1. **Robust**: Handle errors gracefully, never crash
2. **Scalable**: Efficiently display large datasets
3. **User-Friendly**: Intuitive for both technical and non-technical users
4. **Fast**: Optimized for performance
5. **Maintainable**: Clean code, well-documented

**Priority Features (MVP):**
1. Authentication ✅
2. Dashboard with stats ✅
3. Sender Accounts management ✅
4. Campaigns management ✅
5. Queue monitoring ✅

**Phase 2 Features:**
6. G Suite management ✅
7. Analytics & reporting ✅
8. Tracking events ✅

Good luck building the **best email delivery platform frontend**! 🚀
