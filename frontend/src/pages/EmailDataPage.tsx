import { useState } from 'react'
import type { EmailData } from '../api/types'
import { useEmailData, useCreateEmailData, useUpdateEmailData, useDeleteEmailData } from '../hooks/useEmailData'
import DataTable from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ErrorAlert from '../components/ui/ErrorAlert'
import EmailDataForm from '../components/forms/EmailDataForm'

const columns: Column<EmailData>[] = [
  { key: 'id', header: 'ID' },
  { key: 'to_email', header: 'To Email' },
  { key: 'created_at', header: 'Created At', render: (d) => new Date(d.created_at).toLocaleDateString() },
]

export default function EmailDataPage() {
  const { data, isLoading, error } = useEmailData()
  const createMutation = useCreateEmailData()
  const updateMutation = useUpdateEmailData()
  const deleteMutation = useDeleteEmailData()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<EmailData | null>(null)
  const [deleteItem, setDeleteItem] = useState<EmailData | null>(null)

  const openCreate = () => { setEditingItem(null); setModalOpen(true) }
  const openEdit = (item: EmailData) => { setEditingItem(item); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditingItem(null) }

  const handleSubmit = (formData: Omit<EmailData, 'id' | 'created_at'>) => {
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
          <h1 className="text-2xl font-bold text-gray-900">Email Data</h1>
          {data?.count != null && (
            <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {data.count}
            </span>
          )}
        </div>
        <button onClick={openCreate}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
          Add Email
        </button>
      </div>

      <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading}
        onEdit={openEdit} onDelete={setDeleteItem} />

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingItem ? 'Edit Email Data' : 'Add Email Data'}>
        <EmailDataForm initialData={editingItem} onSubmit={handleSubmit} onCancel={closeModal} />
      </Modal>

      <ConfirmDialog isOpen={!!deleteItem} onClose={() => setDeleteItem(null)}
        onConfirm={() => deleteItem && deleteMutation.mutate(deleteItem.id)} />
    </div>
  )
}
