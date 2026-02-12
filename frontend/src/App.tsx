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
// New pages for iresponse-pro parity
import RolesPage from './pages/RolesPage'
import GoogleAccountsPage from './pages/GoogleAccountsPage'
import HeadersPage from './pages/HeadersPage'
import PlaceholderPage from './pages/PlaceholderPage'
import AutoRespondersPage from './pages/AutoRespondersPage'
import SessionsPage from './pages/SessionsPage'
import UploadImagesPage from './pages/UploadImagesPage'
import SPFCheckerPage from './pages/SPFCheckerPage'
import ReputationPage from './pages/ReputationPage'
import ValueExtractorPage from './pages/ValueExtractorPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'users/add', element: <UsersPage /> },
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
      { path: 'campaign-tests', element: <PlaceholderPage title="Campaign Tests Monitor" description="Monitor test campaigns" /> },
      { path: 'offers', element: <OffersPage /> },
      { path: 'offers/add', element: <OffersPage /> },
      { path: 'tracking-links', element: <TrackingLinksPage /> },
      { path: 'jobs', element: <JobsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      // Data Management
      { path: 'data-providers', element: <DataProvidersPage /> },
      { path: 'data-providers/add', element: <DataProvidersPage /> },
      { path: 'data-lists', element: <DataListsPage /> },
      { path: 'data-lists/fetch', element: <PlaceholderPage title="Fetch Blacklist Emails" description="Fetch blacklist emails from data sources" /> },
      { path: 'verticals', element: <VerticalsPage /> },
      { path: 'verticals/add', element: <VerticalsPage /> },
      { path: 'affiliate-networks', element: <AffiliateNetworksPage /> },
      { path: 'affiliate-networks/add', element: <AffiliateNetworksPage /> },
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
      { path: 'logs/frontend', element: <PlaceholderPage title="Frontend Logs" description="View application frontend logs" /> },
      { path: 'logs/backend', element: <PlaceholderPage title="Backend Logs" description="View application backend logs" /> },
      // Roles & Permissions
      { path: 'roles', element: <RolesPage /> },
      { path: 'roles/add', element: <PlaceholderPage title="Add Role" description="Create a new role with permissions" /> },
      { path: 'roles/assign', element: <PlaceholderPage title="Assign Roles" description="Assign roles to users" /> },
      { path: 'roles/users', element: <PlaceholderPage title="Users by Role" description="View users grouped by role" /> },
      // Teams
      { path: 'teams', element: <PlaceholderPage title="Teams" description="Manage teams" /> },
      { path: 'teams/add', element: <PlaceholderPage title="Add Team" description="Create a new team" /> },
      { path: 'teams/authorizations', element: <PlaceholderPage title="Team Authorizations" description="Manage team resource authorizations" /> },
      { path: 'teams/users', element: <PlaceholderPage title="Assign Users to Teams" description="Assign users to teams" /> },
      // Headers
      { path: 'headers', element: <HeadersPage /> },
      { path: 'headers/add', element: <PlaceholderPage title="Add Header" description="Create a new predefined header" /> },
      // Auto-Responders
      { path: 'auto-responders', element: <AutoRespondersPage /> },
      { path: 'auto-responders/create', element: <AutoRespondersPage /> },
      // Google Accounts
      { path: 'google-accounts', element: <GoogleAccountsPage /> },
      // Sessions
      { path: 'sessions', element: <SessionsPage /> },
      // Revenue Report
      { path: 'revenue-report', element: <PlaceholderPage title="Revenue Report" description="View revenue analytics and statistics" /> },
      // Upload Images
      { path: 'upload-images', element: <UploadImagesPage /> },
      // Tools
      { path: 'tools/spf-lookup', element: <SPFCheckerPage /> },
      { path: 'tools/reputation', element: <ReputationPage /> },
      { path: 'tools/mailbox-extractor', element: <PlaceholderPage title="Mailbox Extractor" description="Extract email addresses from mailboxes" /> },
      { path: 'tools/extractor', element: <ValueExtractorPage /> },
    ],
  },
])
