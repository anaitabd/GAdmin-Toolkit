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
import TeamsPage from './pages/TeamsPage'
import TeamAuthorizationsPage from './pages/TeamAuthorizationsPage'
import TeamUsersPage from './pages/TeamUsersPage'
import AssignRolesPage from './pages/AssignRolesPage'
import UsersByRolePage from './pages/UsersByRolePage'
import FrontendLogsPage from './pages/FrontendLogsPage'
import BackendLogsPage from './pages/BackendLogsPage'
import AutoRespondersPage from './pages/AutoRespondersPage'
import SessionsPage from './pages/SessionsPage'
import RevenueReportPage from './pages/RevenueReportPage'
import UploadImagesPage from './pages/UploadImagesPage'
import SPFCheckerPage from './pages/SPFCheckerPage'
import ReputationPage from './pages/ReputationPage'
import MailboxExtractorPage from './pages/MailboxExtractorPage'
import ValueExtractorPage from './pages/ValueExtractorPage'
import CampaignTestsPage from './pages/CampaignTestsPage'
import FetchBlacklistPage from './pages/FetchBlacklistPage'

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
      { path: 'campaign-tests', element: <CampaignTestsPage /> },
      { path: 'offers', element: <OffersPage /> },
      { path: 'offers/add', element: <OffersPage /> },
      { path: 'tracking-links', element: <TrackingLinksPage /> },
      { path: 'jobs', element: <JobsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      // Data Management
      { path: 'data-providers', element: <DataProvidersPage /> },
      { path: 'data-providers/add', element: <DataProvidersPage /> },
      { path: 'data-lists', element: <DataListsPage /> },
      { path: 'data-lists/fetch', element: <FetchBlacklistPage /> },
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
      { path: 'logs/frontend', element: <FrontendLogsPage /> },
      { path: 'logs/backend', element: <BackendLogsPage /> },
      // Roles & Permissions
      { path: 'roles', element: <RolesPage /> },
      { path: 'roles/add', element: <RolesPage /> },
      { path: 'roles/assign', element: <AssignRolesPage /> },
      { path: 'roles/users', element: <UsersByRolePage /> },
      // Teams
      { path: 'teams', element: <TeamsPage /> },
      { path: 'teams/add', element: <TeamsPage /> },
      { path: 'teams/authorizations', element: <TeamAuthorizationsPage /> },
      { path: 'teams/users', element: <TeamUsersPage /> },
      // Headers
      { path: 'headers', element: <HeadersPage /> },
      { path: 'headers/add', element: <HeadersPage /> },
      // Auto-Responders
      { path: 'auto-responders', element: <AutoRespondersPage /> },
      { path: 'auto-responders/create', element: <AutoRespondersPage /> },
      // Google Accounts
      { path: 'google-accounts', element: <GoogleAccountsPage /> },
      // Sessions
      { path: 'sessions', element: <SessionsPage /> },
      // Revenue Report
      { path: 'revenue-report', element: <RevenueReportPage /> },
      // Upload Images
      { path: 'upload-images', element: <UploadImagesPage /> },
      // Tools
      { path: 'tools/spf-lookup', element: <SPFCheckerPage /> },
      { path: 'tools/reputation', element: <ReputationPage /> },
      { path: 'tools/mailbox-extractor', element: <MailboxExtractorPage /> },
      { path: 'tools/extractor', element: <ValueExtractorPage /> },
    ],
  },
])
