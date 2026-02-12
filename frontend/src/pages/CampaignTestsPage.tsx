import { useState } from 'react'
import type { Campaign } from '../api/types'
import DataTable from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import ErrorAlert from '../components/ui/ErrorAlert'
import Pagination from '../components/ui/Pagination'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import * as campaignsApi from '../api/campaigns'

const columns: Column<Campaign>[] = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
  { 
    key: 'job_status', 
    header: 'Status', 
    render: (item) => (
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
        item.job_status === 'completed' ? 'bg-green-100 text-green-700' :
        item.job_status === 'running' ? 'bg-blue-100 text-blue-700' :
        item.job_status === 'failed' ? 'bg-red-100 text-red-700' :
        'bg-gray-100 text-gray-700'
      }`}>
        {item.job_status || 'pending'}
      </span>
    )
  },
  { 
    key: 'processed_items', 
    header: 'Sent', 
    render: (item) => `${item.processed_items || 0} / ${item.total_items || 0}`
  },
  { 
    key: 'progress', 
    header: 'Progress', 
    render: (item) => `${item.progress || 0}%`
  },
  { key: 'created_at', header: 'Created At', render: (item) => new Date(item.created_at).toLocaleDateString() },
]

export default function CampaignTestsPage() {
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = 50

  // Filter to test campaigns - you could add a flag in backend or filter by name pattern
  const { data, isLoading, error } = useQuery({
    queryKey: ['campaigns', 'tests', { search: search || undefined, limit, offset }],
    queryFn: () => campaignsApi.getAll({ search: search || undefined, limit, offset })
  })

  if (error) return <ErrorAlert message={error.message} />

  // Filter for test campaigns (those with 'test' in name or description)
  const testCampaigns = data?.data?.filter((campaign: Campaign) => 
    campaign.name?.toLowerCase().includes('test') || 
    campaign.description?.toLowerCase().includes('test')
  ) || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Campaign Tests Monitor</h1>
          <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
            {testCampaigns.length}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Search test campaigns..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={testCampaigns}
        isLoading={isLoading}
      />

      {data && data.count > limit && (
        <Pagination
          offset={offset}
          limit={limit}
          total={data.count}
          onPageChange={setOffset}
        />
      )}
    </div>
  )
}
