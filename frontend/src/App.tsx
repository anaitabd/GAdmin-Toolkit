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
import TrackingLinksPage from './pages/TrackingLinksPage'
import CampaignPage from './pages/CampaignPage'
import OffersPage from './pages/OffersPage'
import DataProvidersPage from './pages/DataProvidersPage'
import DataListsPage from './pages/DataListsPage'
import VerticalsPage from './pages/VerticalsPage'
import AffiliateNetworksPage from './pages/AffiliateNetworksPage'
import BlacklistsPage from './pages/BlacklistsPage'
import CreativesPage from './pages/CreativesPage'
import OfferLinksPage from './pages/OfferLinksPage'
import FromNamesPage from './pages/FromNamesPage'
import SubjectsPage from './pages/SubjectsPage'
import SuppressionsPage from './pages/SuppressionsPage'
import LeadsPage from './pages/LeadsPage'
import AuditLogsPage from './pages/AuditLogsPage'
import CampaignSend from './pages/CampaignSend'
import CampaignMonitor from './pages/CampaignMonitor'

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
      { path: 'campaign', element: <CampaignPage /> },
      { path: 'campaign-send', element: <CampaignSend /> },
      { path: 'campaign-monitor/:id', element: <CampaignMonitor /> },
      { path: 'offers', element: <OffersPage /> },
      { path: 'tracking-links', element: <TrackingLinksPage /> },
      { path: 'jobs', element: <JobsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      // Data Management
      { path: 'data-providers', element: <DataProvidersPage /> },
      { path: 'data-lists', element: <DataListsPage /> },
      { path: 'verticals', element: <VerticalsPage /> },
      { path: 'affiliate-networks', element: <AffiliateNetworksPage /> },
      { path: 'blacklists', element: <BlacklistsPage /> },
      // Offer Management
      { path: 'creatives', element: <CreativesPage /> },
      { path: 'offer-links', element: <OfferLinksPage /> },
      { path: 'from-names', element: <FromNamesPage /> },
      { path: 'subjects', element: <SubjectsPage /> },
      { path: 'suppressions', element: <SuppressionsPage /> },
      { path: 'leads', element: <LeadsPage /> },
      // Logs
      { path: 'audit-logs', element: <AuditLogsPage /> },
    ],
  },
])
