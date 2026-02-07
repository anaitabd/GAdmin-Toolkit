import { useState, type FormEvent } from 'react'
import type { EmailInfo } from '../../api/types'

interface EmailInfoFormProps {
  initialData?: EmailInfo | null
  onSubmit: (data: Omit<EmailInfo, 'id' | 'created_at'>) => void
  onCancel: () => void
}

export default function EmailInfoForm({ initialData, onSubmit, onCancel }: EmailInfoFormProps) {
  const [fromName, setFromName] = useState(initialData?.from_name ?? '')
  const [subject, setSubject] = useState(initialData?.subject ?? '')
  const [active, setActive] = useState(initialData?.active ?? true)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({ from_name: fromName, subject, active })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">From Name *</label>
        <input type="text" required value={fromName} onChange={e => setFromName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
        <input type="text" required value={subject} onChange={e => setSubject(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="active" checked={active} onChange={e => setActive(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        <label htmlFor="active" className="text-sm font-medium text-gray-700">Active</label>
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
