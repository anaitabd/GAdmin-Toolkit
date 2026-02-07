import { Link } from 'react-router-dom'
import {
  UsersIcon, PaperAirplaneIcon, ExclamationCircleIcon, ExclamationTriangleIcon,
  CheckCircleIcon, XCircleIcon,
} from '@heroicons/react/24/outline'
import StatCard from '../components/ui/StatCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useUsers } from '../hooks/useUsers'
import { useNames } from '../hooks/useNames'
import { useEmailData } from '../hooks/useEmailData'
import { useEmailInfo } from '../hooks/useEmailInfo'
import { useEmailTemplates } from '../hooks/useEmailTemplates'
import { useCredentials } from '../hooks/useCredentials'
import { useEmailLogStats } from '../hooks/useEmailLogs'
import { useBounceLogStats } from '../hooks/useBounceLogs'

function SetupItem({ ok, label, link }: { ok: boolean; label: string; link: string }) {
  return (
    <Link to={link} className="flex items-center gap-2 py-1.5 text-sm hover:text-indigo-600 transition-colors">
      {ok
        ? <CheckCircleIcon className="h-5 w-5 text-green-500 shrink-0" />
        : <XCircleIcon className="h-5 w-5 text-gray-300 shrink-0" />}
      <span className={ok ? 'text-gray-700' : 'text-gray-500 font-medium'}>{label}</span>
    </Link>
  )
}

export default function Dashboard() {
  const { data: usersData, isLoading: usersLoading } = useUsers({ limit: 1 })
  const { data: namesData, isLoading: namesLoading } = useNames({ limit: 1 })
  const { data: emailDataRes, isLoading: edLoading } = useEmailData({ limit: 1 })
  const { data: emailInfoRes, isLoading: eiLoading } = useEmailInfo()
  const { data: templatesRes, isLoading: tmplLoading } = useEmailTemplates()
  const { data: credsRes, isLoading: credsLoading } = useCredentials()
  const { data: emailStats, isLoading: emailLoading } = useEmailLogStats()
  const { data: bounceStats, isLoading: bounceLoading } = useBounceLogStats()

  const loading = usersLoading || namesLoading || edLoading || eiLoading || tmplLoading || credsLoading || emailLoading || bounceLoading
  if (loading) return <LoadingSpinner />

  const hasUsers = (usersData?.count ?? 0) > 0
  const hasNames = (namesData?.count ?? 0) > 0
  const hasRecipients = (emailDataRes?.count ?? 0) > 0
  const hasEmailInfo = (emailInfoRes?.data?.length ?? 0) > 0
  const hasTemplate = (templatesRes?.data?.length ?? 0) > 0
  const hasCreds = (credsRes?.data?.length ?? 0) > 0
  const allReady = hasUsers && hasRecipients && hasEmailInfo && hasTemplate

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Users" value={usersData?.count ?? 0} icon={UsersIcon} color="text-indigo-600" />
        <StatCard title="Emails Sent" value={Number(emailStats?.data?.successful_emails ?? 0)} icon={PaperAirplaneIcon} color="text-green-600" />
        <StatCard title="Failed Emails" value={Number(emailStats?.data?.failed_emails ?? 0)} icon={ExclamationCircleIcon} color="text-red-600" />
        <StatCard title="Bounced Emails" value={Number(bounceStats?.data?.total_bounces ?? 0)} icon={ExclamationTriangleIcon} color="text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Setup Checklist */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Setup Checklist</h2>
          <div className="space-y-0.5">
            <SetupItem ok={hasNames} label={`Names — ${namesData?.count ?? 0} loaded`} link="/names" />
            <SetupItem ok={hasUsers} label={`Users — ${usersData?.count ?? 0} accounts`} link="/users" />
            <SetupItem ok={hasRecipients} label={`Recipients — ${emailDataRes?.count ?? 0} emails`} link="/email-data" />
            <SetupItem ok={hasEmailInfo} label="Email Info — from name & subject" link="/email-info" />
            <SetupItem ok={hasTemplate} label="Email Template — HTML content" link="/email-templates" />
            <SetupItem ok={hasCreds} label="Google Credentials — service account" link="/credentials" />
          </div>
          {allReady && (
            <Link to="/actions" className="mt-4 inline-block rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
              Go to Actions
            </Link>
          )}
        </div>

        {/* Quick Guide */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Workflow</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li><strong>Import Names</strong> — Upload CSV with given_name, family_name</li>
            <li><strong>Generate Users</strong> — Actions: creates email accounts from names</li>
            <li><strong>Add Recipients</strong> — Import target email addresses</li>
            <li><strong>Configure Email</strong> — Set from name, subject, and HTML template</li>
            <li><strong>Upload Credentials</strong> — Google service account JSON</li>
            <li><strong>Create Google Users</strong> — Actions: creates in Google Workspace</li>
            <li><strong>Send Emails</strong> — Actions: send via Gmail API or SMTP</li>
            <li><strong>Detect Bounces</strong> — Actions: scan for bounced emails</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
