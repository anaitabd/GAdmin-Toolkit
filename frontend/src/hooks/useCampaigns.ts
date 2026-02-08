import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as campaignsApi from '../api/campaigns'

export function useCampaigns(params?: { status?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['campaigns', params],
    queryFn: () => campaignsApi.getAll(params),
  })
}

export function useCampaign(id: number | undefined) {
  return useQuery({
    queryKey: ['campaigns', id],
    queryFn: () => campaignsApi.getById(id!),
    enabled: !!id,
  })
}

export function useCampaignStats(id: number | undefined) {
  return useQuery({
    queryKey: ['campaigns', id, 'stats'],
    queryFn: () => campaignsApi.getStats(id!),
    enabled: !!id,
    refetchInterval: 5000, // Refresh every 5 seconds for active campaigns
  })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: campaignsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof campaignsApi.update>[1] }) =>
      campaignsApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.id] })
    },
  })
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: campaignsApi.deleteCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}

export function useCloneCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: campaignsApi.clone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}
