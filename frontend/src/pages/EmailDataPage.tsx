import { useState } from 'react'
import type { EmailData } from '../api/types'
import { useEmailData, useCreateEmailData, useUpdateEmailData, useDeleteEmailData, useEmailDataGeos, useBulkDeleteEmailData, useDeleteAllEmailData } from '../hooks/useEmailData'
import { useBulkEmails } from '../hooks/useJobs'
import DataTable from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ErrorAlert from '../components/ui/ErrorAlert'
import Pagination from '../components/ui/Pagination'
import EmailDataForm from '../components/forms/EmailDataForm'
import BulkUploadDialog from '../components/ui/BulkUploadDialog'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

const columns: Column<EmailData>[] = [
  { key: 'id', header: 'ID' },
  { key: 'to_email', header: 'To Email' },
  { key: 'geo', header: 'Geo', render: (d) => d.geo || '—' },
  { key: 'list_name', header: 'List Name', render: (d) => d.list_name || '—' },
  { key: 'created_at', header: 'Created At', render: (d) => new Date(d.created_at).toLocaleDateString() },
]

export default function EmailDataPage() {
  const [search, setSearch] = useState('')
  const [geoFilter, setGeoFilter] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = 50

  const { data, isLoading, error } = useEmailData({ search: search || undefined, geo: geoFilter || undefined, limit, offset })
  const { data: geosData } = useEmailDataGeos()
  const geos = geosData?.data ?? []

  const createMutation = useCreateEmailData()
  const updateMutation = useUpdateEmailData()
  const deleteMutation = useDeleteEmailData()
  const bulkDeleteMutation = useBulkDeleteEmailData()
  const deleteAllMutation = useDeleteAllEmailData()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<EmailData | null>(null)
  const [deleteItem, setDeleteItem] = useState<EmailData | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [mutationError, setMutationError] = useState('')
  const bulkMutation = useBulkEmails()

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const [importGeo, setImportGeo] = useState('')
  const [importListName, setImportListName] = useState('')

  const openCreate = () => { setEditingItem(null); setModalOpen(true) }
  const openEdit = (item: EmailData) => { setEditingItem(item); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditingItem(null) }

  const handleSubmit = (formData: Omit<EmailData, 'id' | 'created_at'>) => {
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

  if (error) return <ErrorAlert message={error.message} />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Email Data</h1>
          {data?.count != null && (
            <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {data.count}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {(data?.count ?? 0) > 0 && (
            <button onClick={() => setConfirmDeleteAll(true)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 border border-red-300 hover:bg-red-50">
              Delete All
            </button>
          )}
          <button onClick={() => setBulkOpen(true)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-600 hover:bg-indigo-50">
            Import List
          </button>
          <button onClick={openCreate}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
            Add Email
          </button>
        </div>
      </div>

      {/* Selection bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-2">
          <span className="text-sm font-medium text-indigo-800">{selectedIds.size} selected</span>
          <button onClick={() => setConfirmBulkDelete(true)}
            className="rounded-lg px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200">
            Delete Selected
          </button>
          <button onClick={() => setSelectedIds(new Set())}
            className="rounded-lg px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200">
            Clear
          </button>
        </div>
      )}

      <div className="mb-4 flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" value={search}
            onChange={(e) => { setSearch(e.target.value); setOffset(0) }}
            placeholder="Search emails..."
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
        </div>
        {geos.length > 0 && (
          <select
            value={geoFilter}
            onChange={(e) => { setGeoFilter(e.target.value); setOffset(0) }}
            title="Filter by geo region"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Geos</option>
            {geos.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        )}
      </div>

      {mutationError && <div className="mb-4"><ErrorAlert message={mutationError} /></div>}

      <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading}
        onEdit={openEdit} onDelete={setDeleteItem}
        selectedIds={selectedIds} onSelectionChange={setSelectedIds} />

      {data?.count != null && (
        <Pagination offset={offset} limit={limit} total={data.count} onChange={setOffset} />
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingItem ? 'Edit Email Data' : 'Add Email Data'}>
        <EmailDataForm initialData={editingItem} onSubmit={handleSubmit} onCancel={closeModal} />
      </Modal>

      <ConfirmDialog isOpen={!!deleteItem} onClose={() => setDeleteItem(null)}
        onConfirm={() => {
          if (!deleteItem) return
          deleteMutation.mutate(deleteItem.id, {
            onSuccess: () => setDeleteItem(null),
            onError: (err) => { setDeleteItem(null); setMutationError(err instanceof Error ? err.message : 'Delete failed') },
          })
        }}
        isLoading={deleteMutation.isPending}
      />

      {/* Bulk Delete confirm */}
      <ConfirmDialog
        isOpen={confirmBulkDelete}
        onClose={() => setConfirmBulkDelete(false)}
        onConfirm={() => {
          bulkDeleteMutation.mutate([...selectedIds], {
            onSuccess: () => { setSelectedIds(new Set()); setConfirmBulkDelete(false) },
            onError: (err) => { setConfirmBulkDelete(false); setMutationError(err instanceof Error ? err.message : 'Bulk delete failed') },
          })
        }}
        isLoading={bulkDeleteMutation.isPending}
        title="Delete Selected"
        message={`Delete ${selectedIds.size} selected email(s)?`}
      />

      {/* Delete All confirm */}
      <ConfirmDialog
        isOpen={confirmDeleteAll}
        onClose={() => setConfirmDeleteAll(false)}
        onConfirm={() => {
          deleteAllMutation.mutate(undefined, {
            onSuccess: () => { setSelectedIds(new Set()); setConfirmDeleteAll(false) },
            onError: (err) => { setConfirmDeleteAll(false); setMutationError(err instanceof Error ? err.message : 'Delete all failed') },
          })
        }}
        isLoading={deleteAllMutation.isPending}
        title="Delete All Email Data"
        message={`This will permanently delete ALL ${data?.count ?? 0} email records. Are you sure?`}
      />

      <BulkUploadDialog
        isOpen={bulkOpen}
        onClose={() => { setBulkOpen(false); bulkMutation.reset(); setImportGeo(''); setImportListName('') }}
        title="Import Emails"
        description="Upload a CSV file with emails or paste email addresses (one per line)"
        columns={['to_email']}
        renderExtra={() => (
          <div className="space-y-3">
            <div>
              <label htmlFor="import-geo" className="block text-sm font-medium text-gray-700 mb-1">Geo (applied to all)</label>
              <input
                id="import-geo"
                type="text"
                value={importGeo}
                onChange={(e) => setImportGeo(e.target.value)}
                placeholder="e.g. US, FR, DE..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="import-list-name" className="block text-sm font-medium text-gray-700 mb-1">List Name (applied to all)</label>
              <input
                id="import-list-name"
                type="text"
                value={importListName}
                onChange={(e) => setImportListName(e.target.value)}
                placeholder="e.g. Campaign Q1, US Leads..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}
        onUpload={(rows) => {
          const geo = importGeo.trim() || undefined
          const list_name = importListName.trim() || undefined
          const emails = rows
            .filter(r => r.to_email?.includes('@'))
            .map(r => ({ to_email: r.to_email, geo, list_name }))
          bulkMutation.mutate(emails)
        }}
        isLoading={bulkMutation.isPending}
        result={bulkMutation.data as { inserted?: number; skipped?: number } | null}
        error={bulkMutation.error ? ((bulkMutation.error as any)?.response?.data?.error || bulkMutation.error.message) : null}
      />
    </div>
  )
}
