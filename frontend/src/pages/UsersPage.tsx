import { useState } from 'react'
import type { User } from '../api/types'
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../hooks/useUsers'
import { useBulkUsers } from '../hooks/useJobs'
import DataTable from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ErrorAlert from '../components/ui/ErrorAlert'
import Pagination from '../components/ui/Pagination'
import UserForm from '../components/forms/UserForm'
import BulkUploadDialog from '../components/ui/BulkUploadDialog'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

const columns: Column<User>[] = [
  { key: 'id', header: 'ID' },
  { key: 'email', header: 'Email' },
  { key: 'given_name', header: 'Given Name' },
  { key: 'family_name', header: 'Family Name' },
  { key: 'created_at', header: 'Created At', render: (u) => new Date(u.created_at).toLocaleDateString() },
]

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = 50

  const { data, isLoading, error } = useUsers({ search: search || undefined, limit, offset })
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()
  const deleteMutation = useDeleteUser()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<User | null>(null)
  const [deleteItem, setDeleteItem] = useState<User | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [mutationError, setMutationError] = useState('')
  const bulkMutation = useBulkUsers()

  const openCreate = () => { setEditingItem(null); setModalOpen(true) }
  const openEdit = (item: User) => { setEditingItem(item); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditingItem(null) }

  const handleSubmit = (formData: Omit<User, 'id' | 'created_at'>) => {
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
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          {data?.count != null && (
            <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {data.count}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setBulkOpen(true)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-600 hover:bg-indigo-50">
            Import CSV
          </button>
          <button onClick={openCreate}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
            Add User
          </button>
        </div>
      </div>

      <div className="mb-4 relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input type="text" value={search}
          onChange={(e) => { setSearch(e.target.value); setOffset(0) }}
          placeholder="Search by email or name..."
          className="w-full max-w-sm rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
      </div>

      {mutationError && <div className="mb-4"><ErrorAlert message={mutationError} /></div>}

      <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading}
        onEdit={openEdit} onDelete={setDeleteItem} />

      {data?.count != null && (
        <Pagination offset={offset} limit={limit} total={data.count} onChange={setOffset} />
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingItem ? 'Edit User' : 'Add User'}>
        <UserForm initialData={editingItem} onSubmit={handleSubmit} onCancel={closeModal} />
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

      <BulkUploadDialog
        isOpen={bulkOpen}
        onClose={() => { setBulkOpen(false); bulkMutation.reset() }}
        title="Import Users CSV"
        description="Upload a CSV with columns: email, given_name, family_name"
        columns={['email', 'given_name', 'family_name']}
        onUpload={(rows) => bulkMutation.mutate(rows as { email: string; given_name: string; family_name: string }[])}
        isLoading={bulkMutation.isPending}
        result={bulkMutation.data as { inserted?: number; skipped?: number } | null}
        error={bulkMutation.error ? ((bulkMutation.error as any)?.response?.data?.error || bulkMutation.error.message) : null}
      />
    </div>
  )
}
