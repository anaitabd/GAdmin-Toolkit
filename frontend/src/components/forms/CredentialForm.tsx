import { useState, type FormEvent } from 'react'
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    try {
      const parsed = JSON.parse(credJson)
      setJsonError('')
      onSubmit({ name, cred_json: parsed, active })
    } catch {
      setJsonError('Invalid JSON format')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Credential Name *</label>
        <input type="text" required value={name} onChange={e => setName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Credential JSON *</label>
        <textarea required value={credJson} onChange={e => { setCredJson(e.target.value); setJsonError('') }}
          rows={8}
          className={`w-full rounded-lg border px-3 py-2 text-sm font-mono focus:ring-1 ${
            jsonError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
          }`} />
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
