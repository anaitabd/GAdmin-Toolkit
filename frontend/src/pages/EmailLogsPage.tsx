import { useState } from 'react'
import type { EmailLog, EmailLogFilters } from '../api/types'
import { useEmailLogs } from '../hooks/useEmailLogs'
import DataTable from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import FilterBar from '../components/ui/FilterBar'
import Pagination from '../components/ui/Pagination'
import ErrorAlert from '../components/ui/ErrorAlert'

const filterFields = [
  { key: 'user_email', label: 'User Email', type: 'text' as const },
  {
    key: 'status', label: 'Status', type: 'select' as const,
    options: [{ value: 'sent', label: 'Sent' }, { value: 'failed', label: 'Failed' }],
  },
  {
    key: 'provider', label: 'Provider', type: 'select' as const,
    options: [{ value: 'gmail_api', label: 'Gmail API' }, { value: 'smtp', label: 'SMTP' }],
  },
]

const columns: Column<EmailLog>[] = [
  { key: 'id', header: 'ID' },
  { key: 'user_email', header: 'User Email' },
  { key: 'to_email', header: 'To Email' },
  {
    key: 'status', header: 'Status', render: (l) => (
      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        l.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {l.status}
      </span>
    ),
  },
  { key: 'provider', header: 'Provider' },
  { key: 'error_message', header: 'Error', render: (l) => l.error_message ? <span className="text-red-600 text-xs">{l.error_message}</span> : '-' },
  { key: 'sent_at', header: 'Sent At', render: (l) => new Date(l.sent_at).toLocaleString() },
]

export default function EmailLogsPage() {
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [offset, setOffset] = useState(0)
  const limit = 50

  const queryFilters: EmailLogFilters = {
    ...filters.user_email && { user_email: filters.user_email },
    ...filters.status && { status: filters.status },
    ...filters.provider && { provider: filters.provider },
    limit,
    offset,
  }

  const { data, isLoading, error } = useEmailLogs(queryFilters)

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setOffset(0)
  }

  const handleClear = () => { setFilters({}); setOffset(0) }

  if (error) return <ErrorAlert message={error.message} />

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Email Logs</h1>
      <FilterBar fields={filterFields} values={filters} onChange={handleFilterChange} onClear={handleClear} />
      <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading} />
      {data?.count != null && (
        <Pagination offset={offset} limit={limit} total={data.count} onChange={setOffset} />
      )}
    </div>
  )
}
