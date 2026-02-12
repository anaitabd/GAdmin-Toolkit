import { useState } from 'react'
import type { Lead, Offer, Campaign } from '../api/types'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import DataTable from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ErrorAlert from '../components/ui/ErrorAlert'
import Pagination from '../components/ui/Pagination'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as leadsApi from '../api/leads'
import * as offersApi from '../api/offers'
import * as campaignsApi from '../api/campaigns'

const columns: Column<Lead>[] = [
  { key: 'id', header: 'ID' },
  { key: 'offer_id', header: 'Offer ID' },
  { key: 'campaign_id', header: 'Campaign ID' },
  { key: 'email', header: 'Email' },
  { key: 'first_name', header: 'First Name' },
  { key: 'last_name', header: 'Last Name' },
  { key: 'phone', header: 'Phone' },
  { key: 'status', header: 'Status', render: (item) => (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
      item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
    }`}>
      {item.status}
    </span>
  )},
  { key: 'created_at', header: 'Created At', render: (item) => new Date(item.created_at).toLocaleDateString() },
]

function LeadForm({ initial, onSubmit, onCancel, isPending }: {
  initial?: Lead | null
  onSubmit: (data: any) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [offerId, setOfferId] = useState(initial?.offer_id?.toString() ?? '')
  const [campaignId, setCampaignId] = useState(initial?.campaign_id?.toString() ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [firstName, setFirstName] = useState(initial?.first_name ?? '')
  const [lastName, setLastName] = useState(initial?.last_name ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [ipAddress, setIpAddress] = useState(initial?.ip_address ?? '')
  const [status, setStatus] = useState(initial?.status ?? 'active')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const { data: offers } = useQuery({
    queryKey: ['offers', { limit: 1000 }],
    queryFn: () => offersApi.getAll({ limit: 1000 })
  })

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns', { limit: 1000 }],
    queryFn: () => campaignsApi.getAll({ limit: 1000 })
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Campaign (Optional)</label>
        <select value={campaignId} onChange={e => setCampaignId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="">Select campaign</option>
          {campaigns?.data.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="email@example.com"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
            placeholder="John"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
            placeholder="Doe"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="+1 555 1234"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
          <input type="text" value={ipAddress} onChange={e => setIpAddress(e.target.value)}
            placeholder="192.168.1.1"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Additional notes"
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button type="button" onClick={onCancel} disabled={isPending}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50">
          Cancel
        </button>
        <button type="button" onClick={() => onSubmit({
          offer_id: parseInt(offerId), campaign_id: campaignId ? parseInt(campaignId) : undefined,
          email, first_name: firstName || undefined, last_name: lastName || undefined,
          phone: phone || undefined, ip_address: ipAddress || undefined,
          status, notes: notes || undefined
        })} disabled={!canSubmit}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
          {isPending ? 'Saving...' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </div>
  )
}

export default function LeadsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [offerFilter, setOfferFilter] = useState<string>('')
  const [campaignFilter, setCampaignFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const limit = 50

  const { data, isLoading, error } = useQuery({
    queryKey: ['leads', { 
      search: search || undefined, 
      offer_id: offerFilter || undefined, 
      campaign_id: campaignFilter || undefined,
      status: statusFilter || undefined,
      limit, 
      offset 
    }],
    queryFn: () => leadsApi.getAll({ 
      search: search || undefined, 
      offer_id: offerFilter ? parseInt(offerFilter) : undefined,
      campaign_id: campaignFilter ? parseInt(campaignFilter) : undefined,
      status: statusFilter || undefined,
      limit, 
      offset 
    })
  })

  const { data: offers } = useQuery({
    queryKey: ['offers', { limit: 1000 }],
    queryFn: () => offersApi.getAll({ limit: 1000 })
  })

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns', { limit: 1000 }],
    queryFn: () => campaignsApi.getAll({ limit: 1000 })
  })

  const createMutation = useMutation({
    mutationFn: leadsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] })
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => leadsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] })
  })

  const deleteMutation = useMutation({
    mutationFn: leadsApi.deleteById,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] })
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Lead | null>(null)
  const [deleteItem, setDeleteItem] = useState<Lead | null>(null)
  const [mutationError, setMutationError] = useState('')

  const openCreate = () => { setEditingItem(null); setModalOpen(true) }
  const openEdit = (item: Lead) => { setEditingItem(item); setModalOpen(true) }
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
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          {data?.count != null && (
            <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {data.count}
            </span>
          )}
        </div>
        <button onClick={openCreate}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
          Add Lead
        </button>
      </div>

      {mutationError && <ErrorAlert message={mutationError} onClose={() => setMutationError('')} />}

      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" value={search}
            onChange={(e) => { setSearch(e.target.value); setOffset(0) }}
            placeholder="Search leads..."
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
        </div>
        <select value={offerFilter} onChange={(e) => { setOfferFilter(e.target.value); setOffset(0) }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
          <option value="">All Offers</option>
          {offers?.data.map(o => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
        <select value={campaignFilter} onChange={(e) => { setCampaignFilter(e.target.value); setOffset(0) }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
          <option value="">All Campaigns</option>
          {campaigns?.data.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setOffset(0) }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
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

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingItem ? 'Edit Lead' : 'Add Lead'}>
        <LeadForm
          initial={editingItem}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isPending={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteItem}
        title="Delete Lead"
        message={`Are you sure you want to delete "${deleteItem?.email}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
