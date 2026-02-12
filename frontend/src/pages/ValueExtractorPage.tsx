import { useState } from 'react'
import { DocumentDuplicateIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import ErrorAlert from '../components/ui/ErrorAlert'
import { useMutation } from '@tanstack/react-query'
import * as toolsApi from '../api/tools'

export default function ValueExtractorPage() {
  const [inputText, setInputText] = useState('')
  const [pattern, setPattern] = useState('')
  const [results, setResults] = useState<string[]>([])
  const [resultCount, setResultCount] = useState(0)
  const [mutationError, setMutationError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const extractMutation = useMutation({
    mutationFn: toolsApi.extractValues,
    onSuccess: (response) => {
      setResults(response.data.values)
      setResultCount(response.data.count)
      setMutationError('')
    },
    onError: (err) => {
      setMutationError(err instanceof Error ? err.message : 'Extraction failed')
    }
  })

  const handleExtract = () => {
    if (!inputText.trim()) {
      setMutationError('Please enter text to extract from')
      return
    }
    if (!pattern.trim()) {
      setMutationError('Please enter a regex pattern')
      return
    }

    setMutationError('')
    extractMutation.mutate({ text: inputText, pattern })
  }

  const copyResults = async () => {
    try {
      await navigator.clipboard.writeText(results.join('\n'))
      setSuccessMessage('Results copied to clipboard!')
      setTimeout(() => setSuccessMessage(''), 2000)
    } catch (err) {
      setMutationError('Failed to copy results')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Value Extractor</h1>
        <p className="mt-2 text-sm text-gray-600">
          Extract values from text using regex patterns
        </p>
      </div>

      {mutationError && <ErrorAlert message={mutationError} onClose={() => setMutationError('')} />}
      {successMessage && (
        <div className="mb-4 rounded-lg bg-green-50 p-4">
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Input</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text to Extract From
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your text here..."
                rows={12}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Regex Pattern
              </label>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="e.g., [a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter a JavaScript-compatible regular expression
              </p>
            </div>

            <button
              onClick={handleExtract}
              disabled={extractMutation.isPending || !inputText.trim() || !pattern.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
              {extractMutation.isPending ? 'Extracting...' : 'Extract Values'}
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Results</h2>
              {resultCount > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  Found {resultCount} value{resultCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            {results.length > 0 && (
              <button
                onClick={copyResults}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                <DocumentDuplicateIcon className="h-4 w-4" />
                Copy All
              </button>
            )}
          </div>

          {results.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <MagnifyingGlassIcon className="mx-auto h-12 w-12 mb-3" />
                <p className="text-sm">No results yet</p>
                <p className="text-xs mt-1">Enter text and pattern to extract values</p>
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg">
              <div className="max-h-96 overflow-y-auto">
                <ul className="divide-y divide-gray-200">
                  {results.map((value, index) => (
                    <li
                      key={index}
                      className="px-4 py-2 hover:bg-gray-50 text-sm font-mono text-gray-900"
                    >
                      {value}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Common Patterns Reference */}
      <div className="mt-6 bg-gray-50 rounded-lg p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Common Patterns</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="font-medium text-gray-700">Email:</span>
            <code className="ml-2 text-gray-600">{'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'}</code>
          </div>
          <div>
            <span className="font-medium text-gray-700">URL:</span>
            <code className="ml-2 text-gray-600">{'https?://[^\\s]+'}</code>
          </div>
          <div>
            <span className="font-medium text-gray-700">Phone (US):</span>
            <code className="ml-2 text-gray-600">{'\\d{3}-\\d{3}-\\d{4}'}</code>
          </div>
          <div>
            <span className="font-medium text-gray-700">IPv4:</span>
            <code className="ml-2 text-gray-600">{'\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b'}</code>
          </div>
        </div>
      </div>
    </div>
  )
}
