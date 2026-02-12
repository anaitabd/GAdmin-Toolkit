import { useState } from 'react'
import type { Role, UserRole } from '../api/types'
import DataTable from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ErrorAlert from '../components/ui/ErrorAlert'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as rolesApi from '../api/roles'

const columns: Column<UserRole>[] = [
  { key: 'id', header: 'ID' },
  { key: 'user_email', header: 'User Email' },
  { key: 'assigned_at', header: 'Assigned At', render: (item) => new Date(item.assigned_at).toLocaleDateString() },
]

export default function UsersByRolePage() {
  const queryClient = useQueryClient()
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)

  const { data: roles } = useQuery({
    queryKey: ['roles', { limit: 1000 }],
    queryFn: () => rolesApi.getAll({ limit: 1000 })
  })

  const { data: userRoles, isLoading, error } = useQuery({
    queryKey: ['user-roles-by-role', selectedRoleId],
    queryFn: () => rolesApi.getUserRoles({ role_id: selectedRoleId!, limit: 1000 }),
    enabled: !!selectedRoleId
  })

  const unassignMutation = useMutation({
    mutationFn: ({ user_id, role_id }: { user_id: number; role_id: number }) => 
      rolesApi.unassignRole(user_id, role_id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-roles-by-role', selectedRoleId] })
  })

  const [deleteItem, setDeleteItem] = useState<UserRole | null>(null)
  const [mutationError, setMutationError] = useState('')

  const handleUnassign = () => {
    if (!deleteItem) return
    setMutationError('')
    unassignMutation.mutate({ user_id: deleteItem.user_id, role_id: deleteItem.role_id }, {
      onSuccess: () => setDeleteItem(null),
      onError: (err) => {
        setDeleteItem(null)
        setMutationError(err instanceof Error ? err.message : 'Remove failed')
      },
    })
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users by Role</h1>
        <p className="mt-1 text-sm text-gray-600">View all users assigned to each role</p>
      </div>

      {mutationError && <ErrorAlert message={mutationError} onClose={() => setMutationError('')} />}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
        <select 
          value={selectedRoleId ?? ''} 
          onChange={e => setSelectedRoleId(e.target.value ? parseInt(e.target.value) : null)}
          className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="">-- Select a role --</option>
          {roles?.data?.map((role: Role) => (
            <option key={role.id} value={role.id}>{role.name} ({role.user_count || 0} users)</option>
          ))}
        </select>
      </div>

      {selectedRoleId && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Users</h2>
            {userRoles?.count != null && (
              <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                {userRoles.count}
              </span>
            )}
          </div>

          {error && <ErrorAlert message={error.message} />}

          <DataTable
            columns={columns}
            data={userRoles?.data ?? []}
            isLoading={isLoading}
            onDelete={setDeleteItem}
          />
        </>
      )}

      {!selectedRoleId && (
        <div className="text-center py-12 text-gray-500">
          Please select a role to view assigned users
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteItem}
        title="Remove User from Role"
        message="Are you sure you want to remove this user from the role?"
        confirmLabel="Remove"
        onConfirm={handleUnassign}
        onCancel={() => setDeleteItem(null)}
        isPending={unassignMutation.isPending}
      />
    </div>
  )
}
