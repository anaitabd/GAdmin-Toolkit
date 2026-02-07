import { useState } from 'react'
import type { EmailInfo } from '../api/types'
import { useEmailInfo, useCreateEmailInfo, useUpdateEmailInfo, useDeleteEmailInfo } from '../hooks/useEmailInfo'
import DataTable from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ErrorAlert from '../components/ui/ErrorAlert'
import StatusBadge from '../components/ui/StatusBadge'
import EmailInfoForm from '../components/forms/EmailInfoForm'

const columns: Column<EmailInfo>[] = [
  { key: 'id', header: 'ID' },
  { key: 'from_name', header: 'From Name' },
  { key: 'subject', header: 'Subject' },
  { key: 'active', header: 'Status', render: (i) => <StatusBadge active={i.active} /> },
  { key: 'created_at', header: 'Created At', render: (i) => new Date(i.created_at).toLocaleDateString() },
]

export default function EmailInfoPage() {
  const { data, isLoading, error } = useEmailInfo()
  const createMutation = useCreateEmailInfo()
  const updateMutation = useUpdateEmailInfo()
  const deleteMutation = useDeleteEmailInfo()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<EmailInfo | null>(null)
  const [deleteItem, setDeleteItem] = useState<EmailInfo | null>(null)

  const openCreate = () => { setEditingItem(null); setModalOpen(true) }
  const openEdit = (item: EmailInfo) => { setEditingItem(item); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditingItem(null) }

  const handleSubmit = (formData: Omit<EmailInfo, 'id' | 'created_at'>) => {
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
          <h1 className="text-2xl font-bold text-gray-900">Email Info</h1>
          {data?.count != null && (
            <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {data.count}
            </span>
          )}
        </div>
        <button onClick={openCreate}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
          Add Email Info
        </button>
      </div>

      <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading}
        onEdit={openEdit} onDelete={setDeleteItem} />

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingItem ? 'Edit Email Info' : 'Add Email Info'}>
        <EmailInfoForm initialData={editingItem} onSubmit={handleSubmit} onCancel={closeModal} />
      </Modal>

      <ConfirmDialog isOpen={!!deleteItem} onClose={() => setDeleteItem(null)}
        onConfirm={() => deleteItem && deleteMutation.mutate(deleteItem.id)} />
    </div>
  )
}
