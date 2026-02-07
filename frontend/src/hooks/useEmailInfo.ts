import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as emailInfoApi from '../api/emailInfo'
import type { EmailInfo } from '../api/types'

export const useEmailInfo = () =>
  useQuery({ queryKey: ['email-info'], queryFn: emailInfoApi.getAll })

export const useEmailInfoItem = (id: number | undefined) =>
  useQuery({ queryKey: ['email-info', id], queryFn: () => emailInfoApi.getById(id!), enabled: !!id })

export const useActiveEmailInfo = () =>
  useQuery({ queryKey: ['email-info', 'active'], queryFn: emailInfoApi.getActive })

export const useCreateEmailInfo = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<EmailInfo, 'id' | 'created_at'>) => emailInfoApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-info'] }),
  })
}

export const useUpdateEmailInfo = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<EmailInfo, 'id' | 'created_at'>> }) =>
      emailInfoApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-info'] }),
  })
}

export const useDeleteEmailInfo = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => emailInfoApi.deleteById(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-info'] }),
  })
}
