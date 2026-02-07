import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as emailTemplatesApi from '../api/emailTemplates'
import type { EmailTemplate } from '../api/types'

export const useEmailTemplates = () =>
  useQuery({ queryKey: ['email-templates'], queryFn: emailTemplatesApi.getAll })

export const useEmailTemplate = (id: number | undefined) =>
  useQuery({ queryKey: ['email-templates', id], queryFn: () => emailTemplatesApi.getById(id!), enabled: !!id })

export const useActiveEmailTemplate = () =>
  useQuery({ queryKey: ['email-templates', 'active'], queryFn: emailTemplatesApi.getActive })

export const useCreateEmailTemplate = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<EmailTemplate, 'id' | 'created_at'>) => emailTemplatesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-templates'] }),
  })
}

export const useUpdateEmailTemplate = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<EmailTemplate, 'id' | 'created_at'>> }) =>
      emailTemplatesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-templates'] }),
  })
}

export const useDeleteEmailTemplate = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => emailTemplatesApi.deleteById(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-templates'] }),
  })
}
