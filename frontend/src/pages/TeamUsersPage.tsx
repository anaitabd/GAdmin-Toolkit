import { useState } from 'react'
import type { Team, TeamMember, User } from '../api/types'
import DataTable from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ErrorAlert from '../components/ui/ErrorAlert'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as teamsApi from '../api/teams'
import * as usersApi from '../api/users'

const columns: Column<TeamMember>[] = [
  { key: 'id', header: 'ID' },
  { key: 'user_email', header: 'User Email' },
  { key: 'added_at', header: 'Added At', render: (item) => new Date(item.added_at).toLocaleDateString() },
]

function AddMemberForm({ teamId, onSubmit, onCancel, isPending }: {
  teamId: number
  onSubmit: (data: any) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [userId, setUserId] = useState('')

  const { data: users } = useQuery({
    queryKey: ['users', { limit: 1000 }],
    queryFn: () => usersApi.getAll({ limit: 1000 })
  })

  const canSubmit = userId && !isPending

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Select User *</label>
        <select value={userId} onChange={e => setUserId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="">-- Select a user --</option>
          {users?.data?.map((user: User) => (
            <option key={user.id} value={user.id}>{user.email}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button type="button" onClick={onCancel} disabled={isPending}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50">
          Cancel
        </button>
        <button type="button" onClick={() => onSubmit({ user_id: parseInt(userId) })} disabled={!canSubmit}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
          {isPending ? 'Adding...' : 'Add Member'}
        </button>
      </div>
    </div>
  )
}

export default function TeamUsersPage() {
  const queryClient = useQueryClient()
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)

  const { data: teams } = useQuery({
    queryKey: ['teams', { limit: 1000 }],
    queryFn: () => teamsApi.getAll({ limit: 1000 })
  })

  const { data: members, isLoading, error } = useQuery({
    queryKey: ['team-members', selectedTeamId],
    queryFn: () => teamsApi.getMembers(selectedTeamId!),
    enabled: !!selectedTeamId
  })

  const addMutation = useMutation({
    mutationFn: (data: { user_id: number }) => teamsApi.addMember(selectedTeamId!, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-members', selectedTeamId] })
  })

  const deleteMutation = useMutation({
    mutationFn: (userId: number) => teamsApi.removeMember(selectedTeamId!, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-members', selectedTeamId] })
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState<TeamMember | null>(null)
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
    deleteMutation.mutate(deleteItem.user_id, {
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
        <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
        <p className="mt-1 text-sm text-gray-600">Assign users to teams</p>
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
              <h2 className="text-lg font-semibold text-gray-900">Members</h2>
              {members?.count != null && (
                <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                  {members.count}
                </span>
              )}
            </div>
            <button onClick={openAdd}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
              Add Member
            </button>
          </div>

          {error && <ErrorAlert message={error.message} />}

          <DataTable
            columns={columns}
            data={members?.data ?? []}
            isLoading={isLoading}
            onDelete={setDeleteItem}
          />
        </>
      )}

      {!selectedTeamId && (
        <div className="text-center py-12 text-gray-500">
          Please select a team to view members
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title="Add Member">
        <AddMemberForm
          teamId={selectedTeamId!}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isPending={addMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteItem}
        title="Remove Member"
        message="Are you sure you want to remove this member from the team?"
        confirmLabel="Remove"
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
