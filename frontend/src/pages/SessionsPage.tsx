import { useState } from 'react'
import type { UserSession } from '../api/types'
import DataTable from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ErrorAlert from '../components/ui/ErrorAlert'
import Pagination from '../components/ui/Pagination'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as sessionsApi from '../api/sessions'

const columns: Column<UserSession>[] = [
  { key: 'id', header: 'ID' },
  { key: 'email', header: 'Email' },
  { key: 'ip_address', header: 'IP Address' },
  { key: 'user_agent', header: 'User Agent', render: (item) => (
    <div className="max-w-xs truncate" title={item.user_agent || undefined}>
      {item.user_agent || '-'}
    </div>
  )},
  { key: 'last_activity', header: 'Last Activity', render: (item) => new Date(item.last_activity).toLocaleString() },
  { key: 'created_at', header: 'Created At', render: (item) => new Date(item.created_at).toLocaleString() },
  { key: 'expires_at', header: 'Expires At', render: (item) => item.expires_at ? new Date(item.expires_at).toLocaleString() : '-' },
]

export default function SessionsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const limit = 50

  const { data, isLoading, error } = useQuery({
    queryKey: ['sessions', { limit, page }],
    queryFn: () => sessionsApi.getAll({ limit, page })
  })

  const deleteMutation = useMutation({
    mutationFn: sessionsApi.deleteById,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] })
  })

  const [deleteItem, setDeleteItem] = useState<UserSession | null>(null)
  const [mutationError, setMutationError] = useState('')

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
          <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
          {data?.count != null && (
            <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {data.count}
            </span>
          )}
        </div>
      </div>

      {mutationError && <ErrorAlert message={mutationError} onClose={() => setMutationError('')} />}

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        onDelete={setDeleteItem}
      />

      {data && data.count > limit && (
        <Pagination
          offset={(page - 1) * limit}
          limit={limit}
          total={data.count}
          onPageChange={(newOffset: number) => setPage(Math.floor(newOffset / limit) + 1)}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteItem}
        title="Delete Session"
        message={`Are you sure you want to delete this session for "${deleteItem?.email}"? This will log out the user.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
