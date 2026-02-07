import { useState, useEffect } from 'react'
import { useSettings, useUpdateSettings } from '../hooks/useSettings'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorAlert from '../components/ui/ErrorAlert'

export default function SettingsPage() {
  const { data, isLoading, error } = useSettings()
  const updateMutation = useUpdateSettings()

  const [form, setForm] = useState({ admin_email: '', default_domain: '', default_num_records: '100' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (data?.data) {
      setForm({
        admin_email: data.data.admin_email || '',
        default_domain: data.data.default_domain || '',
        default_num_records: data.data.default_num_records || '100',
      })
    }
  }, [data])

  const handleSave = () => {
    updateMutation.mutate(form, {
      onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000) },
    })
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error.message} />

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
          <input
            type="email"
            value={form.admin_email}
            onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
            placeholder="admin@yourdomain.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-1">Google Workspace admin email for user creation/deletion operations.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Default Domain</label>
          <input
            type="text"
            value={form.default_domain}
            onChange={(e) => setForm({ ...form, default_domain: e.target.value })}
            placeholder="example.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-1">Default domain for generating user emails.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Default Number of Records</label>
          <input
            type="number"
            value={form.default_num_records}
            onChange={(e) => setForm({ ...form, default_num_records: e.target.value })}
            min={1}
            max={10000}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-1">Default number of users to generate.</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
          </button>
          {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
        </div>
      </div>
    </div>
  )
}
