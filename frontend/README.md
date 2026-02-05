# GAdmin Toolkit Frontend

A modern, production-ready Next.js 16 frontend with shadcn/ui + TailwindCSS for email campaign management.

## 🚀 Features

- **10+ Pages**: Login, Dashboard, Accounts, Campaigns (list/create/details), Queue, Analytics, Tracking, Settings, G Suite
- **25+ Components**: All shadcn/ui components with custom additions
- **Dark Mode**: System preference detection with manual toggle
- **Real-time Updates**: Auto-refresh with React Query polling
- **Form Validation**: Zod schemas on all forms
- **Charts**: Interactive Recharts visualizations
- **Responsive**: Mobile, tablet, desktop optimized
- **TypeScript**: Full type safety throughout

## 🛠 Tech Stack

- Next.js 16.1.6 (App Router)
- TypeScript
- TailwindCSS 3
- shadcn/ui (Radix UI)
- React Query (TanStack)
- Recharts
- Lucide React Icons
- Sonner (Toasts)
- next-themes (Dark Mode)

## 📦 Installation

```bash
npm install
```

## 🏃 Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Default Login:**
- Username: `admin`
- Password: `admin123`

## 🏗 Build

```bash
npm run build
npm start
```

## 📁 Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # Reusable components
│   ├── ui/          # shadcn/ui components
│   ├── layout/      # Sidebar, Header
│   ├── accounts/    # Account-specific components
│   └── common/      # Shared components
├── lib/             # Utilities and helpers
│   ├── api/         # API client functions
│   ├── hooks/       # Custom React hooks
│   ├── schemas/     # Zod validation schemas
│   ├── stores/      # Zustand stores
│   └── utils/       # Helper functions
└── types/           # TypeScript type definitions
```

## 🎯 Pages

1. **Login** (`/login`) - Authentication with validation
2. **Dashboard** (`/dashboard`) - Overview with real-time stats
3. **Accounts** (`/dashboard/accounts`) - Sender account management
4. **Campaigns** (`/dashboard/campaigns`) - Campaign list view
5. **New Campaign** (`/dashboard/campaigns/new`) - 6-step wizard
6. **Campaign Details** (`/dashboard/campaigns/[id]`) - Analytics & monitoring
7. **Queue** (`/dashboard/queue`) - Email queue status
8. **Analytics** (`/dashboard/analytics`) - Performance metrics
9. **Tracking** (`/dashboard/tracking`) - Event log
10. **Settings** (`/dashboard/settings`) - System configuration
11. **G Suite Domains** (`/dashboard/gsuite/domains`) - Domain management
12. **G Suite Users** (`/dashboard/gsuite/users`) - User management

## 🔌 API Integration

Configure your backend API URL in `src/lib/api/client.ts`:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
```

## 📝 Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## ✅ Status

**Production Ready** - All features implemented and tested.

See `FRONTEND_IMPLEMENTATION_SUMMARY.md` for detailed information.
