import { useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import ErrorAlert from '../components/ui/ErrorAlert'
import { useMutation } from '@tanstack/react-query'
import * as toolsApi from '../api/tools'
import type { SPFResult } from '../api/tools'

export default function SPFCheckerPage() {
  const [domainsInput, setDomainsInput] = useState('')
  const [results, setResults] = useState<SPFResult[]>([])
  const [mutationError, setMutationError] = useState('')

  const checkMutation = useMutation({
    mutationFn: toolsApi.checkSPF,
    onSuccess: (response) => {
      setResults(response.data)
      setMutationError('')
    },
    onError: (err) => {
      setMutationError(err instanceof Error ? err.message : 'SPF check failed')
    }
  })

  const handleCheck = () => {
    const domains = domainsInput
      .split('\n')
      .map(d => d.trim())
      .filter(d => d.length > 0)
    
    if (domains.length === 0) {
      setMutationError('Please enter at least one domain')
      return
    }

    setMutationError('')
    checkMutation.mutate(domains)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SPF & DMARC Checker</h1>
        <p className="mt-2 text-sm text-gray-600">
          Check SPF and DMARC records for multiple domains
        </p>
      </div>

      {mutationError && <ErrorAlert message={mutationError} onClose={() => setMutationError('')} />}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domains (one per line)
            </label>
            <textarea
              value={domainsInput}
              onChange={(e) => setDomainsInput(e.target.value)}
              placeholder="example.com
another-domain.com
third-domain.com"
              rows={8}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono"
            />
          </div>

          <button
            onClick={handleCheck}
            disabled={checkMutation.isPending || !domainsInput.trim()}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            {checkMutation.isPending ? 'Checking...' : 'Check Domains'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Results</h2>
            <p className="mt-1 text-sm text-gray-600">
              Found {results.length} domain{results.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Domain</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">SPF Record</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">DMARC Record</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {results.map((result, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-gray-50' : ''}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{result.domain}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="max-w-md truncate font-mono text-xs text-gray-600" title={result.spf}>
                        {result.spf || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="max-w-md truncate font-mono text-xs text-gray-600" title={result.dmarc}>
                        {result.dmarc || '-'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        result.status === 'valid' ? 'bg-green-100 text-green-700' :
                        result.status === 'invalid' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {result.status}
                      </span>
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
