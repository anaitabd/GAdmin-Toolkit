import { useState } from 'react'
import type { BounceLog, BounceLogFilters } from '../api/types'
import { useBounceLogs } from '../hooks/useBounceLogs'
import DataTable from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import FilterBar from '../components/ui/FilterBar'
import Pagination from '../components/ui/Pagination'
import ErrorAlert from '../components/ui/ErrorAlert'

const filterFields = [
  { key: 'email', label: 'Email', type: 'text' as const },
]

const columns: Column<BounceLog>[] = [
  { key: 'id', header: 'ID' },
  { key: 'email', header: 'Email' },
  { key: 'reason', header: 'Reason', render: (b) => b.reason || '-' },
  { key: 'detected_at', header: 'Detected At', render: (b) => new Date(b.detected_at).toLocaleString() },
]

export default function BounceLogsPage() {
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [offset, setOffset] = useState(0)
  const limit = 50

  const queryFilters: BounceLogFilters = {
    ...filters.email && { email: filters.email },
    limit,
    offset,
  }

  const { data, isLoading, error } = useBounceLogs(queryFilters)

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setOffset(0)
  }

  const handleClear = () => { setFilters({}); setOffset(0) }

  if (error) return <ErrorAlert message={error.message} />

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Bounce Logs</h1>
      <FilterBar fields={filterFields} values={filters} onChange={handleFilterChange} onClear={handleClear} />
      <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading} />
      {data?.count != null && (
        <Pagination offset={offset} limit={limit} total={data.count} onChange={setOffset} />
      )}
    </div>
  )
}
