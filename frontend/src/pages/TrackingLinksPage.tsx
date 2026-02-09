import { useState, useMemo } from 'react'
import {
  useTrackingLinks,
  useCreateTrackingLink,
  useUpdateTrackingLink,
  useDeleteTrackingLink,
  useTrackingLinkStats,
  useTrackingLinkClicks,
} from '../hooks/useTrackingLinks'
import * as trackingLinksApi from '../api/trackingLinks'
import type { TrackingLink, ClickEvent } from '../api/types'

function extractErrorMessage(err: unknown): string {
  const axiosErr = err as { response?: { data?: { error?: string } } }
  return axiosErr?.response?.data?.error || (err instanceof Error ? err.message : 'Operation failed')
}

function SectionCard({ title, icon, children, actions }: Readonly<{ title: string; icon: string; children: React.ReactNode; actions?: React.ReactNode }>) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>{icon}</span> {title}
        </h2>
        {actions}
      </div>
      {children}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────
   CREATE / EDIT FORM
   ──────────────────────────────────────────────────────────────────── */
interface LinkFormProps {
  readonly initial?: TrackingLink | null
  readonly onClose: () => void
}

function LinkForm({ initial, onClose }: LinkFormProps) {
  const createMutation = useCreateTrackingLink()
  const updateMutation = useUpdateTrackingLink()
  const isEdit = !!initial

  const [url, setUrl] = useState(initial?.original_url ?? '')
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [tagsStr, setTagsStr] = useState((initial?.tags ?? []).join(', '))

  const handleSave = () => {
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean)
    if (isEdit) {
      updateMutation.mutate(
        { id: initial.id, data: { original_url: url, name, description, tags: tags.length ? tags : undefined } },
        { onSuccess: onClose },
      )
    } else {
      createMutation.mutate(
        { original_url: url, name: name || undefined, description: description || undefined, tags: tags.length ? tags : undefined },
        { onSuccess: onClose },
      )
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const error = createMutation.error || updateMutation.error

  return (
    <SectionCard title={isEdit ? 'Edit Tracking Link' : 'New Tracking Link'} icon={isEdit ? '✏️' : '➕'}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/page"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Main CTA"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
          <input
            type="text"
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            placeholder="e.g. promo, newsletter"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{extractErrorMessage(error)}</p>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSave}
            disabled={!url.trim() || isPending}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </SectionCard>
  )
}

/* ────────────────────────────────────────────────────────────────────
   HTML SNIPPET MODAL
   ──────────────────────────────────────────────────────────────────── */
interface HtmlSnippetProps {
  readonly link: TrackingLink
  readonly onClose: () => void
}

