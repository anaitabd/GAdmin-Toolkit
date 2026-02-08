import type { ReactNode } from 'react'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from './LoadingSpinner'
import EmptyState from './EmptyState'

export interface Column<T> {
  key: string
  header: string
  render?: (item: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading: boolean
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
}

export default function DataTable<T extends { id: number }>({
  columns,
  data,
  isLoading,
  onEdit,
  onDelete,
}: DataTableProps<T>) {
  if (isLoading) return <LoadingSpinner />
  if (!data.length) return <EmptyState />

  const hasActions = onEdit || onDelete

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500"
              >
                {col.header}
              </th>
            ))}
            {hasActions && (
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.map((item, idx) => (
            <tr key={item.id} className={idx % 2 === 1 ? 'bg-gray-50' : ''}>
              {columns.map(col => (
                <td key={col.key} className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                  {col.render
                    ? col.render(item)
                    : String((item as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
              {hasActions && (
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                  <div className="flex justify-end gap-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
