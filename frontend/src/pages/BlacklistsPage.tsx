import { useState } from 'react'
import type { Blacklist, BlacklistEmail } from '../api/types'
import { MagnifyingGlassIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import DataTable from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ErrorAlert from '../components/ui/ErrorAlert'
import Pagination from '../components/ui/Pagination'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as blacklistsApi from '../api/blacklists'

const blacklistColumns: Column<Blacklist>[] = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
  { key: 'status', header: 'Status', render: (item) => (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
      item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
    }`}>
      {item.status}
    </span>
  )},
  { key: 'created_at', header: 'Created At', render: (item) => new Date(item.created_at).toLocaleDateString() },
]

const emailColumns: Column<BlacklistEmail>[] = [
  { key: 'id', header: 'ID' },
  { key: 'email', header: 'Email' },
  { key: 'created_at', header: 'Added At', render: (item) => new Date(item.created_at).toLocaleDateString() },
]

function BlacklistForm({ initial, onSubmit, onCancel, isPending }: {
  initial?: Blacklist | null
  onSubmit: (data: any) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [status, setStatus] = useState(initial?.status ?? 'active')

  const canSubmit = name.trim() && !isPending

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Blacklist name"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Blacklist description"
          rows={2}
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

      <div className="flex justify-end gap-2 pt-4">
        <button type="button" onClick={onCancel} disabled={isPending}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50">
          Cancel
        </button>
        <button type="button" onClick={() => onSubmit({
          name, description: description || undefined, status
        })} disabled={!canSubmit}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
          {isPending ? 'Saving...' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </div>
  )
}

function EmailForm({ blacklistId, onSubmit, onCancel, isPending }: {
  blacklistId: number
  onSubmit: (data: any) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [email, setEmail] = useState('')
  const [bulkEmails, setBulkEmails] = useState('')

  const canSubmit = (email.trim() || bulkEmails.trim()) && !isPending

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Single Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="email@example.com"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
      </div>

      <div className="text-center text-sm text-gray-500">OR</div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bulk Import (one email per line)</label>
        <textarea value={bulkEmails} onChange={e => setBulkEmails(e.target.value)}
          placeholder="email1@example.com&#10;email2@example.com&#10;email3@example.com"
          rows={8}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono" />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button type="button" onClick={onCancel} disabled={isPending}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50">
          Cancel
        </button>
        <button type="button" onClick={() => {
          if (bulkEmails.trim()) {
            const emails = bulkEmails.split('\n').map(e => e.trim()).filter(e => e)
            onSubmit({ emails })
          } else {
            onSubmit({ email })
          }
        }} disabled={!canSubmit}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
          {isPending ? 'Adding...' : 'Add Email(s)'}
        </button>
      </div>
    </div>
  )
}

export default function BlacklistsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedBlacklist, setSelectedBlacklist] = useState<Blacklist | null>(null)
  const [emailSearch, setEmailSearch] = useState('')
  const [emailOffset, setEmailOffset] = useState(0)
  const limit = 50

  const { data, isLoading, error } = useQuery({
    queryKey: ['blacklists', { search: search || undefined, status: statusFilter || undefined, limit, offset }],
    queryFn: () => blacklistsApi.getAll({ search: search || undefined, status: statusFilter || undefined, limit, offset }),
    enabled: !selectedBlacklist
  })

  const { data: emailsData, isLoading: emailsLoading } = useQuery({
    queryKey: ['blacklist-emails', selectedBlacklist?.id, { search: emailSearch || undefined, limit, offset: emailOffset }],
    queryFn: () => blacklistsApi.getEmails(selectedBlacklist!.id, { search: emailSearch || undefined, limit, offset: emailOffset }),
    enabled: !!selectedBlacklist
  })

  const createMutation = useMutation({
    mutationFn: blacklistsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blacklists'] })
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => blacklistsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blacklists'] })
  })

  const deleteMutation = useMutation({
    mutationFn: blacklistsApi.deleteById,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blacklists'] })
  })

  const addEmailMutation = useMutation({
    mutationFn: ({ blacklistId, data }: { blacklistId: number; data: any }) => 
      data.emails ? blacklistsApi.bulkAddEmails(blacklistId, data.emails) : blacklistsApi.addEmail(blacklistId, data.email),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blacklist-emails'] })
  })

  const deleteEmailMutation = useMutation({
    mutationFn: ({ blacklistId, emailId }: { blacklistId: number; emailId: number }) => 
      blacklistsApi.deleteEmail(blacklistId, emailId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blacklist-emails'] })
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Blacklist | null>(null)
  const [deleteItem, setDeleteItem] = useState<Blacklist | null>(null)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [deleteEmail, setDeleteEmail] = useState<BlacklistEmail | null>(null)
  const [mutationError, setMutationError] = useState('')

  const openCreate = () => { setEditingItem(null); setModalOpen(true) }
  const openEdit = (item: Blacklist) => { setEditingItem(item); setModalOpen(true) }
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

  const handleAddEmail = (formData: any) => {
    if (!selectedBlacklist) return
    setMutationError('')
    addEmailMutation.mutate({ blacklistId: selectedBlacklist.id, data: formData }, {
      onSuccess: () => setEmailModalOpen(false),
      onError: (err) => setMutationError(err instanceof Error ? err.message : 'Add email failed'),
    })
  }

  const handleDeleteEmail = () => {
    if (!selectedBlacklist || !deleteEmail) return
    setMutationError('')
    deleteEmailMutation.mutate({ blacklistId: selectedBlacklist.id, emailId: deleteEmail.id }, {
      onSuccess: () => setDeleteEmail(null),
      onError: (err) => {
        setDeleteEmail(null)
        setMutationError(err instanceof Error ? err.message : 'Delete email failed')
      },
    })
  }

  if (error) return <ErrorAlert message={error.message} />

  if (selectedBlacklist) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => { setSelectedBlacklist(null); setEmailSearch(''); setEmailOffset(0) }}
              className="rounded-lg p-2 hover:bg-gray-100">
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{selectedBlacklist.name} - Emails</h1>
            {emailsData?.count != null && (
              <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                {emailsData.count}
              </span>
            )}
          </div>
          <button onClick={() => setEmailModalOpen(true)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
            Add Email(s)
          </button>
        </div>

        {mutationError && <ErrorAlert message={mutationError} onClose={() => setMutationError('')} />}

        <div className="mb-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" value={emailSearch}
              onChange={(e) => { setEmailSearch(e.target.value); setEmailOffset(0) }}
              placeholder="Search emails..."
              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>
        </div>

        <DataTable
          columns={emailColumns}
          data={emailsData?.data ?? []}
          isLoading={emailsLoading}
          onDelete={setDeleteEmail}
        />

        {emailsData && emailsData.count > limit && (
          <Pagination
            offset={emailOffset}
            limit={limit}
            total={emailsData.count}
            onPageChange={setEmailOffset}
          />
        )}

        <Modal isOpen={emailModalOpen} onClose={() => setEmailModalOpen(false)} title="Add Email(s) to Blacklist">
          <EmailForm
            blacklistId={selectedBlacklist.id}
            onSubmit={handleAddEmail}
            onCancel={() => setEmailModalOpen(false)}
            isPending={addEmailMutation.isPending}
          />
        </Modal>

        <ConfirmDialog
          isOpen={!!deleteEmail}
          title="Delete Email"
          message={`Are you sure you want to delete "${deleteEmail?.email}"? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteEmail}
          onCancel={() => setDeleteEmail(null)}
          isPending={deleteEmailMutation.isPending}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Blacklists</h1>
          {data?.count != null && (
            <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {data.count}
            </span>
          )}
        </div>
        <button onClick={openCreate}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
          Add Blacklist
        </button>
      </div>

      {mutationError && <ErrorAlert message={mutationError} onClose={() => setMutationError('')} />}

      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" value={search}
            onChange={(e) => { setSearch(e.target.value); setOffset(0) }}
            placeholder="Search blacklists..."
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
        columns={blacklistColumns}
        data={data?.data ?? []}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={setDeleteItem}
        onRowClick={setSelectedBlacklist}
      />

      {data && data.count > limit && (
        <Pagination
          offset={offset}
          limit={limit}
          total={data.count}
          onPageChange={setOffset}
        />
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingItem ? 'Edit Blacklist' : 'Add Blacklist'}>
        <BlacklistForm
          initial={editingItem}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isPending={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteItem}
        title="Delete Blacklist"
        message={`Are you sure you want to delete "${deleteItem?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
