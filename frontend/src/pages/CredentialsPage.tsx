import { useState } from 'react'
import type { Credential } from '../api/types'
import { useCredentials, useCreateCredential, useUpdateCredential, useDeleteCredential } from '../hooks/useCredentials'
import DataTable from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ErrorAlert from '../components/ui/ErrorAlert'
import StatusBadge from '../components/ui/StatusBadge'
import CredentialForm from '../components/forms/CredentialForm'

const columns: Column<Credential>[] = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
  { key: 'active', header: 'Status', render: (c) => <StatusBadge active={c.active} /> },
  { key: 'created_at', header: 'Created At', render: (c) => new Date(c.created_at).toLocaleDateString() },
  { key: 'updated_at', header: 'Updated At', render: (c) => new Date(c.updated_at).toLocaleDateString() },
]

export default function CredentialsPage() {
  const { data, isLoading, error } = useCredentials()
  const createMutation = useCreateCredential()
  const updateMutation = useUpdateCredential()
  const deleteMutation = useDeleteCredential()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Credential | null>(null)
  const [deleteItem, setDeleteItem] = useState<Credential | null>(null)

  const openCreate = () => { setEditingItem(null); setModalOpen(true) }
  const openEdit = (item: Credential) => { setEditingItem(item); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditingItem(null) }

  const handleSubmit = (formData: Omit<Credential, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData }, { onSuccess: closeModal })
    } else {
      createMutation.mutate(formData, { onSuccess: closeModal })
    }
  }

  if (error) return <ErrorAlert message={error.message} />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Credentials</h1>
          {data?.count != null && (
            <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {data.count}
            </span>
          )}
        </div>
        <button onClick={openCreate}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
          Add Credential
        </button>
      </div>

      <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading}
        onEdit={openEdit} onDelete={setDeleteItem} />

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingItem ? 'Edit Credential' : 'Add Credential'}>
        <CredentialForm initialData={editingItem} onSubmit={handleSubmit} onCancel={closeModal} />
      </Modal>

      <ConfirmDialog isOpen={!!deleteItem} onClose={() => setDeleteItem(null)}
        onConfirm={() => { deleteItem && deleteMutation.mutate(deleteItem.id); setDeleteItem(null) }} />
    </div>
  )
}
