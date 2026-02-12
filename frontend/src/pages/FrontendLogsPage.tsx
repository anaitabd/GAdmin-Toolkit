import { useState } from 'react'
import type { ApplicationLog } from '../api/types'
import DataTable from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import ErrorAlert from '../components/ui/ErrorAlert'
import Pagination from '../components/ui/Pagination'
import { MagnifyingGlassIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import * as logsApi from '../api/logs'

const getLevelBadgeClass = (level: string) => {
  switch (level.toLowerCase()) {
    case 'debug': return 'bg-gray-100 text-gray-700'
    case 'info': return 'bg-blue-100 text-blue-700'
    case 'warn': return 'bg-yellow-100 text-yellow-700'
    case 'error': return 'bg-red-100 text-red-700'
    case 'fatal': return 'bg-purple-100 text-purple-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

export default function FrontendLogsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [levelFilter, setLevelFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  const limit = 50

  const { data, isLoading, error } = useQuery({
    queryKey: ['logs', 'frontend', { 
      level: levelFilter || undefined, 
      date_from: dateFrom || undefined, 
      date_to: dateTo || undefined, 
      search: search || undefined, 
      limit, 
      page 
    }],
    queryFn: () => logsApi.getFrontendLogs({ 
      level: levelFilter || undefined, 
      date_from: dateFrom || undefined, 
      date_to: dateTo || undefined, 
      search: search || undefined, 
      limit, 
      page 
    })
  })

  const columns: Column<ApplicationLog>[] = [
    { key: 'id', header: 'ID' },
    { 
      key: 'level', 
      header: 'Level', 
      render: (item) => (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getLevelBadgeClass(item.level)}`}>
          {item.level}
        </span>
      )
    },
    { 
      key: 'message', 
      header: 'Message',
      render: (item) => (
        <div className="max-w-md truncate">{item.message}</div>
      )
    },
    { key: 'user_email', header: 'User' },
    { key: 'ip_address', header: 'IP Address' },
    { 
      key: 'created_at', 
      header: 'Created At', 
      render: (item) => new Date(item.created_at).toLocaleString()
    },
  ]

  const toggleRow = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id)
  }

  if (error) return <ErrorAlert message={error.message} />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Frontend Logs</h1>
          {data?.count != null && (
            <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {data.count}
            </span>
          )}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="">All Levels</option>
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
          <option value="fatal">Fatal</option>
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          placeholder="From date"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          placeholder="To date"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
                {columns.map(col => (
                  <th key={String(col.key)} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-sm text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : data?.data && data.data.length > 0 ? (
                <>
                  {data.data.map((log: ApplicationLog) => (
                    <>
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-2 py-4 text-center">
                          <button onClick={() => toggleRow(log.id)} className="text-gray-400 hover:text-gray-600">
                            {expandedRow === log.id ? (
                              <ChevronUpIcon className="h-4 w-4" />
                            ) : (
                              <ChevronDownIcon className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        {columns.map(col => (
                          <td key={String(col.key)} className="px-6 py-4 text-sm text-gray-900">
                            {col.render ? col.render(log) : String(log[col.key] ?? '')}
                          </td>
                        ))}
                      </tr>
                      {expandedRow === log.id && log.context && (
                        <tr key={`${log.id}-expanded`}>
                          <td colSpan={columns.length + 1} className="px-8 py-4 bg-gray-50">
                            <div className="text-sm">
                              <div className="font-medium text-gray-700 mb-2">Context:</div>
                              <pre className="bg-white p-3 rounded border border-gray-200 overflow-x-auto text-xs">
                                {JSON.stringify(log.context, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </>
              ) : (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-sm text-gray-500">
                    No logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {data && data.count > limit && (
        <Pagination
          offset={(page - 1) * limit}
          limit={limit}
          total={data.count}
          onPageChange={(newOffset) => setPage(Math.floor(newOffset / limit) + 1)}
        />
      )}
    </div>
  )
}
