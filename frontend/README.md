# GAdmin Toolkit - Next.js 14 Frontend

Production-grade email campaign management dashboard built with Next.js 14, TypeScript, Material-UI, and modern React patterns.

## 🚀 Tech Stack

- **Next.js 14** - App Router with TypeScript strict mode
- **Material-UI v7** - Component library with Emotion styling
- **Zustand** - Lightweight state management with localStorage persistence
- **React Query v5** - Server state management and caching
- **React Hook Form + Zod** - Type-safe form validation
- **Axios** - HTTP client with interceptors
- **Notistack** - Toast notifications
- **TanStack Table v8** - Powerful data tables (coming soon)
- **Recharts** - Data visualization (coming soon)
- **PapaParse** - CSV parsing (coming soon)
- **Date-fns** - Date utilities

## 🛠️ Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running at `http://localhost:3000`

### Installation

```bash
# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > .env.local

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The application will be available at `http://localhost:3001`

## 🔐 Authentication

Default credentials (for testing):
- Username: `admin`
- Password: `admin123`

The app uses JWT tokens stored in localStorage via Zustand with persistence.

## 🎨 Features

### ✅ Implemented

- **Login System**
  - Form validation with React Hook Form + Zod
  - JWT token management
  - Persistent auth state
  - Auto-redirect on auth status

- **Dashboard Layout**
  - Fixed sidebar (260px) with navigation
  - Responsive mobile drawer
  - User menu with logout
  - Page title in header
  - Material-UI theming

- **Dashboard Overview**
  - KPI cards (Sent, Delivery Rate, Open Rate, Click Rate)
  - Real-time polling (10s intervals)
  - Loading skeletons

- **Navigation Pages**
  - Sender Accounts
  - Campaigns
  - Email Queue
  - Analytics
  - G Suite Domains
  - G Suite Users

### 🚧 Coming Soon

- TanStack Table implementation
- Data visualization with Recharts
- CSV file upload
- Multi-step forms
- Complex modals (account details, bulk operations)
- Progress tracking for async operations
- Real-time status updates

## 📡 API Integration

All API endpoints are configured in `/lib/api/`:

- `POST /api/auth/login` - Authentication
- `GET /api/accounts` - List sender accounts
- `GET /api/campaigns` - List campaigns
- `GET /api/queue/status` - Queue status
- `GET /api/analytics/overview` - Analytics data
- `GET /api/gsuite/domains` - G Suite domains
- `GET /api/gsuite/domains/:id/users` - Domain users

All requests automatically include the JWT token from the auth store.

## 🎯 Code Quality

- **TypeScript strict mode** - No `any` types
- **ESLint** - Code linting
- **Component patterns** - Reusable, composable components
- **Error handling** - Toast notifications for all errors
- **Loading states** - Skeletons for async operations

## 🚀 Build & Deploy

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Lint
npm run lint
```

## 📝 Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 📦 Project Structure

```
src/
├── app/
│   ├── (auth)/login/              # Authentication
│   ├── dashboard/                 # Main dashboard
│   │   ├── layout.tsx             # Sidebar + header
│   │   ├── page.tsx               # Dashboard home
│   │   ├── accounts/              # Sender accounts
│   │   ├── campaigns/             # Email campaigns
│   │   ├── queue/                 # Email queue
│   │   ├── analytics/             # Analytics
│   │   └── gsuite/               # G Suite management
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Root redirect
│   └── providers.tsx              # React Query, MUI, Notistack
├── components/common/             # Reusable components
├── lib/
│   ├── api/                       # API clients
│   ├── hooks/                     # Custom hooks
│   ├── stores/                    # Zustand stores
│   ├── schemas/                   # Zod schemas
│   └── utils/                     # Utilities
├── types/                         # TypeScript types
└── theme/                         # MUI theme
```

## 📄 License

MIT
