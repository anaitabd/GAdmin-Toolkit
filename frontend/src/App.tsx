import { createBrowserRouter } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import UsersPage from './pages/UsersPage'
import NamesPage from './pages/NamesPage'
import EmailDataPage from './pages/EmailDataPage'
import EmailInfoPage from './pages/EmailInfoPage'
import EmailTemplatesPage from './pages/EmailTemplatesPage'
import CredentialsPage from './pages/CredentialsPage'
import EmailLogsPage from './pages/EmailLogsPage'
import BounceLogsPage from './pages/BounceLogsPage'
import ActionsPage from './pages/ActionsPage'
import JobsPage from './pages/JobsPage'
import SettingsPage from './pages/SettingsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'names', element: <NamesPage /> },
      { path: 'email-data', element: <EmailDataPage /> },
      { path: 'email-info', element: <EmailInfoPage /> },
      { path: 'email-templates', element: <EmailTemplatesPage /> },
      { path: 'credentials', element: <CredentialsPage /> },
      { path: 'email-logs', element: <EmailLogsPage /> },
      { path: 'bounce-logs', element: <BounceLogsPage /> },
      { path: 'actions', element: <ActionsPage /> },
      { path: 'jobs', element: <JobsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])
