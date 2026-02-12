import { useState } from 'react'
import type { OfferLink, Offer, Creative } from '../api/types'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import DataTable from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ErrorAlert from '../components/ui/ErrorAlert'
import Pagination from '../components/ui/Pagination'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as offerLinksApi from '../api/offerLinks'
import * as offersApi from '../api/offers'
import * as creativesApi from '../api/creatives'

const columns: Column<OfferLink>[] = [
  { key: 'id', header: 'ID' },
  { key: 'offer_id', header: 'Offer ID' },
  { key: 'creative_id', header: 'Creative ID' },
  { key: 'type', header: 'Type', render: (item) => (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
      item.type === 'click' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
    }`}>
      {item.type}
    </span>
  )},
  { key: 'value', header: 'URL', render: (item) => (
    <span className="truncate max-w-xs block" title={item.value}>{item.value}</span>
  )},
  { key: 'status', header: 'Status', render: (item) => (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
      item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
    }`}>
      {item.status}
    </span>
  )},
]

function OfferLinkForm({ initial, onSubmit, onCancel, isPending }: {
  initial?: OfferLink | null
  onSubmit: (data: any) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [offerId, setOfferId] = useState(initial?.offer_id?.toString() ?? '')
  const [creativeId, setCreativeId] = useState(initial?.creative_id?.toString() ?? '')
  const [type, setType] = useState<'click' | 'unsub'>(initial?.type ?? 'click')
  const [value, setValue] = useState(initial?.value ?? '')
  const [status, setStatus] = useState(initial?.status ?? 'active')

  const { data: offers } = useQuery({
    queryKey: ['offers', { limit: 1000 }],
    queryFn: () => offersApi.getAll({ limit: 1000 })
  })

  const { data: creatives } = useQuery({
    queryKey: ['creatives', { offer_id: offerId || undefined, limit: 1000 }],
    queryFn: () => creativesApi.getAll({ offer_id: offerId ? parseInt(offerId) : undefined, limit: 1000 }),
    enabled: !!offerId
  })

  const canSubmit = offerId && value.trim() && !isPending

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Offer *</label>
        <select value={offerId} onChange={e => { setOfferId(e.target.value); setCreativeId('') }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="">Select offer</option>
          {offers?.data.map(o => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Creative (Optional)</label>
        <select value={creativeId} onChange={e => setCreativeId(e.target.value)}
          disabled={!offerId}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-50">
          <option value="">Select creative</option>
          {creatives?.data.map(c => (
            <option key={c.id} value={c.id}>{c.subject}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input type="radio" value="click" checked={type === 'click'} onChange={e => setType('click')}
              className="mr-2" />
            Click
          </label>
          <label className="flex items-center">
            <input type="radio" value="unsub" checked={type === 'unsub'} onChange={e => setType('unsub')}
              className="mr-2" />
            Unsubscribe
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
        <input type="url" value={value} onChange={e => setValue(e.target.value)}
          placeholder="https://example.com/..."
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
          offer_id: parseInt(offerId), creative_id: creativeId ? parseInt(creativeId) : undefined,
          type, value, status
        })} disabled={!canSubmit}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
          {isPending ? 'Saving...' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </div>
  )
}

export default function OfferLinksPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [offerFilter, setOfferFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const limit = 50

  const { data, isLoading, error } = useQuery({
    queryKey: ['offer-links', { search: search || undefined, offer_id: offerFilter || undefined, type: typeFilter || undefined, limit, offset }],
    queryFn: () => offerLinksApi.getAll({ search: search || undefined, offer_id: offerFilter ? parseInt(offerFilter) : undefined, type: typeFilter as any || undefined, limit, offset })
  })

  const { data: offers } = useQuery({
    queryKey: ['offers', { limit: 1000 }],
    queryFn: () => offersApi.getAll({ limit: 1000 })
  })

  const createMutation = useMutation({
    mutationFn: offerLinksApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['offer-links'] })
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => offerLinksApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['offer-links'] })
  })

  const deleteMutation = useMutation({
    mutationFn: offerLinksApi.deleteById,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['offer-links'] })
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<OfferLink | null>(null)
  const [deleteItem, setDeleteItem] = useState<OfferLink | null>(null)
  const [mutationError, setMutationError] = useState('')

  const openCreate = () => { setEditingItem(null); setModalOpen(true) }
  const openEdit = (item: OfferLink) => { setEditingItem(item); setModalOpen(true) }
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

  if (error) return <ErrorAlert message={error.message} />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Offer Links</h1>
          {data?.count != null && (
            <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {data.count}
            </span>
          )}
        </div>
        <button onClick={openCreate}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
          Add Link
        </button>
      </div>

      {mutationError && <ErrorAlert message={mutationError} onClose={() => setMutationError('')} />}

      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" value={search}
            onChange={(e) => { setSearch(e.target.value); setOffset(0) }}
            placeholder="Search links..."
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
        </div>
        <select value={offerFilter} onChange={(e) => { setOfferFilter(e.target.value); setOffset(0) }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
          <option value="">All Offers</option>
          {offers?.data.map(o => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setOffset(0) }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
          <option value="">All Types</option>
          <option value="click">Click</option>
          <option value="unsub">Unsubscribe</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        onEdit={openEdit}
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

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingItem ? 'Edit Offer Link' : 'Add Offer Link'}>
        <OfferLinkForm
          initial={editingItem}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isPending={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteItem}
        title="Delete Offer Link"
        message={`Are you sure you want to delete this link? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
