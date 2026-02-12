import { useState } from 'react'
import type { SuppressionEmail, SuppressionProcess, Offer } from '../api/types'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import DataTable from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ErrorAlert from '../components/ui/ErrorAlert'
import Pagination from '../components/ui/Pagination'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as suppressionsApi from '../api/suppressions'
import * as offersApi from '../api/offers'

const emailColumns: Column<SuppressionEmail>[] = [
  { key: 'id', header: 'ID' },
  { key: 'offer_id', header: 'Offer ID' },
  { key: 'email', header: 'Email' },
  { key: 'reason', header: 'Reason' },
  { key: 'created_at', header: 'Created At', render: (item) => new Date(item.created_at).toLocaleDateString() },
]

const processColumns: Column<SuppressionProcess>[] = [
  { key: 'id', header: 'ID' },
  { key: 'offer_id', header: 'Offer ID' },
  { key: 'affiliate_network_id', header: 'Network ID' },
  { key: 'status', header: 'Status', render: (item) => (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
      item.status === 'completed' ? 'bg-green-100 text-green-700' :
      item.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
      item.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
    }`}>
      {item.status}
    </span>
  )},
  { key: 'progress', header: 'Progress', render: (item) => item.progress ? `${item.progress}%` : '-' },
  { key: 'emails_found', header: 'Emails Found' },
  { key: 'started_at', header: 'Started At', render: (item) => new Date(item.started_at).toLocaleDateString() },
]

function EmailForm({ initial, onSubmit, onCancel, isPending }: {
  initial?: SuppressionEmail | null
  onSubmit: (data: any) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [offerId, setOfferId] = useState(initial?.offer_id?.toString() ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [reason, setReason] = useState(initial?.reason ?? '')

  const { data: offers } = useQuery({
    queryKey: ['offers', { limit: 1000 }],
    queryFn: () => offersApi.getAll({ limit: 1000 })
  })

  const canSubmit = offerId && email.trim() && !isPending

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Offer *</label>
        <select value={offerId} onChange={e => setOfferId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="">Select offer</option>
          {offers?.data.map(o => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="email@example.com"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
        <input type="text" value={reason} onChange={e => setReason(e.target.value)}
          placeholder="Reason for suppression"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button type="button" onClick={onCancel} disabled={isPending}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50">
          Cancel
        </button>
        <button type="button" onClick={() => onSubmit({
          offer_id: parseInt(offerId), email, reason: reason || undefined
        })} disabled={!canSubmit}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
          {isPending ? 'Saving...' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </div>
  )
}

export default function SuppressionsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'emails' | 'processes'>('emails')
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [offerFilter, setOfferFilter] = useState<string>('')
  const limit = 50

  const { data: emailsData, isLoading: emailsLoading, error: emailsError } = useQuery({
    queryKey: ['suppression-emails', { search: search || undefined, offer_id: offerFilter || undefined, limit, offset }],
    queryFn: () => suppressionsApi.getEmails({ search: search || undefined, offer_id: offerFilter ? parseInt(offerFilter) : undefined, limit, offset }),
    enabled: activeTab === 'emails'
  })

  const { data: processesData, isLoading: processesLoading, error: processesError } = useQuery({
    queryKey: ['suppression-processes', { search: search || undefined, offer_id: offerFilter || undefined, limit, offset }],
    queryFn: () => suppressionsApi.getProcesses({ search: search || undefined, offer_id: offerFilter ? parseInt(offerFilter) : undefined, limit, offset }),
    enabled: activeTab === 'processes'
  })

  const { data: offers } = useQuery({
    queryKey: ['offers', { limit: 1000 }],
    queryFn: () => offersApi.getAll({ limit: 1000 })
  })

  const createEmailMutation = useMutation({
    mutationFn: suppressionsApi.addEmail,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppression-emails'] })
  })

  const deleteEmailMutation = useMutation({
    mutationFn: suppressionsApi.deleteEmail,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppression-emails'] })
  })

  const deleteProcessMutation = useMutation({
    mutationFn: suppressionsApi.deleteProcess,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppression-processes'] })
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SuppressionEmail | null>(null)
  const [deleteItem, setDeleteItem] = useState<SuppressionEmail | SuppressionProcess | null>(null)
  const [mutationError, setMutationError] = useState('')

  const openCreate = () => { setEditingItem(null); setModalOpen(true) }
  const openEdit = (item: SuppressionEmail) => { setEditingItem(item); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditingItem(null); setMutationError('') }

  const handleSubmit = (formData: any) => {
    setMutationError('')
    createEmailMutation.mutate(formData, {
      onSuccess: closeModal,
      onError: (err) => setMutationError(err instanceof Error ? err.message : 'Create failed'),
    })
  }

  const handleDelete = () => {
    if (!deleteItem) return
    setMutationError('')
    
    if (activeTab === 'emails') {
      deleteEmailMutation.mutate(deleteItem.id, {
        onSuccess: () => setDeleteItem(null),
        onError: (err) => {
          setDeleteItem(null)
          setMutationError(err instanceof Error ? err.message : 'Delete failed')
        },
      })
    } else {
      deleteProcessMutation.mutate(deleteItem.id, {
        onSuccess: () => setDeleteItem(null),
        onError: (err) => {
          setDeleteItem(null)
          setMutationError(err instanceof Error ? err.message : 'Delete failed')
        },
      })
    }
  }

  const error = emailsError || processesError
  if (error) return <ErrorAlert message={error.message} />

  const data = activeTab === 'emails' ? emailsData : processesData
  const isLoading = activeTab === 'emails' ? emailsLoading : processesLoading

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Suppressions</h1>
          {data?.count != null && (
            <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {data.count}
            </span>
          )}
        </div>
        {activeTab === 'emails' && (
          <button onClick={openCreate}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
            Add Suppression
          </button>
        )}
      </div>

      {mutationError && <ErrorAlert message={mutationError} onClose={() => setMutationError('')} />}

      <div className="mb-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-8">
            <button
              onClick={() => { setActiveTab('emails'); setOffset(0) }}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'emails'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}>
              Emails
            </button>
            <button
              onClick={() => { setActiveTab('processes'); setOffset(0) }}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'processes'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}>
              Processes
            </button>
          </nav>
        </div>
      </div>

      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" value={search}
            onChange={(e) => { setSearch(e.target.value); setOffset(0) }}
            placeholder={`Search ${activeTab}...`}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
        </div>
        <select value={offerFilter} onChange={(e) => { setOfferFilter(e.target.value); setOffset(0) }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
          <option value="">All Offers</option>
          {offers?.data.map(o => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={activeTab === 'emails' ? emailColumns : processColumns}
        data={data?.data ?? []}
        isLoading={isLoading}
        onEdit={activeTab === 'emails' ? openEdit : undefined}
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

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingItem ? 'Edit Suppression' : 'Add Suppression'}>
        <EmailForm
          initial={editingItem}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isPending={createEmailMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteItem}
        title={`Delete ${activeTab === 'emails' ? 'Suppression Email' : 'Suppression Process'}`}
        message={`Are you sure you want to delete this ${activeTab === 'emails' ? 'email' : 'process'}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
        isPending={deleteEmailMutation.isPending || deleteProcessMutation.isPending}
      />
    </div>
  )
}
