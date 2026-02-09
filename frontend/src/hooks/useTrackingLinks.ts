import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as trackingLinksApi from '../api/trackingLinks'
import type { TrackingLinkFilters } from '../api/types'

export const useTrackingLinks = (filters: TrackingLinkFilters = {}) =>
  useQuery({ queryKey: ['tracking-links', filters], queryFn: () => trackingLinksApi.getAll(filters) })

export const useTrackingLink = (id: number | undefined) =>
  useQuery({ queryKey: ['tracking-links', id], queryFn: () => trackingLinksApi.getById(id!), enabled: !!id })

export const useTrackingLinkHtml = (id: number | undefined, params?: { linkText?: string; target?: string; style?: string }) =>
  useQuery({
    queryKey: ['tracking-links', id, 'html', params],
    queryFn: () => trackingLinksApi.getHtml(id!, params),
    enabled: !!id,
  })

export const useTrackingLinkStats = (id: number | undefined) =>
  useQuery({
    queryKey: ['tracking-links', id, 'stats'],
    queryFn: () => trackingLinksApi.getStats(id!),
    enabled: !!id,
  })

export const useCreateTrackingLink = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: trackingLinksApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tracking-links'] }),
  })
}

export const useCreateBatchTrackingLinks = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: trackingLinksApi.createBatch,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tracking-links'] }),
  })
}

export const useUpdateTrackingLink = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof trackingLinksApi.update>[1] }) =>
      trackingLinksApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tracking-links'] }),
  })
}

export const useDeleteTrackingLink = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: trackingLinksApi.deleteLink,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tracking-links'] }),
  })
}

export const useTrackingLinkClicks = (id: number | undefined, params?: { limit?: number; offset?: number }) =>
  useQuery({
    queryKey: ['tracking-links', id, 'clicks', params],
    queryFn: () => trackingLinksApi.getClicks(id!, params),
    enabled: !!id,
  })
