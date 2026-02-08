import { useState } from 'react'
import { useSendCampaign, useJobStream } from '../hooks/useJobs'
import { useUsers } from '../hooks/useUsers'
import { useCredentials } from '../hooks/useCredentials'
import { useEmailData } from '../hooks/useEmailData'
import type { Job } from '../api/types'

function ProgressBar({ progress, status }: { progress: number; status: string }) {
  const color = status === 'failed' ? 'bg-red-500' : status === 'completed' ? 'bg-green-500' : 'bg-indigo-600'
  return (
    <div className="mt-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 capitalize">{status}</span>
        <span className="font-medium">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full transition-all duration-300`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

export default function CampaignPage() {
  const { data: usersData } = useUsers()
  const { data: credentialsData } = useCredentials()
  const { data: emailDataRes } = useEmailData()

  const users = usersData?.data ?? []
  const credentials = credentialsData?.data ?? []
  const recipients = emailDataRes?.data ?? []

  const sendCampaignMutation = useSendCampaign()

  // Form state
  const [fromName, setFromName] = useState('')
  const [subject, setSubject] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [provider, setProvider] = useState<'gmail_api' | 'smtp'>('gmail_api')
  const [batchSize, setBatchSize] = useState('300')
  const [showPreview, setShowPreview] = useState(false)

  // Job tracking
  const [activeJobId, setActiveJobId] = useState<number | null>(null)
  const streamedJob = useJobStream(activeJobId)

  const handleSend = () => {
    sendCampaignMutation.mutate(
      {
        provider,
        from_name: fromName,
        subject,
        html_content: htmlContent,
        batch_size: parseInt(batchSize, 10) || (provider === 'gmail_api' ? 300 : 20),
      },
      {
        onSuccess: (result: { data: Job }) => {
          setActiveJobId(result.data.id)
        },
      },
    )
  }

  const canSend = fromName.trim() && subject.trim() && htmlContent.trim() && !sendCampaignMutation.isPending

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Campaign</h1>

      {/* Job progress */}
      {streamedJob && activeJobId && (
        <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="font-medium text-indigo-900">
            Job #{streamedJob.id} — {streamedJob.type.replace(/_/g, ' ')}
          </p>
          <ProgressBar progress={streamedJob.progress} status={streamedJob.status} />
          {streamedJob.processed_items > 0 && (
            <p className="text-xs text-indigo-700 mt-1">
              {streamedJob.processed_items} / {streamedJob.total_items} items processed
            </p>
          )}
          {streamedJob.error_message && (
            <p className="text-xs text-red-600 mt-1">{streamedJob.error_message}</p>
          )}
          {['completed', 'failed', 'cancelled'].includes(streamedJob.status) && (
            <button onClick={() => setActiveJobId(null)} className="text-xs text-indigo-600 underline mt-2">
              Dismiss
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column - Campaign setup */}
        <div className="xl:col-span-2 space-y-4">
          {/* From & Subject */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
                <input
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="e.g. My Company"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Welcome to our newsletter"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* HTML Content */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">HTML Content</h2>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {showPreview ? 'Edit' : 'Preview'}
              </button>
            </div>
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
          </div>
        </div>

        {/* Right column - Config & Send */}
        <div className="space-y-4">
          {/* Sending config */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sending Config</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as 'gmail_api' | 'smtp')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="gmail_api">Gmail API (Service Account)</option>
                  <option value="smtp">SMTP (User Password)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Size</label>
                <input
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
          </div>

          {/* Resources summary */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resources</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Credentials</span>
                <span className="font-medium text-gray-900">
                  {credentials.filter((c) => c.active).length} active / {credentials.length} total
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Sender Users</span>
                <span className="font-medium text-gray-900">{users.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Recipients</span>
                <span className="font-medium text-gray-900">{recipients.length}</span>
              </div>
            </div>
            {(!users.length || !recipients.length) && (
              <p className="text-xs text-amber-600 mt-3">
                ⚠ You need at least one user and one recipient to send a campaign.
              </p>
            )}
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!canSend || !users.length || !recipients.length}
            className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {sendCampaignMutation.isPending ? 'Starting Campaign...' : 'Send Campaign'}
          </button>

          {sendCampaignMutation.isError && (
            <p className="text-xs text-red-600">
              {(sendCampaignMutation.error as Error)?.message || 'Failed to start campaign'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
