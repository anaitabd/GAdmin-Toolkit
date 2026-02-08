import { useState, type FormEvent } from 'react'
import type { EmailData } from '../../api/types'

interface EmailDataFormProps {
  initialData?: EmailData | null
  onSubmit: (data: Omit<EmailData, 'id' | 'created_at'>) => void
  onCancel: () => void
}

export default function EmailDataForm({ initialData, onSubmit, onCancel }: EmailDataFormProps) {
  const [toEmail, setToEmail] = useState(initialData?.to_email ?? '')
  const [geo, setGeo] = useState(initialData?.geo ?? '')
  const [listName, setListName] = useState(initialData?.list_name ?? '')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({ to_email: toEmail, geo: geo.trim() || null, list_name: listName.trim() || null })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email-data-to-email" className="block text-sm font-medium text-gray-700 mb-1">To Email *</label>
        <input id="email-data-to-email" type="email" required value={toEmail} onChange={e => setToEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div>
        <label htmlFor="email-data-geo" className="block text-sm font-medium text-gray-700 mb-1">Geo (Region)</label>
        <input id="email-data-geo" type="text" value={geo} onChange={e => setGeo(e.target.value)}
          placeholder="e.g. US, EU, FR, APAC..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div>
        <label htmlFor="email-data-list-name" className="block text-sm font-medium text-gray-700 mb-1">List Name</label>
        <input id="email-data-list-name" type="text" value={listName} onChange={e => setListName(e.target.value)}
          placeholder="e.g. Campaign Q1, US Leads..."
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
