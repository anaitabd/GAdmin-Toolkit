import { useState, useMemo } from 'react'
import { useSendCampaign, useJobs, useCancelJob, usePauseJob, useResumeJob, useMultiJobStream, useSendTestEmail, useDeleteJob, useCampaignStats } from '../hooks/useJobs'
import { useUsers } from '../hooks/useUsers'
import { useCredentials } from '../hooks/useCredentials'
import { useEmailData, useEmailDataGeos, useEmailDataListNames } from '../hooks/useEmailData'
import { useEmailInfo } from '../hooks/useEmailInfo'
import { useEmailTemplates } from '../hooks/useEmailTemplates'
import type { Job, User, EmailData } from '../api/types'

function extractErrorMessage(err: unknown): string {
  const axiosErr = err as { response?: { data?: { error?: string } } }
  return axiosErr?.response?.data?.error || (err instanceof Error ? err.message : 'Operation failed')
}

function filterRecipientsByRange(list: EmailData[], fromIdx: string, toIdx: string): EmailData[] {
  const from = Number.parseInt(fromIdx, 10)
  const to = Number.parseInt(toIdx, 10)
  if (from > 0 && to > 0 && to >= from) {
    return list.slice(from - 1, to)
  }
  return list
}

function filterUsersByDomain(users: User[], domain: string | null | undefined): User[] {
  if (!domain) return users
  const d = domain.toLowerCase()
  return users.filter(u => u.email.toLowerCase().endsWith(`@${d}`))
}

function SectionCard({ title, icon, children, actions }: Readonly<{ title: string; icon: string; children: React.ReactNode; actions?: React.ReactNode }>) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>{icon}</span> {title}
        </h2>
        {actions}
      </div>
      {children}
    </div>
  )
}

interface SelectableUsersListProps {
  readonly users: User[]
  readonly selectedIds: Set<number>
  readonly onToggle: (id: number) => void
  readonly onSelectAll: () => void
  readonly onDeselectAll: () => void
  readonly domain?: string | null
}

