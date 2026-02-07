import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as namesApi from '../api/names'
import type { Name } from '../api/types'

export const useNames = () =>
  useQuery({ queryKey: ['names'], queryFn: namesApi.getAll })

export const useName = (id: number | undefined) =>
  useQuery({ queryKey: ['names', id], queryFn: () => namesApi.getById(id!), enabled: !!id })

export const useCreateName = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Name, 'id' | 'created_at'>) => namesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['names'] }),
  })
}

export const useUpdateName = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<Name, 'id' | 'created_at'>> }) =>
      namesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['names'] }),
  })
}

export const useDeleteName = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => namesApi.deleteById(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['names'] }),
  })
}
