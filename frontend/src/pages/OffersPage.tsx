import { useState, useMemo } from 'react'
import { useOffers, useCreateOffer, useUpdateOffer, useDeleteOffer, useOfferStats, useOfferClickers } from '../hooks/useOffers'
import type { Offer, OfferClicker } from '../api/types'

function extractErrorMessage(err: unknown): string {
  const axiosErr = err as { response?: { data?: { error?: string } } }
  return axiosErr?.response?.data?.error || (err instanceof Error ? err.message : 'Operation failed')
}

// ── Offer Form ─────────────────────────────────────────────────────
interface OfferFormProps {
  readonly initial?: Offer | null
  readonly onSubmit: (data: {
    name: string
    subject: string
    from_name: string
    html_content: string
    click_url: string
    unsub_url: string
    active: boolean
  }) => void
  readonly onCancel: () => void
  readonly isPending: boolean
}

function OfferForm({ initial, onSubmit, onCancel, isPending }: OfferFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [subject, setSubject] = useState(initial?.subject ?? '')
  const [fromName, setFromName] = useState(initial?.from_name ?? '')
  const [htmlContent, setHtmlContent] = useState(initial?.html_content ?? '')
  const [clickUrl, setClickUrl] = useState(initial?.click_url ?? '')
  const [unsubUrl, setUnsubUrl] = useState(initial?.unsub_url ?? '')
  const [active, setActive] = useState(initial?.active ?? true)
  const [showPreview, setShowPreview] = useState(false)

  const canSubmit = name.trim() && subject.trim() && fromName.trim() && htmlContent.trim() && clickUrl.trim() && !isPending

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label htmlFor="offer-name" className="block text-sm font-medium text-gray-700 mb-1">Offer Name</label>
        <input id="offer-name" type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. Summer Sale 2024" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* From Name */}
        <div>
          <label htmlFor="offer-from" className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
          <input id="offer-from" type="text" value={fromName} onChange={e => setFromName(e.target.value)}
            placeholder="e.g. My Company" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        {/* Subject */}
        <div>
          <label htmlFor="offer-subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input id="offer-subject" type="text" value={subject} onChange={e => setSubject(e.target.value)}
            placeholder="e.g. Check out our deal!" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Click URL */}
        <div>
          <label htmlFor="offer-click-url" className="block text-sm font-medium text-gray-700 mb-1">Click URL (offer link)</label>
          <input id="offer-click-url" type="url" value={clickUrl} onChange={e => setClickUrl(e.target.value)}
            placeholder="https://example.com/offer" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
          <p className="text-xs text-gray-500 mt-1">This URL can be changed later — tracking links will always redirect to the current URL.</p>
        </div>
        {/* Unsub URL */}
        <div>
          <label htmlFor="offer-unsub-url" className="block text-sm font-medium text-gray-700 mb-1">Unsubscribe URL</label>
          <input id="offer-unsub-url" type="url" value={unsubUrl} onChange={e => setUnsubUrl(e.target.value)}
            placeholder="https://example.com/unsubscribe" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
      </div>

      {/* HTML Content */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="offer-html" className="block text-sm font-medium text-gray-700">HTML Content</label>
          <button onClick={() => setShowPreview(!showPreview)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            {showPreview ? 'Edit' : 'Preview'}
          </button>
        </div>
        {showPreview ? (
          <div className="w-full min-h-[200px] border border-gray-200 rounded-lg p-4 bg-gray-50 overflow-auto prose max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }} />
        ) : (
          <textarea id="offer-html" value={htmlContent} onChange={e => setHtmlContent(e.target.value)}
            placeholder="Paste your HTML email content here..." rows={10}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:ring-indigo-500" />
        )}
      </div>

      {/* Active toggle */}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)}
          className="rounded text-indigo-600 focus:ring-indigo-500" />
        <span className="text-gray-700">Active</span>
      </label>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button onClick={() => onSubmit({ name, subject, from_name: fromName, html_content: htmlContent, click_url: clickUrl, unsub_url: unsubUrl, active })}
          disabled={!canSubmit}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition-colors">
          {isPending ? 'Saving...' : initial ? 'Update Offer' : 'Create Offer'}
        </button>
        <button onClick={onCancel}
          className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Offer Clickers Table ───────────────────────────────────────────