function HtmlSnippetPanel({ link, onClose }: HtmlSnippetProps) {
  const [linkText, setLinkText] = useState('Click here')
  const [target, setTarget] = useState('_blank')
  const [html, setHtml] = useState<string | null>(null)
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState<'html' | 'url' | null>(null)

  const fetchHtml = async () => {
    try {
      const res = await trackingLinksApi.getHtml(link.id, { linkText, target })
      setHtml(res.data.html)
      setTrackingUrl(res.data.tracking_url)
    } catch { /* ignore */ }
  }

  const copyToClipboard = async (text: string, type: 'html' | 'url') => {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  // Auto-fetch on mount
  useState(() => { fetchHtml() })

  return (
    <SectionCard title="HTML Snippet" icon="📋" actions={
      <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">✕ Close</button>
    }>
      <div className="space-y-3">
        <p className="text-xs text-gray-500 truncate">
          <span className="font-medium">{link.name || 'Unnamed'}</span> → {link.original_url}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Link Text</label>
            <input
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Target</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="_blank">_blank (new tab)</option>
              <option value="_self">_self (same tab)</option>
            </select>
          </div>
        </div>

        <button
          onClick={fetchHtml}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
        >
          Generate
        </button>

        {trackingUrl && (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 space-y-2">
            <div>
              <p className="text-xs text-gray-500 mb-1">Tracking URL</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-white border border-gray-200 rounded px-2 py-1 flex-1 truncate">{trackingUrl}</code>
                <button
                  onClick={() => copyToClipboard(trackingUrl, 'url')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium shrink-0"
                >
                  {copied === 'url' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
            {html && (
              <div>
                <p className="text-xs text-gray-500 mb-1">HTML</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-white border border-gray-200 rounded px-2 py-1 flex-1 truncate">{html}</code>
                  <button
                    onClick={() => copyToClipboard(html, 'html')}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium shrink-0"
                  >
                    {copied === 'html' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  )
}

/* ────────────────────────────────────────────────────────────────────
   CLICK DETAILS PANEL
   ──────────────────────────────────────────────────────────────────── */
interface ClickDetailsPanelProps {
  readonly link: TrackingLink
  readonly onClose: () => void
}

function BreakdownBar({ items }: Readonly<{ items: { name: string; count: number }[] }>) {
  const total = items.reduce((s, i) => s + i.count, 0)
  if (total === 0) return <p className="text-xs text-gray-400">No data</p>
  const colors = ['bg-indigo-500', 'bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-red-500', 'bg-purple-500']
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden mb-1">
        {items.map((item, i) => (
          <div
            key={item.name}
            className={`${colors[i % colors.length]} transition-all`}
            style={{ width: `${(item.count / total) * 100}%` }}
            title={`${item.name}: ${item.count}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {items.map((item, i) => (
          <span key={item.name} className="flex items-center gap-1 text-xs text-gray-600">
            <span className={`inline-block w-2 h-2 rounded-full ${colors[i % colors.length]}`} />
            {item.name} ({item.count})
          </span>
        ))}
      </div>
    </div>
  )
}

function ClickEventRow({ event }: Readonly<{ event: ClickEvent }>) {
  return (
    <div className="grid grid-cols-6 gap-2 text-xs py-2 px-3 bg-gray-50 rounded-lg">
      <div className="col-span-1 truncate font-mono text-gray-700" title={event.ip_address ?? ''}>
        {event.ip_address || '—'}
      </div>
      <div className="col-span-1 text-gray-600">
        {event.device || '—'}
      </div>
      <div className="col-span-1 text-gray-600">
        {event.browser || '—'}
      </div>
      <div className="col-span-1 text-gray-600">
        {event.os || '—'}
      </div>
      <div className="col-span-1 text-gray-600">
        {event.country || '—'}{event.city ? `, ${event.city}` : ''}
      </div>
      <div className="col-span-1 text-gray-400">
        {new Date(event.clicked_at).toLocaleString()}
      </div>
    </div>
  )
}

function ClickDetailsPanel({ link, onClose }: ClickDetailsPanelProps) {
  const [page, setPage] = useState(0)
  const limit = 50
  const { data: statsRes, isLoading: statsLoading } = useTrackingLinkStats(link.id)
  const { data: clicksRes, isLoading: clicksLoading } = useTrackingLinkClicks(link.id, { limit, offset: page * limit })

  const stats = statsRes?.data?.stats
  const clicks = clicksRes?.data ?? []
  const totalClicks = clicksRes?.total ?? 0

  return (
    <SectionCard
      title={`Click Data — ${link.name || 'Unnamed'}`}
      icon="📊"
      actions={
        <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">✕ Close</button>
      }
    >
      {/* Summary stats */}
      {statsLoading ? (
        <p className="text-sm text-gray-500">Loading stats...</p>
      ) : stats ? (
        <div className="space-y-4 mb-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{stats.total_clicks}</p>
              <p className="text-xs text-blue-600">Total Clicks</p>
            </div>
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-center">
              <p className="text-2xl font-bold text-indigo-700">{stats.unique_clickers}</p>
              <p className="text-xs text-indigo-600">Unique IPs</p>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{stats.days_active}</p>
              <p className="text-xs text-green-600">Days Active</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
              <p className="text-sm font-medium text-gray-700 truncate">{stats.last_clicked ? new Date(stats.last_clicked).toLocaleDateString() : '—'}</p>
              <p className="text-xs text-gray-500">Last Click</p>
            </div>
          </div>

          {/* Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.devices && stats.devices.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1 uppercase">Devices</p>
                <BreakdownBar items={stats.devices} />
              </div>
            )}
            {stats.browsers && stats.browsers.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1 uppercase">Browsers</p>
                <BreakdownBar items={stats.browsers} />
              </div>
            )}
            {stats.os && stats.os.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1 uppercase">Operating Systems</p>
                <BreakdownBar items={stats.os} />
              </div>
            )}
            {stats.countries && stats.countries.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1 uppercase">Countries</p>
                <BreakdownBar items={stats.countries} />
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Click events table */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Click Log ({totalClicks} total)</p>
        {/* Header */}
        <div className="grid grid-cols-6 gap-2 text-xs font-semibold text-gray-500 px-3 pb-1 border-b border-gray-200">
          <div>IP Address</div>
          <div>Device</div>
          <div>Browser</div>
          <div>OS</div>
          <div>Location</div>
          <div>Time</div>
        </div>

        {clicksLoading ? (
          <p className="text-sm text-gray-500 py-4 text-center">Loading...</p>
        ) : clicks.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No clicks recorded yet.</p>
        ) : (
          <div className="space-y-1 mt-1 max-h-80 overflow-y-auto">
            {clicks.map(event => (
              <ClickEventRow key={event.id} event={event} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalClicks > limit && (
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="text-xs text-indigo-600 hover:text-indigo-800 disabled:text-gray-300 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <span className="text-xs text-gray-500">
              Page {page + 1} of {Math.ceil(totalClicks / limit)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * limit >= totalClicks}
              className="text-xs text-indigo-600 hover:text-indigo-800 disabled:text-gray-300 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </SectionCard>
  )
}

/* ────────────────────────────────────────────────────────────────────
   TRACKING LINK ROW
   ──────────────────────────────────────────────────────────────────── */
interface LinkRowProps {
  readonly link: TrackingLink
  readonly onEdit: (link: TrackingLink) => void
  readonly onDelete: (id: number) => void
  readonly onSnippet: (link: TrackingLink) => void
  readonly onClicks: (link: TrackingLink) => void
  readonly onInsert?: (link: TrackingLink) => void
  readonly isDeleting: boolean
}

function LinkRow({ link, onEdit, onDelete, onSnippet, onClicks, onInsert, isDeleting }: LinkRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">{link.name || 'Unnamed'}</span>
          {link.clicked && (
            <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">Clicked</span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">{link.original_url}</p>
        {link.tags && link.tags.length > 0 && (
          <div className="flex gap-1 mt-1">
            {link.tags.map((tag) => (
              <span key={tag} className="text-xs bg-indigo-50 text-indigo-600 rounded px-1.5 py-0.5">{tag}</span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {onInsert && (
          <button
            onClick={() => onInsert(link)}
            className="rounded-lg px-2 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100"
            title="Insert into HTML"
          >
            + Insert
          </button>
        )}
        <button
          onClick={() => onClicks(link)}
          className="rounded-lg px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
          title="View click data"
        >
          📊 Clicks
        </button>
        <button
          onClick={() => onSnippet(link)}
          className="rounded-lg px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
          title="Get HTML snippet"
        >
          📋 HTML
        </button>
        <button
          onClick={() => onEdit(link)}
          className="rounded-lg px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-300"
          title="Edit"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(link.id)}
          disabled={isDeleting}
          className="rounded-lg px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
          title="Delete"
        >
          🗑
        </button>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────
   MAIN PAGE
   ──────────────────────────────────────────────────────────────────── */
export default function TrackingLinksPage() {
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const { data: linksRes, isLoading } = useTrackingLinks({ search: search || undefined, tag: tagFilter || undefined })
  const deleteMutation = useDeleteTrackingLink()

  const links = linksRes?.data ?? []

  // Collect all unique tags for the filter dropdown
  const allTags = useMemo(() => {
    const set = new Set<string>()
    links.forEach(l => l.tags?.forEach(t => set.add(t)))
    return [...set].sort()
  }, [links])

  const [formMode, setFormMode] = useState<'closed' | 'create' | 'edit'>('closed')
  const [editingLink, setEditingLink] = useState<TrackingLink | null>(null)
  const [snippetLink, setSnippetLink] = useState<TrackingLink | null>(null)
  const [clicksLink, setClicksLink] = useState<TrackingLink | null>(null)

  const handleEdit = (link: TrackingLink) => {
    setEditingLink(link)
    setFormMode('edit')
  }

  const handleCloseForm = () => {
    setFormMode('closed')
    setEditingLink(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tracking Links</h1>
          <p className="text-sm text-gray-500 mt-1">
            {links.length} link{links.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setFormMode('create'); setEditingLink(null) }}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span> New Link
        </button>
      </div>

      {/* Create / Edit form */}
      {formMode !== 'closed' && (
        <div className="mb-6">
          <LinkForm initial={editingLink} onClose={handleCloseForm} />
        </div>
      )}

      {/* HTML Snippet panel */}
      {snippetLink && (
        <div className="mb-6">
          <HtmlSnippetPanel link={snippetLink} onClose={() => setSnippetLink(null)} />
        </div>
      )}

      {/* Click Details panel */}
      {clicksLink && (
        <div className="mb-6">
          <ClickDetailsPanel link={clicksLink} onClose={() => setClicksLink(null)} />
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or description..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
        {allTags.length > 0 && (
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">All tags</option>
            {allTags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
      </div>

      {/* Links list */}
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : links.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <p className="text-4xl mb-3">🔗</p>
          <p className="text-sm text-gray-500 mb-4">No tracking links yet. Create one to start tracking clicks.</p>
          <button
            onClick={() => setFormMode('create')}
            className="rounded-lg px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
          >
            Create Tracking Link
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {links.map(link => (
            <LinkRow
              key={link.id}
              link={link}
              onEdit={handleEdit}
              onDelete={(id) => deleteMutation.mutate(id)}
              onSnippet={setSnippetLink}
              onClicks={setClicksLink}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────
   EMBEDDABLE PANEL for Campaign Page
   ──────────────────────────────────────────────────────────────────── */
interface TrackingLinksPanelProps {
  readonly onInsertHtml: (html: string) => void
}

export function TrackingLinksPanel({ onInsertHtml }: TrackingLinksPanelProps) {
  const { data: linksRes, isLoading } = useTrackingLinks()
  const createMutation = useCreateTrackingLink()
  const links = linksRes?.data ?? []

  const [showCreate, setShowCreate] = useState(false)
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [linkText, setLinkText] = useState('Click here')

  const handleCreate = () => {
    createMutation.mutate(
      { original_url: url, name: name || undefined },
      {
        onSuccess: () => {
          setUrl('')
          setName('')
          setShowCreate(false)
        },
      },
    )
  }

  const handleInsert = async (link: TrackingLink) => {
    try {
      const res = await trackingLinksApi.getHtml(link.id, { linkText })
      onInsertHtml(res.data.html)
    } catch { /* ignore */ }
  }

  return (
    <SectionCard
      title={`Tracking Links (${links.length})`}
      icon="🔗"
      actions={
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {showCreate ? 'Cancel' : '+ New'}
        </button>
      }
    >
      {/* Quick create section */}
      {showCreate && (
        <div className="mb-3 pb-3 border-b border-gray-100 space-y-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/landing"
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Link name (optional)"
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <button
            onClick={handleCreate}
            disabled={!url.trim() || createMutation.isPending}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 w-full"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Tracking Link'}
          </button>
        </div>
      )}

      {/* Link text config */}
      <div className="mb-2 flex items-center gap-2">
        <label className="text-xs text-gray-500 shrink-0">Link text:</label>
        <input
          type="text"
          value={linkText}
          onChange={(e) => setLinkText(e.target.value)}
          className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      {/* Links list */}
      {isLoading ? (
        <p className="text-xs text-gray-500">Loading...</p>
      ) : links.length === 0 ? (
        <p className="text-xs text-gray-500">No tracking links. Create one above.</p>
      ) : (
        <div className="max-h-52 overflow-y-auto space-y-1">
          {links.map(link => (
            <div key={link.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100 group">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-800 truncate">{link.name || 'Unnamed'}</p>
                <p className="text-gray-400 truncate">{link.original_url}</p>
              </div>
              <button
                onClick={() => handleInsert(link)}
                className="ml-2 shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Insert into HTML content"
              >
                + Insert
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-2">
        Click "Insert" to add the tracking link HTML into your email content.
      </p>
    </SectionCard>
  )
}
