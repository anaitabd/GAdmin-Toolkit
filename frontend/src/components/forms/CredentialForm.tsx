import { useState, useRef, type FormEvent, type DragEvent } from 'react'
import { ArrowUpTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import type { Credential } from '../../api/types'

interface CredentialFormProps {
  initialData?: Credential | null
  onSubmit: (data: Omit<Credential, 'id' | 'created_at' | 'updated_at'>) => void
  onCancel: () => void
}

export default function CredentialForm({ initialData, onSubmit, onCancel }: CredentialFormProps) {
  const [name, setName] = useState(initialData?.name ?? '')
  const [credJson, setCredJson] = useState(
    initialData?.cred_json ? JSON.stringify(initialData.cred_json, null, 2) : ''
  )
  const [active, setActive] = useState(initialData?.active ?? true)
  const [jsonError, setJsonError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processJsonFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      try {
        const parsed = JSON.parse(text)
        setCredJson(JSON.stringify(parsed, null, 2))
        setJsonError('')
        setFileName(file.name)
        // Auto-fill name from project_id or client_email or filename
        if (!name) {
          const autoName = parsed.project_id || parsed.client_email?.split('@')[0] || file.name.replace('.json', '')
          setName(autoName)
        }
      } catch {
        setJsonError('The file does not contain valid JSON')
      }
    }
    reader.readAsText(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processJsonFile(file)
  }

  const handleDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e: DragEvent) => { e.preventDefault(); setIsDragging(false) }
  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.name.endsWith('.json')) {
      processJsonFile(file)
    } else {
      setJsonError('Please drop a .json file')
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    try {
      const parsed = JSON.parse(credJson)
      setJsonError('')
      onSubmit({ name, domain: null, cred_json: parsed, active })
    } catch {
      setJsonError('Invalid JSON format')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Credential Name *</label>
        <input type="text" required value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. my-project-service-account"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
      </div>

      {/* File upload zone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Service Account JSON *</label>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />

        {!credJson ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
            }`}
          >
            <ArrowUpTrayIcon className="h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-600">
              <span className="font-medium text-indigo-600">Upload a JSON file</span> or drag and drop
            </p>
            <p className="text-xs text-gray-400">Google Service Account .json file</p>
          </div>
        ) : (
          <div className="space-y-2">
            {fileName && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                <DocumentTextIcon className="h-5 w-5 text-green-600 shrink-0" />
                <span className="text-sm text-green-800 font-medium truncate">{fileName}</span>
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="ml-auto text-xs text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap">
                  Replace file
                </button>
              </div>
            )}
            <details className="group">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 select-none">
                {fileName ? 'Show / edit JSON' : 'Edit JSON manually'}
              </summary>
              <textarea value={credJson} onChange={e => { setCredJson(e.target.value); setJsonError(''); setFileName('') }}
                rows={8}
                className={`mt-2 w-full rounded-lg border px-3 py-2 text-xs font-mono focus:ring-1 ${
                  jsonError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`} />
            </details>
            {!fileName && (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                Or upload a JSON file instead
              </button>
            )}
          </div>
        )}
        {jsonError && <p className="text-xs text-red-600 mt-1">{jsonError}</p>}
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="cred-active" checked={active} onChange={e => setActive(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        <label htmlFor="cred-active" className="text-sm font-medium text-gray-700">Active</label>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">
          Cancel
        </button>
        <button type="submit"
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
          {initialData ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}
