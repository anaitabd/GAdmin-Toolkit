import { useState } from 'react'
import type { User, Role, UserRole } from '../api/types'
import DataTable from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ErrorAlert from '../components/ui/ErrorAlert'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as rolesApi from '../api/roles'
import * as usersApi from '../api/users'

const columns: Column<UserRole>[] = [
  { key: 'id', header: 'ID' },
  { key: 'user_email', header: 'User Email' },
  { key: 'role_name', header: 'Role' },
  { key: 'assigned_at', header: 'Assigned At', render: (item) => new Date(item.assigned_at).toLocaleDateString() },
]

function AssignRoleForm({ onSubmit, onCancel, isPending }: {
  onSubmit: (data: any) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [userId, setUserId] = useState('')
  const [roleId, setRoleId] = useState('')

  const { data: users } = useQuery({
    queryKey: ['users', { limit: 1000 }],
    queryFn: () => usersApi.getAll({ limit: 1000 })
  })

  const { data: roles } = useQuery({
    queryKey: ['roles', { limit: 1000 }],
    queryFn: () => rolesApi.getAll({ limit: 1000 })
  })

  const canSubmit = userId && roleId && !isPending

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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Role *</label>
        <select value={roleId} onChange={e => setRoleId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="">-- Select a role --</option>
          {roles?.data?.map((role: Role) => (
            <option key={role.id} value={role.id}>{role.name}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button type="button" onClick={onCancel} disabled={isPending}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50">
          Cancel
        </button>
        <button type="button" onClick={() => onSubmit({ user_id: parseInt(userId), role_id: parseInt(roleId) })} disabled={!canSubmit}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
          {isPending ? 'Assigning...' : 'Assign Role'}
        </button>
      </div>
    </div>
  )
}

export default function AssignRolesPage() {
  const queryClient = useQueryClient()

  const { data: userRoles, isLoading, error } = useQuery({
    queryKey: ['user-roles'],
    queryFn: () => rolesApi.getUserRoles({ limit: 1000 })
  })

  const assignMutation = useMutation({
    mutationFn: rolesApi.assignRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-roles'] })
  })

  const unassignMutation = useMutation({
    mutationFn: ({ user_id, role_id }: { user_id: number; role_id: number }) => 
      rolesApi.unassignRole(user_id, role_id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-roles'] })
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState<UserRole | null>(null)
  const [mutationError, setMutationError] = useState('')

  const openAssign = () => setModalOpen(true)
  const closeModal = () => setModalOpen(false)

  const handleSubmit = (formData: any) => {
    setMutationError('')
    assignMutation.mutate(formData, {
      onSuccess: closeModal,
      onError: (err) => setMutationError(err instanceof Error ? err.message : 'Assignment failed'),
    })
  }

  const handleUnassign = () => {
    if (!deleteItem) return
    setMutationError('')
    unassignMutation.mutate({ user_id: deleteItem.user_id, role_id: deleteItem.role_id }, {
      onSuccess: () => setDeleteItem(null),
      onError: (err) => {
        setDeleteItem(null)
        setMutationError(err instanceof Error ? err.message : 'Unassignment failed')
      },
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assign Roles to Users</h1>
          <p className="mt-1 text-sm text-gray-600">Manage user role assignments</p>
        </div>
        <button onClick={openAssign}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
          Assign Role
        </button>
      </div>

      {mutationError && <ErrorAlert message={mutationError} onClose={() => setMutationError('')} />}

      {error && <ErrorAlert message={error.message} />}

      <DataTable
        columns={columns}
        data={userRoles?.data ?? []}
        isLoading={isLoading}
        onDelete={setDeleteItem}
      />

      <Modal isOpen={modalOpen} onClose={closeModal} title="Assign Role">
        <AssignRoleForm
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isPending={assignMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteItem}
        title="Unassign Role"
        message="Are you sure you want to unassign this role from the user?"
        confirmLabel="Unassign"
        onConfirm={handleUnassign}
        onCancel={() => setDeleteItem(null)}
        isPending={unassignMutation.isPending}
      />
    </div>
  )
}
