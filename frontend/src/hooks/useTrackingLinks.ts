import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/trackingLinks'

export function useTrackingLinks() {
  return useQuery({
    queryKey: ['tracking-links'],
    queryFn: api.getTrackingLinks,
  })
}

export function useTrackingLink(id: number) {
  return useQuery({
    queryKey: ['tracking-links', id],
    queryFn: () => api.getTrackingLink(id),
    enabled: !!id,
  })
}

export function useTrackingClicks(id: number) {
  return useQuery({
    queryKey: ['tracking-clicks', id],
    queryFn: () => api.getTrackingClicks(id),
    enabled: !!id,
  })
}

export function useCreateTrackingLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.createTrackingLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-links'] })
    },
  })
}

export function useUpdateTrackingLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof api.updateTrackingLink>[1] }) =>
      api.updateTrackingLink(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-links'] })
    },
  })
}

export function useDeleteTrackingLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.deleteTrackingLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-links'] })
    },
  })
}
