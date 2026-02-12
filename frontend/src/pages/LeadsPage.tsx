import { useState } from 'react'
import type { Lead, Offer, Campaign } from '../api/types'
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
  { key: 'to_email', header: 'Email' },
  { key: 'payout', header: 'Payout', render: (item) => item.payout ? `$${item.payout}` : '-' },
  { key: 'ip_address', header: 'IP Address' },
  { key: 'geo', header: 'Location' },
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
  const [affiliateNetworkId, setAffiliateNetworkId] = useState(initial?.affiliate_network_id?.toString() ?? '')
  const [toEmail, setToEmail] = useState(initial?.to_email ?? '')
  const [payout, setPayout] = useState(initial?.payout?.toString() ?? '')
  const [ipAddress, setIpAddress] = useState(initial?.ip_address ?? '')

  const { data: offers } = useQuery({
    queryKey: ['offers', { limit: 1000 }],
    queryFn: () => offersApi.getAll({ limit: 1000 })
  })

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns', { limit: 1000 }],
    queryFn: () => campaignsApi.getAll({ limit: 1000 })
  })

  const canSubmit = offerId && toEmail.trim() && !isPending

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
        <input type="email" value={toEmail} onChange={e => setToEmail(e.target.value)}
          placeholder="email@example.com"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payout</label>
          <input type="number" step="0.01" value={payout} onChange={e => setPayout(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
          <input type="text" value={ipAddress} onChange={e => setIpAddress(e.target.value)}
            placeholder="192.168.1.1"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button type="button" onClick={onCancel} disabled={isPending}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50">
          Cancel
        </button>
        <button type="button" onClick={() => onSubmit({
          offer_id: parseInt(offerId), 
          campaign_id: campaignId ? parseInt(campaignId) : undefined,
          affiliate_network_id: affiliateNetworkId ? parseInt(affiliateNetworkId) : undefined,
          to_email: toEmail, 
          payout: payout ? parseFloat(payout) : undefined,
          ip_address: ipAddress || undefined
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
  const [offset, setOffset] = useState(0)
  const [offerFilter, setOfferFilter] = useState<string>('')
  const [campaignFilter, setCampaignFilter] = useState<string>('')
  const limit = 50

  const { data, isLoading, error } = useQuery({
    queryKey: ['leads', { 
      offer_id: offerFilter || undefined, 
      campaign_id: campaignFilter || undefined,
      limit, 
      offset 
    }],
    queryFn: () => leadsApi.getAll({ 
      offer_id: offerFilter ? parseInt(offerFilter) : undefined,
      campaign_id: campaignFilter ? parseInt(campaignFilter) : undefined,
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
        message={`Are you sure you want to delete lead for "${deleteItem?.to_email}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
