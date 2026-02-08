import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as usersApi from '../api/users'
import type { User, ListFilters } from '../api/types'

export const useUsers = (filters?: ListFilters) =>
  useQuery({ queryKey: ['users', filters], queryFn: () => usersApi.getAll(filters) })

export const useUser = (id: number | undefined) =>
  useQuery({ queryKey: ['users', id], queryFn: () => usersApi.getById(id!), enabled: !!id })

export const useCreateUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<User, 'id' | 'created_at'>) => usersApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export const useUpdateUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<User, 'id' | 'created_at'>> }) =>
      usersApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export const useDeleteUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => usersApi.deleteById(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export const useBulkDeleteUsers = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: number[]) => usersApi.bulkDelete(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export const useDeleteAllUsers = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => usersApi.deleteAll(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}
