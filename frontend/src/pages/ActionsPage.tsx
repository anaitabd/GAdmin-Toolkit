import { useState } from 'react'
import {
  PaperAirplaneIcon,
  UserPlusIcon,
  UsersIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import {
  useSendEmails,
  useGenerateUsers,
  useCreateGoogleUsers,
  useDeleteGoogleUsers,
  useDetectBounces,
  useJobStream,
} from '../hooks/useJobs'
import { useSettings } from '../hooks/useSettings'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
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

function ActionCard({
  icon: Icon,
  title,
  description,
  buttonText,
  buttonColor = 'bg-indigo-600 hover:bg-indigo-700',
  onClick,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  buttonText: string
  buttonColor?: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="rounded-lg bg-gray-100 p-2">
          <Icon className="h-6 w-6 text-gray-700" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full rounded-lg px-4 py-2 text-sm font-medium text-white ${buttonColor} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {buttonText}
      </button>
    </div>
  )
}

export default function ActionsPage() {
  const { data: settingsData } = useSettings()
  const settings = settingsData?.data

  const sendMutation = useSendEmails()
  const generateMutation = useGenerateUsers()
  const createGoogleMutation = useCreateGoogleUsers()
  const deleteGoogleMutation = useDeleteGoogleUsers()
  const detectBouncesMutation = useDetectBounces()

  // Dialogs
  const [sendOpen, setSendOpen] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [googleCreateOpen, setGoogleCreateOpen] = useState(false)
  const [googleDeleteOpen, setGoogleDeleteOpen] = useState(false)

  // Form states
  const [sendProvider, setSendProvider] = useState<'gmail_api' | 'smtp'>('gmail_api')
  const [genDomain, setGenDomain] = useState(settings?.default_domain || '')
  const [genCount, setGenCount] = useState(settings?.default_num_records || '100')
  const [adminEmail, setAdminEmail] = useState(settings?.admin_email || '')

  // Active job tracking
  const [activeJobId, setActiveJobId] = useState<number | null>(null)
  const streamedJob = useJobStream(activeJobId)

  const handleJobCreated = (result: { data: Job }) => {
    setActiveJobId(result.data.id)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Actions</h1>

      {/* Active job progress */}
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <ActionCard
          icon={PaperAirplaneIcon}
          title="Send Emails"
          description="Send emails to all recipients using the active template, email info, and user accounts."
          buttonText="Configure & Send"
          onClick={() => setSendOpen(true)}
          disabled={sendMutation.isPending}
        />
        <ActionCard
          icon={UserPlusIcon}
          title="Generate Users"
          description="Generate random user accounts from the names database with a specified domain."
          buttonText="Generate"
          onClick={() => { setGenDomain(settings?.default_domain || ''); setGenCount(settings?.default_num_records || '100'); setGenerateOpen(true) }}
          disabled={generateMutation.isPending}
        />
        <ActionCard
          icon={UsersIcon}
          title="Create Google Users"
          description="Create all generated users in Google Workspace Admin using service account credentials."
          buttonText="Create in Google"
          onClick={() => { setAdminEmail(settings?.admin_email || ''); setGoogleCreateOpen(true) }}
          disabled={createGoogleMutation.isPending}
        />
        <ActionCard
          icon={TrashIcon}
          title="Delete Google Users"
          description="Delete all non-admin users from Google Workspace. This action is irreversible!"
          buttonText="Delete from Google"
          buttonColor="bg-red-600 hover:bg-red-700"
          onClick={() => { setAdminEmail(settings?.admin_email || ''); setGoogleDeleteOpen(true) }}
          disabled={deleteGoogleMutation.isPending}
        />
        <ActionCard
          icon={MagnifyingGlassIcon}
          title="Detect Bounces"
          description="Scan Mail Delivery Subsystem messages across all user accounts to find bounced emails."
          buttonText="Start Detection"
          onClick={() => {
            detectBouncesMutation.mutate(undefined, { onSuccess: handleJobCreated })
          }}
          disabled={detectBouncesMutation.isPending}
        />
      </div>

      {/* Send Emails Modal */}
      <Modal isOpen={sendOpen} onClose={() => setSendOpen(false)} title="Send Emails">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
            <select
              value={sendProvider}
              onChange={(e) => setSendProvider(e.target.value as 'gmail_api' | 'smtp')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="gmail_api">Gmail API (Service Account)</option>
              <option value="smtp">SMTP (User Password)</option>
            </select>
          </div>
          <p className="text-xs text-gray-500">
            This will send emails to all recipients in Email Data, using the active Email Info &amp; Template,
            distributed across all Users.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setSendOpen(false)} className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Cancel</button>
            <button
              onClick={() => {
                sendMutation.mutate(sendProvider, {
                  onSuccess: (result) => { handleJobCreated(result); setSendOpen(false) },
                })
              }}
              disabled={sendMutation.isPending}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {sendMutation.isPending ? 'Starting...' : 'Start Sending'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Generate Users Modal */}
      <Modal isOpen={generateOpen} onClose={() => setGenerateOpen(false)} title="Generate Users">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
            <input
              type="text" value={genDomain} onChange={(e) => setGenDomain(e.target.value)}
              placeholder="example.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Records</label>
            <input
              type="number" value={genCount} onChange={(e) => setGenCount(e.target.value)}
              min={1} max={10000}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setGenerateOpen(false)} className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Cancel</button>
            <button
              onClick={() => {
                generateMutation.mutate(
                  { domain: genDomain, num_records: parseInt(genCount, 10) },
                  { onSuccess: (result) => { handleJobCreated(result); setGenerateOpen(false) } },
                )
              }}
              disabled={generateMutation.isPending || !genDomain}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {generateMutation.isPending ? 'Starting...' : 'Generate'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Google Users Modal */}
      <Modal isOpen={googleCreateOpen} onClose={() => setGoogleCreateOpen(false)} title="Create Google Workspace Users">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
            <input
              type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@yourdomain.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">The Google Workspace admin email used for delegation.</p>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setGoogleCreateOpen(false)} className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Cancel</button>
            <button
              onClick={() => {
                createGoogleMutation.mutate(adminEmail, {
                  onSuccess: (result) => { handleJobCreated(result); setGoogleCreateOpen(false) },
                })
              }}
              disabled={createGoogleMutation.isPending || !adminEmail}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {createGoogleMutation.isPending ? 'Starting...' : 'Create Users'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Google Users Confirm */}
      <ConfirmDialog
        isOpen={googleDeleteOpen}
        onClose={() => setGoogleDeleteOpen(false)}
        onConfirm={() => {
          deleteGoogleMutation.mutate(adminEmail || settings?.admin_email || '', {
            onSuccess: (result) => { handleJobCreated(result); setGoogleDeleteOpen(false) },
          })
        }}
        title="Delete All Google Users"
        message="This will delete ALL non-admin users from Google Workspace. This action cannot be undone. Are you sure?"
        confirmText="Delete All Users"
        isLoading={deleteGoogleMutation.isPending}
      />
    </div>
  )
}
