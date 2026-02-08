import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as emailDataApi from '../api/emailData'
import type { EmailData, ListFilters } from '../api/types'

export const useEmailData = (filters?: ListFilters) =>
  useQuery({ queryKey: ['email-data', filters], queryFn: () => emailDataApi.getAll(filters) })

export const useEmailDataItem = (id: number | undefined) =>
  useQuery({ queryKey: ['email-data', id], queryFn: () => emailDataApi.getById(id!), enabled: !!id })

export const useEmailDataGeos = () =>
  useQuery({ queryKey: ['email-data', 'geos'], queryFn: () => emailDataApi.getGeos() })

export const useEmailDataListNames = () =>
  useQuery({ queryKey: ['email-data', 'list-names'], queryFn: () => emailDataApi.getListNames() })

export const useCreateEmailData = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<EmailData, 'id' | 'created_at'>) => emailDataApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-data'] }),
  })
}

export const useUpdateEmailData = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<EmailData, 'id' | 'created_at'>> }) =>
      emailDataApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-data'] }),
  })
}

export const useDeleteEmailData = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => emailDataApi.deleteById(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-data'] }),
  })
}

export const useBulkDeleteEmailData = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: number[]) => emailDataApi.bulkDelete(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-data'] }),
  })
}

export const useDeleteAllEmailData = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => emailDataApi.deleteAll(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-data'] }),
  })
}
