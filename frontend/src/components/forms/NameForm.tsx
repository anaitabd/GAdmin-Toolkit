import { useState, type FormEvent } from 'react'
import type { Name } from '../../api/types'

interface NameFormProps {
  initialData?: Name | null
  onSubmit: (data: Omit<Name, 'id' | 'created_at'>) => void
  onCancel: () => void
}

export default function NameForm({ initialData, onSubmit, onCancel }: NameFormProps) {
  const [givenName, setGivenName] = useState(initialData?.given_name ?? '')
  const [familyName, setFamilyName] = useState(initialData?.family_name ?? '')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({ given_name: givenName, family_name: familyName })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Given Name *</label>
        <input type="text" required value={givenName} onChange={e => setGivenName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Family Name *</label>
        <input type="text" required value={familyName} onChange={e => setFamilyName(e.target.value)}
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
