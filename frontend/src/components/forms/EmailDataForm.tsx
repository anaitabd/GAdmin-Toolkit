import { useState, type FormEvent } from 'react'
import type { EmailData } from '../../api/types'

interface EmailDataFormProps {
  initialData?: EmailData | null
  onSubmit: (data: Omit<EmailData, 'id' | 'created_at'>) => void
  onCancel: () => void
}

export default function EmailDataForm({ initialData, onSubmit, onCancel }: EmailDataFormProps) {
  const [toEmail, setToEmail] = useState(initialData?.to_email ?? '')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({ to_email: toEmail })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">To Email *</label>
        <input type="email" required value={toEmail} onChange={e => setToEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
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
