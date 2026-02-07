import { useJobs, useCancelJob } from '../hooks/useJobs'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorAlert from '../components/ui/ErrorAlert'
import StatusBadge from '../components/ui/StatusBadge'
import type { Job } from '../api/types'

const typeLabels: Record<string, string> = {
  send_email_api: 'Send Emails (Gmail API)',
  send_email_smtp: 'Send Emails (SMTP)',
  generate_users: 'Generate Users',
  create_google_users: 'Create Google Users',
  delete_google_users: 'Delete Google Users',
  detect_bounces: 'Detect Bounces',
}

const statusColors: Record<string, 'green' | 'red' | 'yellow' | 'blue' | 'gray'> = {
  completed: 'green',
  failed: 'red',
  running: 'blue',
  pending: 'yellow',
  cancelled: 'gray',
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  )
}

function JobRow({ job, onCancel }: { job: Job; onCancel: (id: number) => void }) {
  return (
    <tr className="border-b border-gray-100">
      <td className="px-4 py-3 text-sm font-mono text-gray-500">#{job.id}</td>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">{typeLabels[job.type] || job.type}</td>
      <td className="px-4 py-3">
        <StatusBadge color={statusColors[job.status] || 'gray'} label={job.status} />
      </td>
      <td className="px-4 py-3 w-40">
        <div className="flex items-center gap-2">
          <ProgressBar progress={job.progress} />
          <span className="text-xs text-gray-500 w-10 text-right">{job.progress}%</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {job.processed_items}/{job.total_items}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {new Date(job.created_at).toLocaleString()}
      </td>
      <td className="px-4 py-3 text-sm text-right">
        {(job.status === 'running' || job.status === 'pending') && (
          <button
            onClick={() => onCancel(job.id)}
            className="text-red-600 hover:text-red-800 text-xs font-medium"
          >
            Cancel
          </button>
        )}
        {job.error_message && (
          <span className="text-red-500 text-xs" title={job.error_message}>
            Error
          </span>
        )}
      </td>
    </tr>
  )
}

export default function JobsPage() {
  const { data, isLoading, error } = useJobs()
  const cancelMutation = useCancelJob()

  if (error) return <ErrorAlert message={error.message} />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
        {data?.count != null && (
          <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
            {data.count}
          </span>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !data?.data?.length ? (
        <div className="text-center py-12 text-gray-500">
          No jobs yet. Launch an action from the Actions page.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Progress</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Items</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {data.data.map(job => (
                <JobRow key={job.id} job={job} onCancel={(id) => cancelMutation.mutate(id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
