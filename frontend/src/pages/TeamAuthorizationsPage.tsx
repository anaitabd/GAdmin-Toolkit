import { useState } from 'react'
import type { Team, TeamAuthorization } from '../api/types'
import DataTable from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ErrorAlert from '../components/ui/ErrorAlert'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as teamsApi from '../api/teams'

const columns: Column<TeamAuthorization>[] = [
  { key: 'id', header: 'ID' },
  { key: 'resource_type', header: 'Resource Type' },
  { key: 'resource_id', header: 'Resource ID' },
  { key: 'created_at', header: 'Created At', render: (item) => new Date(item.created_at).toLocaleDateString() },
]

function AuthorizationForm({ teamId, onSubmit, onCancel, isPending }: {
  teamId: number
  onSubmit: (data: any) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [resourceType, setResourceType] = useState('offer')
  const [resourceId, setResourceId] = useState('')

  const canSubmit = resourceType && resourceId && !isPending

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type *</label>
        <select value={resourceType} onChange={e => setResourceType(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="offer">Offer</option>
          <option value="campaign">Campaign</option>
          <option value="data_list">Data List</option>
          <option value="blacklist">Blacklist</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Resource ID *</label>
        <input type="number" value={resourceId} onChange={e => setResourceId(e.target.value)}
          placeholder="Enter resource ID"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button type="button" onClick={onCancel} disabled={isPending}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50">
          Cancel
        </button>
        <button type="button" onClick={() => onSubmit({ resource_type: resourceType, resource_id: parseInt(resourceId) })} disabled={!canSubmit}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
          {isPending ? 'Adding...' : 'Add Authorization'}
        </button>
      </div>
    </div>
  )
}

export default function TeamAuthorizationsPage() {
  const queryClient = useQueryClient()
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)

  const { data: teams } = useQuery({
    queryKey: ['teams', { limit: 1000 }],
    queryFn: () => teamsApi.getAll({ limit: 1000 })
  })

  const { data: authorizations, isLoading, error } = useQuery({
    queryKey: ['team-authorizations', selectedTeamId],
    queryFn: () => teamsApi.getAuthorizations(selectedTeamId!),
    enabled: !!selectedTeamId
  })

  const addMutation = useMutation({
    mutationFn: (data: { resource_type: string; resource_id: number }) => 
      teamsApi.addAuthorization(selectedTeamId!, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-authorizations', selectedTeamId] })
  })

  const deleteMutation = useMutation({
    mutationFn: (authId: number) => teamsApi.removeAuthorization(selectedTeamId!, authId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-authorizations', selectedTeamId] })
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState<TeamAuthorization | null>(null)
  const [mutationError, setMutationError] = useState('')

  const openAdd = () => setModalOpen(true)
  const closeModal = () => setModalOpen(false)

  const handleSubmit = (formData: any) => {
    setMutationError('')
    addMutation.mutate(formData, {
      onSuccess: closeModal,
      onError: (err) => setMutationError(err instanceof Error ? err.message : 'Add failed'),
    })
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Team Authorizations</h1>
        <p className="mt-1 text-sm text-gray-600">Manage resource authorizations for teams</p>
      </div>

      {mutationError && <ErrorAlert message={mutationError} onClose={() => setMutationError('')} />}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Team</label>
        <select 
          value={selectedTeamId ?? ''} 
          onChange={e => setSelectedTeamId(e.target.value ? parseInt(e.target.value) : null)}
          className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="">-- Select a team --</option>
          {teams?.data?.map((team: Team) => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>
      </div>

      {selectedTeamId && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Authorizations</h2>
              {authorizations?.count != null && (
                <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                  {authorizations.count}
                </span>
              )}
            </div>
            <button onClick={openAdd}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
              Add Authorization
            </button>
          </div>

          {error && <ErrorAlert message={error.message} />}

          <DataTable
            columns={columns}
            data={authorizations?.data ?? []}
            isLoading={isLoading}
            onDelete={setDeleteItem}
          />
        </>
      )}

      {!selectedTeamId && (
        <div className="text-center py-12 text-gray-500">
          Please select a team to view authorizations
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title="Add Authorization">
        <AuthorizationForm
          teamId={selectedTeamId!}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isPending={addMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteItem}
        title="Remove Authorization"
        message="Are you sure you want to remove this authorization?"
        confirmLabel="Remove"
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
