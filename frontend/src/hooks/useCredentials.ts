import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as credentialsApi from '../api/credentials'
import type { Credential } from '../api/types'

export const useCredentials = () =>
  useQuery({ queryKey: ['credentials'], queryFn: credentialsApi.getAll })

export const useCredential = (id: number | undefined) =>
  useQuery({ queryKey: ['credentials', id], queryFn: () => credentialsApi.getById(id!), enabled: !!id })

export const useActiveCredential = () =>
  useQuery({ queryKey: ['credentials', 'active'], queryFn: credentialsApi.getActive })

export const useCreateCredential = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Credential, 'id' | 'created_at' | 'updated_at'>) => credentialsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['credentials'] }),
  })
}

export const useUpdateCredential = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<Credential, 'id' | 'created_at' | 'updated_at'>> }) =>
      credentialsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['credentials'] }),
  })
}

export const useDeleteCredential = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => credentialsApi.deleteById(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['credentials'] }),
  })
}