function SelectableUsersList({ users, selectedIds, onToggle, onSelectAll, onDeselectAll, domain }: SelectableUsersListProps) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    if (!search.trim()) return users
    const q = search.toLowerCase()
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.given_name ?? '').toLowerCase().includes(q) ||
        (u.family_name ?? '').toLowerCase().includes(q),
    )
  }, [users, search])

  return (
    <SectionCard
      title={`Sender Users (${selectedIds.size} / ${users.length})`}
      icon="👤"
      actions={
        <div className="flex gap-2">
          <button onClick={onSelectAll} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">All</button>
          <button onClick={onDeselectAll} className="text-xs text-red-600 hover:text-red-800 font-medium">None</button>
        </div>
      }
    >
      {domain && (
        <p className="text-xs text-indigo-600 bg-indigo-50 rounded-lg px-2 py-1 mb-2 inline-block">
          Domain: @{domain}
        </p>
      )}
      {users.length === 0 ? (
        <p className="text-sm text-amber-600">No users found{domain ? ` for @${domain}` : ''}. Add users first.</p>
      ) : (
        <div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            title="Search sender users"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-2 focus:border-indigo-500 focus:ring-indigo-500"
          />
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filtered.map((u) => (
              <label key={u.id} className="flex items-center gap-2 text-xs bg-gray-50 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-gray-100">
                <input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => onToggle(u.id)}
                  className="rounded text-indigo-600 focus:ring-indigo-500" />
                <span className="font-medium text-gray-800 truncate">{u.email}</span>
                <span className="text-gray-500 ml-auto shrink-0">
                  {u.given_name} {u.family_name}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  )
}

function RecipientsList({ recipients, label }: Readonly<{ recipients: EmailData[]; label?: string }>) {
  const [show, setShow] = useState(false)
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    if (!search.trim()) return recipients
    const q = search.toLowerCase()
    return recipients.filter((r) => r.to_email.toLowerCase().includes(q) || (r.geo ?? '').toLowerCase().includes(q) || (r.list_name ?? '').toLowerCase().includes(q))
  }, [recipients, search])

  return (
    <SectionCard
      title={label ?? `Recipients (${recipients.length})`}
      icon="📧"
      actions={
        <button onClick={() => setShow(!show)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
          {show ? 'Hide' : 'Show'}
        </button>
      }
    >
      {recipients.length === 0 ? (
        <p className="text-sm text-amber-600">No recipients found. Add email data first.</p>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-2">{recipients.length} recipient{recipients.length === 1 ? '' : 's'} will receive emails</p>
          {show && (
            <div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search recipients..."
                title="Search recipients"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-2 focus:border-indigo-500 focus:ring-indigo-500"
              />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filtered.slice(0, 50).map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-1.5">
                    <span className="text-gray-800 truncate">{r.to_email}</span>
                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                      {r.list_name && <span className="text-indigo-600 bg-indigo-50 rounded px-1.5 py-0.5">{r.list_name}</span>}
                      {r.geo && <span className="text-gray-500 bg-gray-200 rounded px-1.5 py-0.5">{r.geo}</span>}
                    </div>
                  </div>
                ))}
                {filtered.length > 50 && (
                  <p className="text-xs text-gray-400 text-center py-1">
                    +{filtered.length - 50} more...
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </SectionCard>
  )
}

interface CampaignStatsProps {
  sent: number
  failed: number
  clicks: number
  ctr: number
}

function CampaignStats({ sent, failed, clicks, ctr }: Readonly<CampaignStatsProps>) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <div className="rounded-lg border border-green-200 bg-green-50 p-2.5 text-center">
        <p className="text-lg font-bold text-green-700">{sent}</p>
        <p className="text-xs text-green-600">Sent</p>
      </div>
      <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-center">
        <p className="text-lg font-bold text-red-700">{failed}</p>
        <p className="text-xs text-red-600">Failed</p>
      </div>
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-2.5 text-center">
        <p className="text-lg font-bold text-blue-700">{clicks}</p>
        <p className="text-xs text-blue-600">Clicks</p>
      </div>
      <div className="rounded-lg border border-purple-200 bg-purple-50 p-2.5 text-center">
        <p className="text-lg font-bold text-purple-700">{ctr}%</p>
        <p className="text-xs text-purple-600">CTR</p>
      </div>
    </div>
  )
}

function statusColor(status: string) {
  switch (status) {
    case 'running': return 'bg-indigo-100 text-indigo-700'
    case 'paused': return 'bg-amber-100 text-amber-700'
    case 'completed': return 'bg-green-100 text-green-700'
    case 'failed': return 'bg-red-100 text-red-700'
    case 'cancelled': return 'bg-gray-100 text-gray-600'
    default: return 'bg-blue-100 text-blue-700'
  }
}

function progressBarColor(status: string) {
  if (status === 'failed') return 'bg-red-500'
  if (status === 'completed') return 'bg-green-500'
  if (status === 'cancelled') return 'bg-gray-400'
  if (status === 'paused') return 'bg-amber-500'
  return 'bg-indigo-600'
}

interface CampaignCardProps {
  job: Job
  onPause: (id: number) => void
  onResume: (id: number) => void
  onCancel: (id: number) => void
  onResend: (job: Job) => void
  isPausePending: boolean
  isResumePending: boolean
  isCancelPending: boolean
}

function CampaignCard({ job, onPause, onResume, onCancel, onResend, isPausePending, isResumePending, isCancelPending }: Readonly<CampaignCardProps>) {
  const [expanded, setExpanded] = useState(false)
  const params = job.params
  const geo = params?.geo as string | null
  const fromIdx = params?.recipient_offset as number | null
  const toIdx = params?.recipient_limit as number | null
  const totalRecipients = params?.totalRecipients as number | null
  const totalUsers = params?.totalUsers as number | null

  // Fetch real campaign stats (sent/failed/clicks/CTR)
  const { data: statsRes } = useCampaignStats(job.processed_items > 0 ? job.id : undefined)

  const isFinished = ['completed', 'failed', 'cancelled'].includes(job.status)
  const isActive = ['running', 'paused', 'pending'].includes(job.status)

  function rangeLabel() {
    if (fromIdx && toIdx) return `${fromIdx} → ${toIdx}`
    if (geo) return geo
    return 'All'
  }

  return (
    <div className={`rounded-xl border bg-white shadow-sm transition-all ${
      job.status === 'running' ? 'border-indigo-300 ring-1 ring-indigo-100' :
      job.status === 'paused' ? 'border-amber-300 ring-1 ring-amber-100' :
      'border-gray-200'
    }`}>
      {/* Compact header — always visible */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600 transition-transform" title="Toggle details">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-gray-900">#{job.id}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(job.status)}`}>
              {job.status}
            </span>
            <span className="text-xs text-gray-400 hidden sm:inline">
              {(params?.provider as string) === 'gmail_api' ? 'Gmail API' : 'SMTP'}
              {' · '}{totalRecipients ?? 0} recipients
            </span>
          </div>
          <div className="flex gap-1.5">
            {job.status === 'running' && (
              <button onClick={() => onPause(job.id)} disabled={isPausePending}
                className="rounded-lg px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 disabled:opacity-50" title="Pause">
                ⏸ Pause
              </button>
            )}
            {job.status === 'paused' && (
              <button onClick={() => onResume(job.id)} disabled={isResumePending}
                className="rounded-lg px-2.5 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 disabled:opacity-50" title="Resume">
                ▶ Resume
              </button>
            )}
            {isActive && (
              <button onClick={() => onCancel(job.id)} disabled={isCancelPending}
                className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 disabled:opacity-50" title="Kill">
                ✕ Kill
              </button>
            )}
            {isFinished && (
              <button onClick={() => onResend(job)} 
                className="rounded-lg px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200" title="Resend with same settings">
                ↻ Resend
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
          <div className={`${progressBarColor(job.status)} h-2 rounded-full transition-all duration-300`} style={{ width: `${job.progress}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{job.processed_items} / {job.total_items}</span>
          <span>{job.progress}%</span>
        </div>

        {/* Real stats row — always visible if data exists */}
        {job.processed_items > 0 && statsRes?.data && (
          <div className="mt-3">
            <CampaignStats
              sent={statsRes.data.sent}
              failed={statsRes.data.failed}
              clicks={statsRes.data.total_clicks}
              ctr={statsRes.data.ctr}
            />
          </div>
        )}

        {job.error_message && (
          <p className="text-xs text-red-600 mt-2 truncate" title={job.error_message}>{job.error_message}</p>
        )}
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 rounded-b-xl space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white rounded-lg px-2 py-1.5 border border-gray-100">
              <span className="text-gray-400">Provider</span>
              <p className="font-medium text-gray-700">{(params?.provider as string) === 'gmail_api' ? 'Gmail API' : 'SMTP'}</p>
            </div>
            <div className="bg-white rounded-lg px-2 py-1.5 border border-gray-100">
              <span className="text-gray-400">Recipients</span>
              <p className="font-medium text-gray-700">{totalRecipients ?? '—'}</p>
            </div>
            <div className="bg-white rounded-lg px-2 py-1.5 border border-gray-100">
              <span className="text-gray-400">Senders</span>
              <p className="font-medium text-gray-700">{totalUsers ?? '—'}</p>
            </div>
            <div className="bg-white rounded-lg px-2 py-1.5 border border-gray-100">
              <span className="text-gray-400">Range</span>
              <p className="font-medium text-gray-700">{rangeLabel()}</p>
            </div>
          </div>
          {params?.from_name ? (
            <div className="text-xs space-y-1">
              <div className="flex gap-2">
                <span className="text-gray-400 w-16 shrink-0">From:</span>
                <span className="text-gray-700 font-medium truncate">{String(params.from_name)}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-16 shrink-0">Subject:</span>
                <span className="text-gray-700 font-medium truncate">{String(params.subject)}</span>
              </div>
              {(params.geo || params.list_name) ? (
                <div className="flex gap-2">
                  <span className="text-gray-400 w-16 shrink-0">Filters:</span>
                  <span className="text-gray-700">
                    {params.list_name ? <span className="bg-indigo-50 text-indigo-600 rounded px-1.5 py-0.5 mr-1">{String(params.list_name)}</span> : null}
                    {params.geo ? <span className="bg-gray-200 text-gray-600 rounded px-1.5 py-0.5">{String(params.geo)}</span> : null}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}
          <p className="text-xs text-gray-400">
            Created: {new Date(job.created_at).toLocaleString()}
            {job.completed_at && <span> · Finished: {new Date(job.completed_at).toLocaleString()}</span>}
          </p>
        </div>
      )}
    </div>
  )
}

type CampaignFilter = 'all' | 'active' | 'completed' | 'failed'

const FILTER_TABS: { key: CampaignFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'failed', label: 'Failed' },
]

function filterCampaignsByTab(jobs: Job[], tab: CampaignFilter): Job[] {
  if (tab === 'active') return jobs.filter(j => ['running', 'paused', 'pending'].includes(j.status))
  if (tab === 'completed') return jobs.filter(j => j.status === 'completed')
  if (tab === 'failed') return jobs.filter(j => j.status === 'failed' || j.status === 'cancelled')
  return jobs
}

function countByFilter(jobs: Job[], tab: CampaignFilter): number {
  return filterCampaignsByTab(jobs, tab).length
}

interface CampaignListProps {
  readonly jobs: Job[]
  readonly onPause: (id: number) => void
  readonly onResume: (id: number) => void
  readonly onCancel: (id: number) => void
  readonly onDelete: (id: number) => void
  readonly onResend: (job: Job) => void
  readonly onNewCampaign: () => void
  readonly isPausePending: boolean
  readonly isResumePending: boolean
  readonly isCancelPending: boolean
  readonly isDeletePending: boolean
}

function CampaignList({ jobs, onPause, onResume, onCancel, onDelete, onResend, onNewCampaign, isPausePending, isResumePending, isCancelPending, isDeletePending }: CampaignListProps) {
  const [filter, setFilter] = useState<CampaignFilter>('all')
  const filtered = useMemo(() => filterCampaignsByTab(jobs, filter), [jobs, filter])

  const activeCount = jobs.filter(j => ['running', 'paused', 'pending'].includes(j.status)).length

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-sm text-gray-500 mt-1">
            {jobs.length} campaign{jobs.length !== 1 ? 's' : ''}
            {activeCount > 0 && <span className="text-indigo-600 font-medium"> · {activeCount} active</span>}
          </p>
        </div>
        <button
          onClick={onNewCampaign}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span> New Campaign
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
        {FILTER_TABS.map((tab) => {
          const count = countByFilter(jobs, tab.key)
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label} ({count})
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm text-gray-500 mb-4">
            {jobs.length === 0
              ? 'No campaigns yet. Launch your first campaign!'
              : `No ${filter} campaigns.`}
          </p>
          {jobs.length === 0 && (
            <button onClick={onNewCampaign} className="rounded-lg px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100">
              Create Campaign
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <div key={job.id} className="relative group">
              <CampaignCard
                job={job}
                onPause={onPause}
                onResume={onResume}
                onCancel={onCancel}
                onResend={onResend}
                isPausePending={isPausePending}
                isResumePending={isResumePending}
                isCancelPending={isCancelPending}
              />
              {/* Delete button for finished jobs */}
              {['completed', 'failed', 'cancelled'].includes(job.status) && (
                <button
                  onClick={() => onDelete(job.id)}
                  disabled={isDeletePending}
                  className="absolute top-4 right-14 rounded-full p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete campaign"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function getValidationIssues(
  fromName: string, subject: string, htmlContent: string,
  usersCount: number, recipientsCount: number,
  activeCredsCount: number, provider: string,
): string[] {
  const issues: string[] = []
  if (!fromName.trim()) issues.push('From Name is required')
  if (!subject.trim()) issues.push('Subject is required')
  if (!htmlContent.trim()) issues.push('HTML content is required')
  if (usersCount === 0) issues.push('No sender users selected')
  if (recipientsCount === 0) issues.push('No recipient emails available')
  if (activeCredsCount === 0 && provider === 'gmail_api') issues.push('No active credentials for Gmail API')
  return issues
}

function buildRecipientsLabel(count: number, listName: string, geo: string): string {
  const parts = [`Recipients (${count}`]
  if (listName) parts.push(` — ${listName}`)
  if (geo) parts.push(` — ${geo}`)
  parts.push(')')
  return parts.join('')
}

function buildRecipientsSummary(count: number, listName: string, geo: string, fromIdx: string, toIdx: string): string {
  let text = String(count)
  if (listName) text += ` (${listName})`
  if (geo) text += ` (${geo})`
  if (fromIdx && toIdx) text += ` [${fromIdx}→${toIdx}]`
  return text
}

export default function CampaignPage() {
  const { data: usersData } = useUsers()
  const { data: credentialsData } = useCredentials()
  const { data: emailDataRes } = useEmailData()
  const { data: emailInfoRes } = useEmailInfo()
  const { data: emailTemplatesRes } = useEmailTemplates()
  const { data: geosData } = useEmailDataGeos()
  const { data: listNamesData } = useEmailDataListNames()
  const { data: jobsData } = useJobs()

  const users = usersData?.data ?? []
  const credentials = credentialsData?.data ?? []
  const allRecipients = emailDataRes?.data ?? []
  const emailInfoList = emailInfoRes?.data ?? []
  const emailTemplates = emailTemplatesRes?.data ?? []
  const geos = geosData?.data ?? []
  const listNames = listNamesData?.data ?? []

  // Campaign jobs from the jobs list
  const campaignJobs = useMemo(() =>
    (jobsData?.data ?? [])
      .filter((j) => j.type === 'send_campaign_api' || j.type === 'send_campaign_smtp')
      .sort((a, b) => b.id - a.id),
    [jobsData],
  )

  // Stream active campaign jobs via SSE
  const activeJobIds = useMemo(() =>
    campaignJobs.filter((j) => ['pending', 'running', 'paused'].includes(j.status)).map((j) => j.id),
    [campaignJobs],
  )
  const streamedJobs = useMultiJobStream(activeJobIds)

  // Merge streamed data with fetched data
  const mergedCampaignJobs = useMemo(() =>
    campaignJobs.map((j) => streamedJobs.get(j.id) ?? j),
    [campaignJobs, streamedJobs],
  )

  const sendCampaignMutation = useSendCampaign()
  const sendTestMutation = useSendTestEmail()
  const cancelJobMutation = useCancelJob()
  const pauseJobMutation = usePauseJob()
  const resumeJobMutation = useResumeJob()
  const deleteJobMutation = useDeleteJob()

  // ── View mode: 'list' (default) or 'form' ──
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')

  // Form state
  const [fromName, setFromName] = useState('')
  const [subject, setSubject] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [provider, setProvider] = useState<'gmail_api' | 'smtp'>('gmail_api')
  const [batchSize, setBatchSize] = useState('300')
  const [showPreview, setShowPreview] = useState(false)

  // Geo, list name & range state
  const [selectedGeo, setSelectedGeo] = useState('')
  const [selectedListName, setSelectedListName] = useState('')
  const [fromIndex, setFromIndex] = useState('')
  const [toIndex, setToIndex] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(() => new Set(users.map(u => u.id)))

  // Selection state
  const [selectedEmailInfoId, setSelectedEmailInfoId] = useState<number | ''>('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('')
  const [selectedCredentialId, setSelectedCredentialId] = useState<number | ''>('')
  const [testEmail, setTestEmail] = useState('')
  const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Filter recipients for preview
  const geoFilteredList = useMemo(() => {
    let list = allRecipients
    if (selectedListName) list = list.filter((r) => r.list_name === selectedListName)
    if (selectedGeo) list = list.filter((r) => r.geo === selectedGeo)
    return list
  }, [allRecipients, selectedGeo, selectedListName])
  const geoFilteredCount = geoFilteredList.length
  const filteredRecipients = useMemo(() => {
    return filterRecipientsByRange(geoFilteredList, fromIndex, toIndex)
  }, [geoFilteredList, fromIndex, toIndex])

  // Auto-fill from EmailInfo
  const handleEmailInfoSelect = (id: number | '') => {
    setSelectedEmailInfoId(id)
    const info = id === '' ? null : emailInfoList.find((i) => i.id === id)
    if (info) { setFromName(info.from_name); setSubject(info.subject) }
  }

  // Auto-fill from Template
  const handleTemplateSelect = (id: number | '') => {
    setSelectedTemplateId(id)
    const tpl = id === '' ? null : emailTemplates.find((t) => t.id === id)
    if (tpl) setHtmlContent(tpl.html_content)
  }

  const activeCredentials = credentials.filter((c) => c.active)
  const selectedCred = selectedCredentialId === '' ? null : credentials.find((c) => c.id === selectedCredentialId)

  // Domain-based user filtering
  const domainFilteredUsers = useMemo(() => filterUsersByDomain(users, selectedCred?.domain), [users, selectedCred])

  const handleCredentialChange = (id: number | '') => {
    setSelectedCredentialId(id)
    const cred = id === '' ? null : credentials.find(c => c.id === id)
    const matching = filterUsersByDomain(users, cred?.domain)
    setSelectedUserIds(new Set(matching.map(u => u.id)))
  }

  const handleToggleUser = (id: number) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelectAllUsers = () => setSelectedUserIds(new Set(domainFilteredUsers.map(u => u.id)))
  const handleDeselectAllUsers = () => setSelectedUserIds(new Set())

  const handleSend = () => {
    const from = Number.parseInt(fromIndex, 10)
    const to = Number.parseInt(toIndex, 10)
    const hasRange = from > 0 && to > 0 && to >= from
    const range = hasRange ? { recipient_offset: from, recipient_limit: to } : { recipient_offset: null, recipient_limit: null }

    sendCampaignMutation.mutate({
      provider,
      from_name: fromName,
      subject,
      html_content: htmlContent,
      batch_size: Number.parseInt(batchSize, 10) || (provider === 'gmail_api' ? 300 : 20),
      geo: selectedGeo || null,
      list_name: selectedListName || null,
      user_ids: selectedUserIds.size > 0 ? [...selectedUserIds] : null,
      ...range,
    }, {
      onSuccess: () => setViewMode('list'),
    })
  }

  const handleSendTest = () => {
    setTestResult(null)
    sendTestMutation.mutate(
      { provider, from_name: fromName, subject, html_content: htmlContent, test_email: testEmail },
      {
        onSuccess: (data) => setTestResult({ type: 'success', message: data.message }),
        onError: (err: unknown) => setTestResult({ type: 'error', message: extractErrorMessage(err) }),
      },
    )
  }

  // ── Resend: prefill form from a past campaign ──
  const handleResend = (job: Job) => {
    const p = job.params || {}
    setFromName((p.from_name as string) || '')
    setSubject((p.subject as string) || '')
    setHtmlContent((p.html_content as string) || '')
    setProvider(((p.provider as string) === 'smtp' ? 'smtp' : 'gmail_api'))
    setBatchSize(String(p.batch_size ?? (p.provider === 'gmail_api' ? 300 : 20)))
    setSelectedGeo((p.geo as string) || '')
    setSelectedListName((p.list_name as string) || '')
    setFromIndex(p.recipient_offset ? String(p.recipient_offset) : '')
    setToIndex(p.recipient_limit ? String(p.recipient_limit) : '')
    // Restore user selection if available
    const ids = p.user_ids as number[] | undefined
    if (Array.isArray(ids) && ids.length > 0) {
      setSelectedUserIds(new Set(ids))
    } else {
      setSelectedUserIds(new Set(users.map(u => u.id)))
    }
    // Clear quick-fill selections
    setSelectedEmailInfoId('')
    setSelectedTemplateId('')
    setTestResult(null)
    setViewMode('form')
  }

  // ── New campaign: reset form ──
  const handleNewCampaign = () => {
    setFromName('')
    setSubject('')
    setHtmlContent('')
    setProvider('gmail_api')
    setBatchSize('300')
    setSelectedGeo('')
    setSelectedListName('')
    setFromIndex('')
    setToIndex('')
    setSelectedUserIds(new Set(users.map(u => u.id)))
    setSelectedEmailInfoId('')
    setSelectedTemplateId('')
    setSelectedCredentialId('')
    setTestResult(null)
    setViewMode('form')
  }

  const hasActiveJob = mergedCampaignJobs.some((j) => ['running', 'paused', 'pending'].includes(j.status))

  const issues = useMemo(() => getValidationIssues(fromName, subject, htmlContent, selectedUserIds.size, filteredRecipients.length, activeCredentials.length, provider), [fromName, subject, htmlContent, selectedUserIds.size, filteredRecipients.length, activeCredentials.length, provider])

  const canSend = issues.length === 0 && !sendCampaignMutation.isPending && !hasActiveJob

  // Pre-computed labels
  const senderCountLabel = String(selectedUserIds.size)
  const recipientsLabel = buildRecipientsLabel(filteredRecipients.length, selectedListName, selectedGeo)
  const recipientsSummary = buildRecipientsSummary(filteredRecipients.length, selectedListName, selectedGeo, fromIndex, toIndex)

  // ════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ════════════════════════════════════════════════════════════════════
  if (viewMode === 'list') {
    return (
      <CampaignList
        jobs={mergedCampaignJobs}
        onPause={(id) => pauseJobMutation.mutate(id)}
        onResume={(id) => resumeJobMutation.mutate(id)}
        onCancel={(id) => cancelJobMutation.mutate(id)}
        onDelete={(id) => deleteJobMutation.mutate(id)}
        onResend={handleResend}
        onNewCampaign={handleNewCampaign}
        isPausePending={pauseJobMutation.isPending}
        isResumePending={resumeJobMutation.isPending}
        isCancelPending={cancelJobMutation.isPending}
        isDeletePending={deleteJobMutation.isPending}
      />
    )
  }

  // ════════════════════════════════════════════════════════════════════
  // FORM VIEW (new campaign or resend)
  // ════════════════════════════════════════════════════════════════════

  return (
    <div>
      {/* Back header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setViewMode('list')}
          className="rounded-lg p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          title="Back to campaigns"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{fromName || subject ? 'Edit Campaign' : 'New Campaign'}</h1>
          <p className="text-sm text-gray-500">Configure and launch your email campaign</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ─── Left column: Message content ─── */}
        <div className="xl:col-span-2 space-y-4">
          {/* Quick-fill from existing data */}
          <SectionCard title="Quick Fill" icon="⚡">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="campaign-email-info" className="block text-sm font-medium text-gray-700 mb-1">
                  Load from Email Info
                </label>
                <select
                  id="campaign-email-info"
                  value={selectedEmailInfoId}
                  onChange={(e) => handleEmailInfoSelect(e.target.value ? Number(e.target.value) : '')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">— Manual input —</option>
                  {emailInfoList.map((info) => (
                    <option key={info.id} value={info.id}>
                      {info.from_name} — {info.subject} {info.active ? '(active)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Auto-fills From Name &amp; Subject
                </p>
              </div>
              <div>
                <label htmlFor="campaign-template" className="block text-sm font-medium text-gray-700 mb-1">
                  Load from Template
                </label>
                <select
                  id="campaign-template"
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateSelect(e.target.value ? Number(e.target.value) : '')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">— Manual input —</option>
                  {emailTemplates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} {tpl.active ? '(active)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Auto-fills HTML content
                </p>
              </div>
            </div>
          </SectionCard>

          {/* From & Subject */}
          <SectionCard title="Email Details" icon="✉️">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="campaign-from" className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
                <input
                  id="campaign-from"
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="e.g. My Company"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="campaign-subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  id="campaign-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Welcome to our newsletter"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </SectionCard>

          {/* HTML Content */}
          <SectionCard
            title="HTML Content"
            icon="📝"
            actions={
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {showPreview ? 'Edit' : 'Preview'}
              </button>
            }
          >
            {showPreview ? (
              <div
                className="w-full min-h-[300px] border border-gray-200 rounded-lg p-4 bg-gray-50 overflow-auto prose max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            ) : (
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="Paste your HTML email content here..."
                rows={14}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:ring-indigo-500"
              />
            )}
            <p className="text-xs text-gray-500 mt-2">
              Use <code className="bg-gray-100 px-1 rounded">[to]</code> as a placeholder for the recipient&apos;s name.
            </p>
          </SectionCard>
        </div>

        {/* ─── Right column: Config, Data & Send ─── */}
        <div className="space-y-4">
          {/* Credential selection */}
          <SectionCard title="Credential" icon="🔑">
            <div>
              <label htmlFor="campaign-credential" className="block text-sm font-medium text-gray-700 mb-1">Select Credential</label>
              <select
                id="campaign-credential"
                value={selectedCredentialId}
                onChange={(e) => handleCredentialChange(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">— All users (no domain filter) —</option>
                {credentials.map((cred) => (
                  <option key={cred.id} value={cred.id}>
                    {cred.name} {cred.domain ? `(@${cred.domain})` : ''} {cred.active ? '✓' : ''}
                  </option>
                ))}
              </select>
              {selectedCred ? (
                <p className="text-xs text-gray-500 mt-1">
                  <span className="font-medium">{selectedCred.name}</span>
                  {selectedCred.domain && <span className="text-indigo-600 ml-1">@{selectedCred.domain}</span>}
                  {selectedCred.active ? (
                    <span className="text-green-600 ml-1">(active)</span>
                  ) : (
                    <span className="text-amber-600 ml-1">(inactive)</span>
                  )}
                  <span className="text-gray-400 ml-1">— {domainFilteredUsers.length} users</span>
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Showing all {users.length} users. Select a credential to filter by domain.
                </p>
              )}
            </div>
          </SectionCard>

          {/* Sending config */}
          <SectionCard title="Sending Config" icon="⚙️">
            <div className="space-y-4">
              <div>
                <label htmlFor="campaign-provider" className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                <select
                  id="campaign-provider"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as 'gmail_api' | 'smtp')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="gmail_api">Gmail API (Service Account)</option>
                  <option value="smtp">SMTP (User Password)</option>
                </select>
              </div>
              <div>
                <label htmlFor="campaign-batch" className="block text-sm font-medium text-gray-700 mb-1">Batch Size</label>
                <input
                  id="campaign-batch"
                  type="number"
                  value={batchSize}
                  onChange={(e) => setBatchSize(e.target.value)}
                  min={1}
                  max={10000}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">Emails per user account per batch.</p>
              </div>
            </div>
          </SectionCard>

          {/* Recipient Filter */}
          <SectionCard title="Recipient Filter" icon="🌍">
            <div className="space-y-4">
              <div>
                <label htmlFor="campaign-list-name" className="block text-sm font-medium text-gray-700 mb-1">Filter by List Name</label>
                <select
                  id="campaign-list-name"
                  value={selectedListName}
                  onChange={(e) => setSelectedListName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">All lists</option>
                  {listNames.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="campaign-geo" className="block text-sm font-medium text-gray-700 mb-1">Filter by Geo</label>
                <select
                  id="campaign-geo"
                  value={selectedGeo}
                  onChange={(e) => setSelectedGeo(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">All regions ({allRecipients.length})</option>
                  {geos.map((g) => {
                    const count = allRecipients.filter((r) => r.geo === g).length
                    return (
                      <option key={g} value={g}>{g} ({count})</option>
                    )
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Index Range {fromIndex && toIndex ? `(${Math.max(0, Number.parseInt(toIndex, 10) - Number.parseInt(fromIndex, 10) + 1)} selected)` : `(all ${geoFilteredCount})`}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="campaign-from-index"
                    type="number"
                    value={fromIndex}
                    onChange={(e) => setFromIndex(e.target.value)}
                    min={1}
                    max={geoFilteredCount}
                    placeholder="From"
                    title="From index"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <span className="text-gray-400 text-sm">→</span>
                  <input
                    id="campaign-to-index"
                    type="number"
                    value={toIndex}
                    onChange={(e) => setToIndex(e.target.value)}
                    min={Number.parseInt(fromIndex, 10) || 1}
                    max={geoFilteredCount}
                    placeholder="To"
                    title="To index"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  From index 1 to {geoFilteredCount}. Leave empty to use all.
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Sender Users */}
          <SelectableUsersList
            users={domainFilteredUsers}
            selectedIds={selectedUserIds}
            onToggle={handleToggleUser}
            onSelectAll={handleSelectAllUsers}
            onDeselectAll={handleDeselectAllUsers}
            domain={selectedCred?.domain}
          />

          {/* Recipients / Email Data */}
          <RecipientsList
            recipients={filteredRecipients}
            label={recipientsLabel}
          />

          {/* Test Mode */}
          <SectionCard title="Test Mode" icon="🧪">
            <p className="text-sm text-gray-600 mb-3">Send a test email to check inbox delivery before launching the campaign.</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => { setTestEmail(e.target.value); setTestResult(null) }}
                placeholder="test@example.com"
                title="Test email address"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button
                onClick={handleSendTest}
                disabled={!testEmail.includes('@') || !fromName.trim() || !subject.trim() || !htmlContent.trim() || sendTestMutation.isPending}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {sendTestMutation.isPending ? 'Sending...' : 'Send Test'}
              </button>
            </div>
            {testResult && (
              <div className={`mt-2 rounded-lg px-3 py-2 text-sm ${
                testResult.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {testResult.message}
              </div>
            )}
          </SectionCard>

          {/* Validation & Send */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span>🚀</span> Launch Campaign
            </h2>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-gray-500">From</p>
                <p className="font-medium text-gray-800 truncate">{fromName || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-gray-500">Subject</p>
                <p className="font-medium text-gray-800 truncate">{subject || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-gray-500">Provider</p>
                <p className="font-medium text-gray-800">{provider === 'gmail_api' ? 'Gmail API' : 'SMTP'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-gray-500">Batch</p>
                <p className="font-medium text-gray-800">{batchSize}</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-gray-500">Senders</p>
                <p className="font-medium text-gray-800">{senderCountLabel} / {domainFilteredUsers.length}</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-gray-500">Recipients</p>
                <p className="font-medium text-gray-800">{recipientsSummary}</p>
              </div>
            </div>

            {/* Validation issues */}
            {issues.length > 0 && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                <p className="text-xs font-medium text-amber-700 mb-1">Missing requirements:</p>
                <ul className="text-xs text-amber-600 space-y-0.5">
                  {issues.map((issue) => (
                    <li key={issue}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={!canSend}
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
            >
              {sendCampaignMutation.isPending ? 'Starting Campaign...' : `Send Campaign to ${filteredRecipients.length} recipients`}
            </button>

            {sendCampaignMutation.isError && (
              <p className="text-xs text-red-600">
                {(sendCampaignMutation.error as Error)?.message || 'Failed to start campaign'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
