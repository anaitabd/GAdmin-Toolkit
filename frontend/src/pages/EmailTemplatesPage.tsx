import { useState } from 'react'
import type { EmailTemplate } from '../api/types'
import { useEmailTemplates, useCreateEmailTemplate, useUpdateEmailTemplate, useDeleteEmailTemplate } from '../hooks/useEmailTemplates'
import DataTable from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ErrorAlert from '../components/ui/ErrorAlert'
import StatusBadge from '../components/ui/StatusBadge'
import EmailTemplateForm from '../components/forms/EmailTemplateForm'
import { EyeIcon } from '@heroicons/react/24/outline'

export default function EmailTemplatesPage() {
  const { data, isLoading, error } = useEmailTemplates()
  const createMutation = useCreateEmailTemplate()
  const updateMutation = useUpdateEmailTemplate()
  const deleteMutation = useDeleteEmailTemplate()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<EmailTemplate | null>(null)
  const [deleteItem, setDeleteItem] = useState<EmailTemplate | null>(null)
  const [previewItem, setPreviewItem] = useState<EmailTemplate | null>(null)

  const columns: Column<EmailTemplate>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Name' },
    { key: 'active', header: 'Status', render: (t) => <StatusBadge active={t.active} /> },
    { key: 'created_at', header: 'Created At', render: (t) => new Date(t.created_at).toLocaleDateString() },
    {
      key: 'preview', header: 'Preview', render: (t) => (
        <button onClick={(e) => { e.stopPropagation(); setPreviewItem(t) }}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-600">
          <EyeIcon className="h-4 w-4" />
        </button>
      )
    },
  ]

  const openCreate = () => { setEditingItem(null); setModalOpen(true) }
  const openEdit = (item: EmailTemplate) => { setEditingItem(item); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditingItem(null) }

  const handleSubmit = (formData: Omit<EmailTemplate, 'id' | 'created_at'>) => {
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
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          {data?.count != null && (
            <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {data.count}
            </span>
          )}
        </div>
        <button onClick={openCreate}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
          Add Template
        </button>
      </div>

      <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading}
        onEdit={openEdit} onDelete={setDeleteItem} />

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingItem ? 'Edit Template' : 'Add Template'}>
        <EmailTemplateForm initialData={editingItem} onSubmit={handleSubmit} onCancel={closeModal} />
      </Modal>

      <Modal isOpen={!!previewItem} onClose={() => setPreviewItem(null)} title={`Preview: ${previewItem?.name ?? ''}`}>
        <iframe srcDoc={previewItem?.html_content ?? ''} sandbox="" className="w-full h-96 border border-gray-200 rounded-lg" title="Template Preview" />
      </Modal>

      <ConfirmDialog isOpen={!!deleteItem} onClose={() => setDeleteItem(null)}
        onConfirm={() => deleteItem && deleteMutation.mutate(deleteItem.id)} />
    </div>
  )
}
