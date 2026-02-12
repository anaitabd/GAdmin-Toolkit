import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import type { AutoResponder } from '../api/types'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import DataTable from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ErrorAlert from '../components/ui/ErrorAlert'
import Pagination from '../components/ui/Pagination'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as autoRespondersApi from '../api/autoResponders'
import * as offersApi from '../api/offers'
import * as creativesApi from '../api/creatives'
import * as fromNamesApi from '../api/fromNames'
import * as subjectsApi from '../api/subjects'

const columns: Column<AutoResponder>[] = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
  { key: 'offer_name', header: 'Offer' },
  { key: 'trigger_type', header: 'Trigger Type', render: (item) => (
    <span className="capitalize">{item.trigger_type}</span>
  )},
  { key: 'delay_value', header: 'Delay', render: (item) => (
    item.delay_value && item.delay_unit ? `${item.delay_value} ${item.delay_unit}` : '-'
  )},
  { key: 'status', header: 'Status', render: (item) => (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
      item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
    }`}>
      {item.status}
    </span>
  )},
  { key: 'total_sent', header: 'Sent' },
  { key: 'total_opened', header: 'Opened' },
  { key: 'total_clicked', header: 'Clicked' },
  { key: 'created_at', header: 'Created At', render: (item) => new Date(item.created_at).toLocaleDateString() },
]

function AutoResponderForm({ initial, onSubmit, onCancel, isPending }: {
  initial?: AutoResponder | null
  onSubmit: (data: any) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [offerId, setOfferId] = useState(initial?.offer_id?.toString() ?? '')
  const [triggerType, setTriggerType] = useState(initial?.trigger_type ?? 'open')
  const [delayValue, setDelayValue] = useState(initial?.delay_value?.toString() ?? '')
  const [delayUnit, setDelayUnit] = useState(initial?.delay_unit ?? 'minutes')
  const [creativeId, setCreativeId] = useState(initial?.creative_id?.toString() ?? '')
  const [fromNameId, setFromNameId] = useState(initial?.from_name_id?.toString() ?? '')
  const [subjectId, setSubjectId] = useState(initial?.subject_id?.toString() ?? '')
  const [sendLimit, setSendLimit] = useState(initial?.send_limit?.toString() ?? '')
  const [status, setStatus] = useState(initial?.status ?? 'active')

  const { data: offers } = useQuery({
    queryKey: ['offers', { limit: 1000 }],
    queryFn: () => offersApi.getAll({ limit: 1000 })
  })

  const { data: creatives } = useQuery({
    queryKey: ['creatives', { limit: 1000 }],
    queryFn: () => creativesApi.getAll({ limit: 1000 })
  })

  const { data: fromNames } = useQuery({
    queryKey: ['from-names', { limit: 1000 }],
    queryFn: () => fromNamesApi.getAll({ limit: 1000 })
  })

  const { data: subjects } = useQuery({
    queryKey: ['subjects', { limit: 1000 }],
    queryFn: () => subjectsApi.getAll({ limit: 1000 })
  })

  const canSubmit = name.trim() && offerId && triggerType && !isPending

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Auto-responder name"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
      </div>

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
        <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Type *</label>
        <select value={triggerType} onChange={e => setTriggerType(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="open">Open</option>
          <option value="click">Click</option>
          <option value="lead">Lead</option>
          <option value="schedule">Schedule</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delay Value</label>
          <input type="number" value={delayValue} onChange={e => setDelayValue(e.target.value)}
            placeholder="0"
            min="0"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delay Unit</label>
          <select value={delayUnit} onChange={e => setDelayUnit(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500">
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
            <option value="days">Days</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Creative</label>
        <select value={creativeId} onChange={e => setCreativeId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="">Select creative</option>
          {creatives?.data.map(c => (
            <option key={c.id} value={c.id}>{c.subject}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
        <select value={fromNameId} onChange={e => setFromNameId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="">Select from name</option>
          {fromNames?.data.map(f => (
            <option key={f.id} value={f.id}>{f.value}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
        <select value={subjectId} onChange={e => setSubjectId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="">Select subject</option>
          {subjects?.data.map(s => (
            <option key={s.id} value={s.id}>{s.value}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Send Limit</label>
        <input type="number" value={sendLimit} onChange={e => setSendLimit(e.target.value)}
          placeholder="Unlimited"
          min="0"
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
          name,
          offer_id: parseInt(offerId),
          trigger_type: triggerType,
          delay_value: delayValue ? parseInt(delayValue) : undefined,
          delay_unit: delayUnit,
          creative_id: creativeId ? parseInt(creativeId) : undefined,
          from_name_id: fromNameId ? parseInt(fromNameId) : undefined,
          subject_id: subjectId ? parseInt(subjectId) : undefined,
          send_limit: sendLimit ? parseInt(sendLimit) : undefined,
          status
        })} disabled={!canSubmit}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
          {isPending ? 'Saving...' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </div>
  )
}

export default function AutoRespondersPage() {
  const location = useLocation()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [triggerTypeFilter, setTriggerTypeFilter] = useState<string>('')
  const limit = 50

  const { data, isLoading, error } = useQuery({
    queryKey: ['auto-responders', { search: search || undefined, status: statusFilter || undefined, limit, page }],
    queryFn: () => autoRespondersApi.getAll({ search: search || undefined, status: statusFilter || undefined, limit, page })
  })

  const createMutation = useMutation({
    mutationFn: autoRespondersApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auto-responders'] })
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => autoRespondersApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auto-responders'] })
  })

  const deleteMutation = useMutation({
    mutationFn: autoRespondersApi.deleteById,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auto-responders'] })
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AutoResponder | null>(null)
  const [deleteItem, setDeleteItem] = useState<AutoResponder | null>(null)
  const [mutationError, setMutationError] = useState('')

  // Auto-open add modal when URL is /auto-responders/create
  useEffect(() => {
    if (location.pathname === '/auto-responders/create') {
      openCreate()
    }
  }, [location.pathname])

  const openCreate = () => { setEditingItem(null); setModalOpen(true) }
  const openEdit = (item: AutoResponder) => { setEditingItem(item); setModalOpen(true) }
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

  const filteredData = triggerTypeFilter && data?.data
    ? data.data.filter(item => item.trigger_type === triggerTypeFilter)
    : data?.data

  if (error) return <ErrorAlert message={error.message} />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Auto-Responders</h1>
          {data?.count != null && (
            <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {data.count}
            </span>
          )}
        </div>
        <button onClick={openCreate}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
          Add Auto-Responder
        </button>
      </div>

      {mutationError && <ErrorAlert message={mutationError} onClose={() => setMutationError('')} />}

      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Search auto-responders..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={triggerTypeFilter} onChange={e => setTriggerTypeFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="">All Triggers</option>
          <option value="open">Open</option>
          <option value="click">Click</option>
          <option value="lead">Lead</option>
          <option value="schedule">Schedule</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filteredData ?? []}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={setDeleteItem}
      />

      {data && data.count > limit && (
        <Pagination
          offset={(page - 1) * limit}
          limit={limit}
          total={data.count}
          onPageChange={(newOffset: number) => setPage(Math.floor(newOffset / limit) + 1)}
        />
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingItem ? 'Edit Auto-Responder' : 'Add Auto-Responder'}>
        <AutoResponderForm
          initial={editingItem}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isPending={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteItem}
        title="Delete Auto-Responder"
        message={`Are you sure you want to delete "${deleteItem?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
