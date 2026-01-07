# GAdmin Toolkit - React Frontend

A modern, professional React frontend for the GAdmin Toolkit API backend.

## Features

- ✅ **Admin Authentication** - Secure JWT-based login system
- ✅ **User Management** - Generate, create, and manage Google Workspace users
- ✅ **Email Operations** - Send emails via Gmail API or SMTP
- ✅ **Email Tracking** - View email logs and bounced emails
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile devices
- ✅ **Modern UI** - Clean, intuitive interface with smooth interactions

## Tech Stack

- **React 19** - Latest React with hooks
- **Vite** - Lightning-fast build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client with interceptors
- **CSS3** - Modern styling with gradients and animations

## Prerequisites

- Node.js (v14 or higher)
- Backend API running on `http://localhost:3000`

## Setup

### 1. Install Dependencies

```bash
cd main/frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist` directory.

To preview the production build:

```bash
npm run preview
```

## Default Credentials

```
Username: admin
Password: YourSecurePassword123!
```

Make sure to change the default password after first login!

## Available Pages

### Dashboard
- Statistics overview (users, emails sent, bounced emails)
- Quick action cards for common tasks

### Users Management
- Generate new user data
- View generated users with pagination
- Create users in Google Workspace
- Delete all users (except admin)

### Email Management
- **Send Email Tab**: Compose and send emails via Gmail API or SMTP
- **Email Logs Tab**: View all sent emails with status
- **Bounced Emails Tab**: Track failed email deliveries

## License

MIT License - See LICENSE file for details
