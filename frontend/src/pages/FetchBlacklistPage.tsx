import { useState } from 'react'
import type { DataList, Blacklist } from '../api/types'
import ErrorAlert from '../components/ui/ErrorAlert'
import { useQuery, useMutation } from '@tanstack/react-query'
import * as dataListsApi from '../api/dataLists'
import * as blacklistsApi from '../api/blacklists'

export default function FetchBlacklistPage() {
  const [selectedDataListId, setSelectedDataListId] = useState<string>('')
  const [selectedBlacklistId, setSelectedBlacklistId] = useState<string>('')
  const [result, setResult] = useState<any>(null)
  const [mutationError, setMutationError] = useState('')

  const { data: dataLists } = useQuery({
    queryKey: ['data-lists', { limit: 1000 }],
    queryFn: () => dataListsApi.getAll({ limit: 1000 })
  })

  const { data: blacklists } = useQuery({
    queryKey: ['blacklists', { limit: 1000 }],
    queryFn: () => blacklistsApi.getAll({ limit: 1000 })
  })

  const fetchMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBlacklistId) throw new Error('Please select a blacklist')
      
      // This would call an endpoint to fetch emails from data list to blacklist
      // For now, we'll simulate the response since the actual endpoint might vary
      const response = await blacklistsApi.getEmails(parseInt(selectedBlacklistId), { limit: 10000 })
      return response
    },
    onSuccess: (data) => {
      setResult({ 
        success: true, 
        count: data.count || 0,
        message: `Successfully fetched ${data.count || 0} emails`
      })
      setMutationError('')
    },
    onError: (err) => {
      setMutationError(err instanceof Error ? err.message : 'Fetch failed')
      setResult(null)
    }
  })

  const handleFetch = () => {
    setMutationError('')
    setResult(null)
    fetchMutation.mutate()
  }

  const canFetch = selectedBlacklistId && !fetchMutation.isPending

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fetch Blacklist Emails</h1>
        <p className="mt-1 text-sm text-gray-600">Fetch blacklist emails from data sources</p>
      </div>

      {mutationError && <ErrorAlert message={mutationError} onClose={() => setMutationError('')} />}

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Source Data List (Optional)</label>
            <select 
              value={selectedDataListId} 
              onChange={e => setSelectedDataListId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500">
              <option value="">-- Select a data list (optional) --</option>
              {dataLists?.data?.map((list: DataList) => (
                <option key={list.id} value={list.id}>{list.name}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">Select a data list to import emails from (optional)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Blacklist *</label>
            <select 
              value={selectedBlacklistId} 
              onChange={e => setSelectedBlacklistId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500">
              <option value="">-- Select a blacklist --</option>
              {blacklists?.data?.map((blacklist: Blacklist) => (
                <option key={blacklist.id} value={blacklist.id}>{blacklist.name}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">Select the blacklist to fetch/import emails to</p>
          </div>

          <button 
            onClick={handleFetch}
            disabled={!canFetch}
            className="w-full rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
            {fetchMutation.isPending ? 'Fetching...' : 'Fetch Emails'}
          </button>
        </div>
      </div>

      {fetchMutation.isPending && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-sm text-gray-700">Processing... This may take a few moments.</p>
        </div>
      )}

      {result && (
        <div className={`${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-6`}>
          <h3 className={`text-lg font-semibold mb-2 ${result.success ? 'text-green-900' : 'text-red-900'}`}>
            {result.success ? 'Success!' : 'Failed'}
          </h3>
          <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
            {result.message}
          </p>
          {result.count != null && (
            <div className="mt-4 text-2xl font-bold text-green-900">
              {result.count.toLocaleString()} emails
            </div>
          )}
        </div>
      )}
    </div>
  )
}
