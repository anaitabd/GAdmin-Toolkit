import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as campaignTemplatesApi from '../api/campaignTemplates'

export function useCampaignTemplates() {
  return useQuery({
    queryKey: ['campaign-templates'],
    queryFn: campaignTemplatesApi.getAll,
  })
}

export function useActiveCampaignTemplates() {
  return useQuery({
    queryKey: ['campaign-templates', 'active'],
    queryFn: campaignTemplatesApi.getActive,
  })
}

export function useCampaignTemplate(id: number | undefined) {
  return useQuery({
    queryKey: ['campaign-templates', id],
    queryFn: () => campaignTemplatesApi.getById(id!),
    enabled: !!id,
  })
}

export function useCreateCampaignTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: campaignTemplatesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-templates'] })
    },
  })
}

export function useUpdateCampaignTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof campaignTemplatesApi.update>[1] }) =>
      campaignTemplatesApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-templates'] })
      queryClient.invalidateQueries({ queryKey: ['campaign-templates', variables.id] })
    },
  })
}

export function useDeleteCampaignTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: campaignTemplatesApi.deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-templates'] })
    },
  })
}
