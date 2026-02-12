import { useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import ErrorAlert from '../components/ui/ErrorAlert'
import { useMutation } from '@tanstack/react-query'
import * as toolsApi from '../api/tools'
import type { ReputationResult } from '../api/tools'

export default function ReputationPage() {
  const [target, setTarget] = useState('')
  const [results, setResults] = useState<ReputationResult[]>([])
  const [mutationError, setMutationError] = useState('')
  const [checkedTarget, setCheckedTarget] = useState('')

  const checkMutation = useMutation({
    mutationFn: toolsApi.checkReputation,
    onSuccess: (response) => {
      setResults(response.data)
      setCheckedTarget(target)
      setMutationError('')
    },
    onError: (err) => {
      setMutationError(err instanceof Error ? err.message : 'Reputation check failed')
    }
  })

  const handleCheck = () => {
    const trimmedTarget = target.trim()
    
    if (!trimmedTarget) {
      setMutationError('Please enter a domain or IP address')
      return
    }

    setMutationError('')
    checkMutation.mutate(trimmedTarget)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && target.trim()) {
      handleCheck()
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reputation Checker</h1>
        <p className="mt-2 text-sm text-gray-600">
          Check domain or IP address reputation across multiple blacklists
        </p>
      </div>

      {mutationError && <ErrorAlert message={mutationError} onClose={() => setMutationError('')} />}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domain or IP Address
            </label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="example.com or 192.168.1.1"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={handleCheck}
            disabled={checkMutation.isPending || !target.trim()}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            {checkMutation.isPending ? 'Checking...' : 'Check Reputation'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Results for: {checkedTarget}</h2>
            <p className="mt-1 text-sm text-gray-600">
              Checked against {results.length} blacklist{results.length !== 1 ? 's' : ''}
            </p>
            <div className="mt-2 flex gap-4">
              <span className="text-sm">
                <span className="font-medium text-green-700">Clean: </span>
                {results.filter(r => !r.listed).length}
              </span>
              <span className="text-sm">
                <span className="font-medium text-red-700">Listed: </span>
                {results.filter(r => r.listed).length}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Blacklist</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Listed</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {results.map((result, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-gray-50' : ''}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{result.blacklist}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        result.listed ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {result.listed ? 'Listed' : 'Clean'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {result.details || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
