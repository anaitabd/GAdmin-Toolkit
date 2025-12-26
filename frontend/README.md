# Frontend - Google Workspace Automation Toolkit

Modern React-based web dashboard for managing Google Workspace users with a beautiful UI, dark mode, and real-time updates.

## 🎨 Features

- ✅ **Modern UI** - Built with React + Vite + Tailwind CSS
- ✅ **Dark Mode** - Toggle between light and dark themes
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **Real-time Updates** - Live dashboard statistics
- ✅ **Data Visualization** - Charts and graphs using Recharts
- ✅ **User Management** - Create, delete, and manage users
- ✅ **CSV Import** - Bulk user operations via CSV upload
- ✅ **Search & Filter** - Quick user lookup
- ✅ **Toast Notifications** - User-friendly feedback messages
- ✅ **State Management** - Zustand for lightweight state management

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   └── Layout.jsx
│   ├── pages/            # Page components
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   └── UserManagementPage.jsx
│   ├── services/         # API services
│   │   └── api.js
│   ├── context/          # State management
│   │   └── authStore.js
│   ├── utils/            # Helper functions
│   ├── assets/           # Static assets
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Public assets
├── index.html
├── vite.config.js
├── tailwind.config.js
├── Dockerfile
├── nginx.conf
├── package.json
└── README.md
```

## 📋 Prerequisites

- Node.js 18+ or Docker
- Backend API running on http://localhost:5000

## 🚀 Installation

### Local Development

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment (optional):**
   ```bash
   # Create .env file
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   The app will be available at http://localhost:3000

### Production Build

```bash
npm run build
npm run preview
```

### Docker Deployment

```bash
docker build -t gadmin-toolkit-frontend .
docker run -p 80:80 gadmin-toolkit-frontend
```

## 🎯 Available Pages

### Login Page (`/login`)
- Secure authentication
- JWT token-based login
- Remember me functionality
- Default credentials displayed

### Dashboard (`/dashboard`)
- Statistics overview
- User activity charts
- Quick actions
- Recent users table

### User Management (`/users`)
- List all users
- Search and filter
- Create single user
- Generate bulk users
- Import CSV
- Delete users
- Delete all users (with confirmation)

### Settings (`/settings`)
- Coming soon...

## 🎨 UI Components

### Custom Tailwind Components

The app uses custom Tailwind CSS components defined in `index.css`:

```jsx
// Button variants
<button className="btn btn-primary">Primary</button>
<button className="btn btn-secondary">Secondary</button>
<button className="btn btn-danger">Danger</button>

// Card component
<div className="card">
  {/* Content */}
</div>

// Input field
<input className="input" />

// Label
<label className="label">Label Text</label>
```

## 🔐 Authentication

The app uses JWT tokens stored in localStorage. The auth flow:

1. User logs in with username/password
2. Backend returns JWT token
3. Token stored in localStorage
4. Token sent with every API request
5. Automatic redirect if token expires

## 📡 API Integration

All API calls are centralized in `src/services/api.js`:

```javascript
import { authAPI, usersAPI } from './services/api';

// Login
const result = await authAPI.login({ username, password });

// List users
const response = await usersAPI.listUsers();

// Create user
await usersAPI.createSingleUser(userData);

// Delete user
await usersAPI.deleteUser(userKey);
```

## 🎨 Styling Guide

### Color Palette

- **Primary:** Blue (`#0ea5e9`)
- **Success:** Green (`#10b981`)
- **Danger:** Red (`#ef4444`)
- **Warning:** Orange (`#f59e0b`)

### Dark Mode

Dark mode is toggled via the moon/sun icon in the header. The preference is saved to localStorage and persists across sessions.

## 🧪 Development

### Hot Module Replacement

Vite provides instant HMR for a smooth development experience:

```bash
npm run dev
```

### Linting

```bash
npm run lint
```

### Build

```bash
npm run build
```

## 🐛 Troubleshooting

**Issue:** "Cannot connect to API"
- Ensure backend is running on port 5000
- Check CORS configuration
- Verify API_URL in environment

**Issue:** "Login not working"
- Check network tab for API errors
- Verify credentials
- Clear localStorage and try again

**Issue:** "Dark mode not persisting"
- Check localStorage in browser DevTools
- Clear cache and reload

## 📦 Dependencies

### Core
- **React 18** - UI library
- **React Router DOM** - Routing
- **Vite** - Build tool

### UI & Styling
- **Tailwind CSS** - Utility-first CSS
- **Lucide React** - Icon library
- **React Hot Toast** - Toast notifications
- **Recharts** - Charts and graphs

### State & Data
- **Zustand** - State management
- **Axios** - HTTP client

## 🚀 Deployment

### Nginx Configuration

The included `nginx.conf` handles:
- SPA routing (redirects to index.html)
- API proxy to backend
- Static asset serving

### Environment Variables

For production, set:
```bash
VITE_API_URL=https://your-api-domain.com/api
```

## 📱 Responsive Design

The app is fully responsive with breakpoints:
- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

## 🤝 Contributing

When contributing to the frontend:
1. Follow existing code style
2. Use functional components with hooks
3. Maintain responsive design
4. Test on multiple screen sizes
5. Ensure dark mode compatibility

## 📄 License

MIT License - See LICENSE file for details
