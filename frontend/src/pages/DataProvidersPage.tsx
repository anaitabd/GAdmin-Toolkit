import { useState } from 'react'
import type { DataProvider } from '../api/types'
import { MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline'
import DataTable from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ErrorAlert from '../components/ui/ErrorAlert'
import Pagination from '../components/ui/Pagination'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as dataProvidersApi from '../api/dataProviders'

const columns: Column<DataProvider>[] = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
  { key: 'contact_email', header: 'Contact Email' },
  { key: 'contact_phone', header: 'Contact Phone' },
  { key: 'status', header: 'Status', render: (item) => (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
      item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
    }`}>
      {item.status}
    </span>
  )},
  { key: 'created_at', header: 'Created At', render: (item) => new Date(item.created_at).toLocaleDateString() },
]

function DataProviderForm({ initial, onSubmit, onCancel, isPending }: {
  initial?: DataProvider | null
  onSubmit: (data: any) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [contactEmail, setContactEmail] = useState(initial?.contact_email ?? '')
  const [contactPhone, setContactPhone] = useState(initial?.contact_phone ?? '')
  const [apiEndpoint, setApiEndpoint] = useState(initial?.api_endpoint ?? '')
  const [status, setStatus] = useState(initial?.status ?? 'active')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const canSubmit = name.trim() && !isPending

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Provider name"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Provider description"
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
          <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
          <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)}
            placeholder="+1 555 1234"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoint</label>
        <input type="url" value={apiEndpoint} onChange={e => setApiEndpoint(e.target.value)}
          placeholder="https://api.provider.com"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Additional notes"
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button type="button" onClick={onCancel} disabled={isPending}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50">
          Cancel
        </button>
        <button type="button" onClick={() => onSubmit({
          name, description: description || undefined, contact_email: contactEmail || undefined,
          contact_phone: contactPhone || undefined, api_endpoint: apiEndpoint || undefined,
          status, notes: notes || undefined
        })} disabled={!canSubmit}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
          {isPending ? 'Saving...' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </div>
  )
}

export default function DataProvidersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const limit = 50

  const { data, isLoading, error } = useQuery({
    queryKey: ['data-providers', { search: search || undefined, status: statusFilter || undefined, limit, offset }],
    queryFn: () => dataProvidersApi.getAll({ search: search || undefined, status: statusFilter || undefined, limit, offset })
  })

  const createMutation = useMutation({
    mutationFn: dataProvidersApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['data-providers'] })
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => dataProvidersApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['data-providers'] })
  })

  const deleteMutation = useMutation({
    mutationFn: dataProvidersApi.deleteById,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['data-providers'] })
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<DataProvider | null>(null)
  const [deleteItem, setDeleteItem] = useState<DataProvider | null>(null)
  const [mutationError, setMutationError] = useState('')

  const openCreate = () => { setEditingItem(null); setModalOpen(true) }
  const openEdit = (item: DataProvider) => { setEditingItem(item); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditingItem(null); setMutationError('') }

  const handleSubmit = (formData: any) => {
    setMutationError('')
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData }, {
        onSuccess: closeModal,
        onError: (err) => setMutationError(err instanceof Error ? err.message : 'Update failed'),
      })
    } else {
      createMutation.mutate(formData, {
        onSuccess: closeModal,
        onError: (err) => setMutationError(err instanceof Error ? err.message : 'Create failed'),
      })
    }
  }

  const handleDelete = () => {
    if (!deleteItem) return
    setMutationError('')
    deleteMutation.mutate(deleteItem.id, {
      onSuccess: () => setDeleteItem(null),
      onError: (err) => {
        setDeleteItem(null)
        setMutationError(err instanceof Error ? err.message : 'Delete failed')
      },
    })
  }

  if (error) return <ErrorAlert message={error.message} />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Data Providers</h1>
          {data?.count != null && (
            <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {data.count}
            </span>
          )}
        </div>
        <button onClick={openCreate}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
          Add Provider
        </button>
      </div>

      {mutationError && <ErrorAlert message={mutationError} onClose={() => setMutationError('')} />}

      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" value={search}
            onChange={(e) => { setSearch(e.target.value); setOffset(0) }}
            placeholder="Search providers..."
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setOffset(0) }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={setDeleteItem}
      />

      {data && data.count > limit && (
        <Pagination
          offset={offset}
          limit={limit}
          total={data.count}
          onPageChange={setOffset}
        />
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingItem ? 'Edit Data Provider' : 'Add Data Provider'}>
        <DataProviderForm
          initial={editingItem}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isPending={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteItem}
        title="Delete Data Provider"
        message={`Are you sure you want to delete "${deleteItem?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
