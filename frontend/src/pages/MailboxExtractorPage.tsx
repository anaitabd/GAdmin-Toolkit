import { useState } from 'react'
import ErrorAlert from '../components/ui/ErrorAlert'
import { useQuery } from '@tanstack/react-query'
import * as toolsApi from '../api/tools'

export default function MailboxExtractorPage() {
  const [server, setServer] = useState('')
  const [port, setPort] = useState('993')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [folder, setFolder] = useState('INBOX')
  const [result, setResult] = useState<any>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState('')

  const handleExtract = async () => {
    if (!server || !username || !password) {
      setError('Server, username, and password are required')
      return
    }

    setIsExtracting(true)
    setError('')
    setResult(null)

    try {
      const data = await toolsApi.extractFromMailbox({
        server,
        port: parseInt(port),
        username,
        password,
        folder: folder || 'INBOX'
      })
      setResult(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleDownload = () => {
    if (!result?.emails) return

    const content = result.emails.join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `extracted-emails-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mailbox Extractor</h1>
        <p className="mt-1 text-sm text-gray-600">Extract email addresses from mailboxes</p>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError('')} />}

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mail Server *</label>
              <input type="text" value={server} onChange={e => setServer(e.target.value)}
                placeholder="imap.example.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Port *</label>
              <input type="number" value={port} onChange={e => setPort(e.target.value)}
                placeholder="993"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="user@example.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Folder</label>
            <input type="text" value={folder} onChange={e => setFolder(e.target.value)}
              placeholder="INBOX"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
          </div>

          <button 
            onClick={handleExtract}
            disabled={isExtracting || !server || !username || !password}
            className="w-full rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
            {isExtracting ? 'Extracting...' : 'Extract Emails'}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Results ({result.count || 0} emails found)
            </h2>
            <button 
              onClick={handleDownload}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700">
              Download
            </button>
          </div>
          <div className="p-6">
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-900 font-mono whitespace-pre-wrap">
                {result.emails?.join('\n') || 'No emails found'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
