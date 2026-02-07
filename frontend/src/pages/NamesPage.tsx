import { useState } from 'react'
import type { Name } from '../api/types'
import { useNames, useCreateName, useUpdateName, useDeleteName } from '../hooks/useNames'
import DataTable from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ErrorAlert from '../components/ui/ErrorAlert'
import NameForm from '../components/forms/NameForm'

const columns: Column<Name>[] = [
  { key: 'id', header: 'ID' },
  { key: 'given_name', header: 'Given Name' },
  { key: 'family_name', header: 'Family Name' },
  { key: 'created_at', header: 'Created At', render: (n) => new Date(n.created_at).toLocaleDateString() },
]

export default function NamesPage() {
  const { data, isLoading, error } = useNames()
  const createMutation = useCreateName()
  const updateMutation = useUpdateName()
  const deleteMutation = useDeleteName()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Name | null>(null)
  const [deleteItem, setDeleteItem] = useState<Name | null>(null)

  const openCreate = () => { setEditingItem(null); setModalOpen(true) }
  const openEdit = (item: Name) => { setEditingItem(item); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditingItem(null) }

  const handleSubmit = (formData: Omit<Name, 'id' | 'created_at'>) => {
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
          <h1 className="text-2xl font-bold text-gray-900">Names</h1>
          {data?.count != null && (
            <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {data.count}
            </span>
          )}
        </div>
        <button onClick={openCreate}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
          Add Name
        </button>
      </div>

      <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading}
        onEdit={openEdit} onDelete={setDeleteItem} />

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingItem ? 'Edit Name' : 'Add Name'}>
        <NameForm initialData={editingItem} onSubmit={handleSubmit} onCancel={closeModal} />
      </Modal>

      <ConfirmDialog isOpen={!!deleteItem} onClose={() => setDeleteItem(null)}
        onConfirm={() => deleteItem && deleteMutation.mutate(deleteItem.id)} />
    </div>
  )
}
