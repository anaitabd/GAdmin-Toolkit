import { useState } from 'react'
import ErrorAlert from '../components/ui/ErrorAlert'
import { useQuery } from '@tanstack/react-query'
import * as statisticsApi from '../api/statistics'
import * as leadsApi from '../api/leads'

export default function RevenueReportPage() {
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['statistics', 'dashboard'],
    queryFn: () => statisticsApi.getDashboardStats()
  })

  const { data: leadsStats, isLoading: leadsLoading, error: leadsError } = useQuery({
    queryKey: ['leads', 'stats', { date_from: dateFrom || undefined, date_to: dateTo || undefined }],
    queryFn: () => leadsApi.getStats({ date_from: dateFrom || undefined, date_to: dateTo || undefined })
  })

  const isLoading = statsLoading || leadsLoading
  const error = statsError || leadsError

  if (error) return <ErrorAlert message={error.message} />

  const totalLeads = stats?.data?.total_leads || 0
  const totalRevenue = stats?.data?.total_revenue || 0
  const avgPayout = totalLeads > 0 ? (totalRevenue / totalLeads) : 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Revenue Report</h1>
        <p className="mt-1 text-sm text-gray-600">View revenue analytics and statistics</p>
      </div>

      <div className="mb-6 flex gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm font-medium text-gray-500">Total Leads</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {isLoading ? '...' : totalLeads.toLocaleString()}
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm font-medium text-gray-500">Total Payout</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {isLoading ? '...' : `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm font-medium text-gray-500">Average Payout</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {isLoading ? '...' : `$${avgPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Revenue by Source</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Offer ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Network ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Payout</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : leadsStats?.data && leadsStats.data.length > 0 ? (
                leadsStats.data.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.offer_id || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.campaign_id || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.affiliate_network_id || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.lead_count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${parseFloat(item.total_payout || 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