function OfferClickersTable({ clickers }: Readonly<{ clickers: OfferClicker[] }>) {
  if (clickers.length === 0) return <p className="text-xs text-gray-400 text-center py-4">No clickers yet</p>
  return (
    <div className="max-h-80 overflow-y-auto">
      <table className="w-full text-xs">
        <thead className="bg-gray-100 sticky top-0">
          <tr>
            <th className="text-left px-2 py-1.5 font-medium text-gray-600">Email</th>
            <th className="text-center px-2 py-1.5 font-medium text-gray-600">Geo</th>
            <th className="text-center px-2 py-1.5 font-medium text-gray-600">Device</th>
            <th className="text-center px-2 py-1.5 font-medium text-gray-600">Browser</th>
            <th className="text-center px-2 py-1.5 font-medium text-gray-600">Campaign</th>
            <th className="text-right px-2 py-1.5 font-medium text-gray-600">Clicked At</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {clickers.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="px-2 py-1.5 text-gray-800 truncate max-w-[180px]">{c.to_email}</td>
              <td className="px-2 py-1.5 text-center">
                {c.geo ? <span className="bg-gray-200 text-gray-600 rounded px-1.5 py-0.5">{c.geo}</span> : '—'}
              </td>
              <td className="px-2 py-1.5 text-center text-gray-600">{c.device ?? '—'}</td>
              <td className="px-2 py-1.5 text-center text-gray-600">{c.browser ?? '—'}</td>
              <td className="px-2 py-1.5 text-center text-gray-500">#{c.job_id ?? '—'}</td>
              <td className="px-2 py-1.5 text-right text-gray-500">{new Date(c.clicked_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Offer Detail / Stats ───────────────────────────────────────────
function OfferDetail({ offer, onBack, onEdit }: Readonly<{ offer: Offer; onBack: () => void; onEdit: () => void }>) {
  const { data: statsRes } = useOfferStats(offer.id)
  const [geoFilter, setGeoFilter] = useState('')
  const [campaignFilter, setCampaignFilter] = useState('')
  const { data: clickersRes } = useOfferClickers(offer.id, {
    geo: geoFilter || undefined,
    campaign_id: campaignFilter ? Number(campaignFilter) : undefined,
    limit: 200,
  })

  const stats = statsRes?.data
  const clickers = clickersRes?.data ?? []

  // Extract unique geos from stats
  const geoOptions = stats?.by_geo?.map(g => g.geo).filter(Boolean) ?? []
  const campaignOptions = stats?.by_campaign?.map(c => c.job_id) ?? []

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack}
          className="rounded-lg p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors" title="Back to offers">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{offer.name}</h1>
          <p className="text-sm text-gray-500">{offer.subject}</p>
        </div>
        <button onClick={onEdit}
          className="rounded-xl px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors">
          Edit
        </button>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-blue-700">{stats?.total_clicks ?? 0}</p>
          <p className="text-xs text-gray-500">Total Clicks</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-indigo-700">{stats?.unique_clickers ?? 0}</p>
          <p className="text-xs text-gray-500">Unique Clickers</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-green-700">{geoOptions.length}</p>
          <p className="text-xs text-gray-500">Geos</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-red-700">{stats?.unsubscribes ?? 0}</p>
          <p className="text-xs text-gray-500">Unsubscribes</p>
        </div>
      </div>

      {/* Offer details */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-6 space-y-2 text-sm">
        <div className="flex gap-2">
          <span className="text-gray-400 w-24 shrink-0">From:</span>
          <span className="text-gray-800 font-medium">{offer.from_name}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-gray-400 w-24 shrink-0">Click URL:</span>
          <a href={offer.click_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate">{offer.click_url}</a>
        </div>
        {offer.unsub_url && (
          <div className="flex gap-2">
            <span className="text-gray-400 w-24 shrink-0">Unsub URL:</span>
            <a href={offer.unsub_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate">{offer.unsub_url}</a>
          </div>
        )}
        <div className="flex gap-2">
          <span className="text-gray-400 w-24 shrink-0">Status:</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${offer.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {offer.active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* By Geo breakdown */}
      {stats?.by_geo && stats.by_geo.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Clicks by Geo</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {stats.by_geo.map(g => (
              <div key={g.geo} className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                <p className="text-sm font-bold text-gray-800">{g.clicks}</p>
                <p className="text-xs text-gray-500">{g.geo || 'Unknown'} ({g.unique_clickers} unique)</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* By Campaign breakdown */}
      {stats?.by_campaign && stats.by_campaign.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Clicks by Campaign</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {stats.by_campaign.map(c => (
              <div key={c.job_id} className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                <p className="text-sm font-bold text-gray-800">{c.clicks}</p>
                <p className="text-xs text-gray-500">Campaign #{c.job_id} ({c.unique_clickers} unique)</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clickers table with filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800">Clickers ({clickers.length})</h3>
          <div className="flex gap-2">
            <select value={geoFilter} onChange={e => setGeoFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-indigo-500 focus:ring-indigo-500">
              <option value="">All Geos</option>
              {geoOptions.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select value={campaignFilter} onChange={e => setCampaignFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-indigo-500 focus:ring-indigo-500">
              <option value="">All Campaigns</option>
              {campaignOptions.map(id => <option key={id} value={id}>Campaign #{id}</option>)}
            </select>
          </div>
        </div>
        <OfferClickersTable clickers={clickers} />
      </div>
    </div>
  )
}

// ── Offer Card ─────────────────────────────────────────────────────
function OfferCard({ offer, onView, onEdit, onDelete, isDeleting }: Readonly<{
  offer: Offer
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}>) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{offer.name}</h3>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${offer.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {offer.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate">{offer.subject}</p>
        </div>
        <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onView} className="rounded-lg px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100" title="View details">
            View
          </button>
          <button onClick={onEdit} className="rounded-lg px-2 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100" title="Edit">
            Edit
          </button>
          <button onClick={onDelete} disabled={isDeleting}
            className="rounded-lg px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50" title="Delete">
            Delete
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-gray-50 rounded-lg px-2 py-1.5">
          <span className="text-gray-400">From</span>
          <p className="font-medium text-gray-700 truncate">{offer.from_name}</p>
        </div>
        <div className="bg-gray-50 rounded-lg px-2 py-1.5">
          <span className="text-gray-400">Click URL</span>
          <p className="font-medium text-indigo-600 truncate" title={offer.click_url}>{offer.click_url}</p>
        </div>
        <div className="bg-gray-50 rounded-lg px-2 py-1.5">
          <span className="text-gray-400">Created</span>
          <p className="font-medium text-gray-700">{new Date(offer.created_at).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────
type ViewMode = 'list' | 'create' | 'edit' | 'detail'

export default function OffersPage() {
  const { data: offersRes, isLoading } = useOffers()
  const createMutation = useCreateOffer()
  const updateMutation = useUpdateOffer()
  const deleteMutation = useDeleteOffer()

  const offers = offersRes?.data ?? []

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return offers
    const q = search.toLowerCase()
    return offers.filter(o =>
      o.name.toLowerCase().includes(q) ||
      o.subject.toLowerCase().includes(q) ||
      o.from_name.toLowerCase().includes(q) ||
      o.click_url.toLowerCase().includes(q)
    )
  }, [offers, search])

  const handleCreate = (data: Parameters<typeof createMutation.mutate>[0]) => {
    createMutation.mutate(data, {
      onSuccess: () => setViewMode('list'),
    })
  }

  const handleUpdate = (data: Parameters<typeof updateMutation.mutate>[0]['data']) => {
    if (!selectedOffer) return
    updateMutation.mutate({ id: selectedOffer.id, data }, {
      onSuccess: (res) => {
        setSelectedOffer(res.data)
        setViewMode('detail')
      },
    })
  }

  const handleDelete = (id: number) => {
    if (!confirm('Delete this offer?')) return
    deleteMutation.mutate(id)
  }

  // ── Detail View ──
  if (viewMode === 'detail' && selectedOffer) {
    return (
      <OfferDetail
        offer={selectedOffer}
        onBack={() => { setSelectedOffer(null); setViewMode('list') }}
        onEdit={() => setViewMode('edit')}
      />
    )
  }

  // ── Create / Edit Form ──
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => { setViewMode('list'); setSelectedOffer(null) }}
            className="rounded-lg p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors" title="Back">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{viewMode === 'edit' ? 'Edit Offer' : 'New Offer'}</h1>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <OfferForm
            initial={viewMode === 'edit' ? selectedOffer : null}
            onSubmit={viewMode === 'edit' ? handleUpdate : handleCreate}
            onCancel={() => { setViewMode(selectedOffer ? 'detail' : 'list') }}
            isPending={createMutation.isPending || updateMutation.isPending}
          />
        </div>
        {(createMutation.isError || updateMutation.isError) && (
          <p className="text-sm text-red-600 mt-3">
            {extractErrorMessage(createMutation.error || updateMutation.error)}
          </p>
        )}
      </div>
    )
  }

  // ── List View ──
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offers</h1>
          <p className="text-sm text-gray-500 mt-1">{offers.length} offer{offers.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setSelectedOffer(null); setViewMode('create') }}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-2">
          <span className="text-lg leading-none">+</span> New Offer
        </button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search offers..." title="Search offers"
          className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-sm text-gray-500 mb-4">
            {offers.length === 0 ? 'No offers yet. Create your first offer!' : 'No offers match your search.'}
          </p>
          {offers.length === 0 && (
            <button onClick={() => setViewMode('create')}
              className="rounded-lg px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100">
              Create Offer
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(offer => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onView={() => { setSelectedOffer(offer); setViewMode('detail') }}
              onEdit={() => { setSelectedOffer(offer); setViewMode('edit') }}
              onDelete={() => handleDelete(offer.id)}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
