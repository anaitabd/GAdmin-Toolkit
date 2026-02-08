import { useState } from 'react'
import { LinkIcon, PlusIcon, TrashIcon, PencilIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import {
  useTrackingLinks,
  useCreateTrackingLink,
  useUpdateTrackingLink,
  useDeleteTrackingLink,
} from '../hooks/useTrackingLinks'
import type { TrackingLink } from '../api/types'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorAlert from '../components/ui/ErrorAlert'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'

export default function TrackingLinksPage() {
  const { data, isLoading, error } = useTrackingLinks()
  const createMutation = useCreateTrackingLink()
  const updateMutation = useUpdateTrackingLink()
  const deleteMutation = useDeleteTrackingLink()

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedLink, setSelectedLink] = useState<TrackingLink | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const [form, setForm] = useState({ offer_url: '', name: '', short_code: '' })

  const handleCreate = () => {
    createMutation.mutate(
      { 
        offer_url: form.offer_url, 
        name: form.name || undefined,
        short_code: form.short_code || undefined 
      },
      {
        onSuccess: () => {
          setCreateModalOpen(false)
          setForm({ offer_url: '', name: '', short_code: '' })
        },
      }
    )
  }

  const handleEdit = () => {
    if (!selectedLink) return
    updateMutation.mutate(
      {
        id: selectedLink.id,
        data: { 
          offer_url: form.offer_url, 
          name: form.name || undefined 
        },
      },
      {
        onSuccess: () => {
          setEditModalOpen(false)
          setSelectedLink(null)
        },
      }
    )
  }

  const handleDelete = () => {
    if (!selectedLink) return
    deleteMutation.mutate(selectedLink.id, {
      onSuccess: () => {
        setDeleteModalOpen(false)
        setSelectedLink(null)
      },
    })
  }

  const handleToggleActive = (link: TrackingLink) => {
    updateMutation.mutate({
      id: link.id,
      data: { active: !link.active },
    })
  }

  const handleCopyLink = (link: TrackingLink) => {
    const baseUrl = window.location.origin
    const fullUrl = `${baseUrl}/t/${link.short_code}`
    navigator.clipboard.writeText(fullUrl)
    setCopiedId(link.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const openEditModal = (link: TrackingLink) => {
    setSelectedLink(link)
    setForm({ offer_url: link.offer_url, name: link.name || '', short_code: link.short_code })
    setEditModalOpen(true)
  }

  const openDeleteModal = (link: TrackingLink) => {
    setSelectedLink(link)
    setDeleteModalOpen(true)
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error.message} />

  const links = data?.data.data || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tracking Links</h1>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <PlusIcon className="h-5 w-5" />
          Create Link
        </button>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-gray-200 bg-white">
          <LinkIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No tracking links</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new tracking link.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Short Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Offer URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Clicks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {links.map((link) => (
                <tr key={link.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-gray-100 px-2 py-1 text-sm font-mono text-gray-900">
                        {link.short_code}
                      </code>
                      <button
                        onClick={() => handleCopyLink(link)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Copy link"
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      </button>
                      {copiedId === link.id && (
                        <span className="text-xs text-green-600 font-medium">Copied!</span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {link.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="max-w-md truncate" title={link.offer_url}>
                      {link.offer_url}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {link.clicks || 0}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(link)}
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        link.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {link.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <button
                      onClick={() => openEditModal(link)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(link)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Tracking Link"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Offer URL *
            </label>
            <input
              type="url"
              value={form.offer_url}
              onChange={(e) => setForm({ ...form, offer_url: e.target.value })}
              placeholder="https://example.com/offer"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name (Optional)
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Campaign Name"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Short Code (Optional)
            </label>
            <input
              type="text"
              value={form.short_code}
              onChange={(e) => setForm({ ...form, short_code: e.target.value })}
              placeholder="auto-generated"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to auto-generate a random code
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCreate}
              disabled={!form.offer_url || createMutation.isPending}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
            <button
              onClick={() => setCreateModalOpen(false)}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Tracking Link"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Offer URL *
            </label>
            <input
              type="url"
              value={form.offer_url}
              onChange={(e) => setForm({ ...form, offer_url: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Short Code
            </label>
            <input
              type="text"
              value={form.short_code}
              disabled
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Short code cannot be changed</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleEdit}
              disabled={!form.offer_url || updateMutation.isPending}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setEditModalOpen(false)}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Tracking Link"
        message={`Are you sure you want to delete this tracking link? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
