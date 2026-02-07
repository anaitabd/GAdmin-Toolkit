import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as usersApi from '../api/users'
import type { User } from '../api/types'

export const useUsers = () =>
  useQuery({ queryKey: ['users'], queryFn: usersApi.getAll })

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
