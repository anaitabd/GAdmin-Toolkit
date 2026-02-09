import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as offersApi from '../api/offers'
import type { OfferClickerFilters } from '../api/types'

export function useOffers(params?: { active?: boolean; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['offers', params],
    queryFn: () => offersApi.getAll(params),
  })
}

export function useOffer(id: number | undefined) {
  return useQuery({
    queryKey: ['offers', id],
    queryFn: () => offersApi.getById(id!),
    enabled: !!id,
  })
}

export function useOfferStats(id: number | undefined) {
  return useQuery({
    queryKey: ['offers', id, 'stats'],
    queryFn: () => offersApi.getStats(id!),
    enabled: !!id,
  })
}

export function useOfferClickers(id: number | undefined, filters: OfferClickerFilters = {}) {
  return useQuery({
    queryKey: ['offers', id, 'clickers', filters],
    queryFn: () => offersApi.getClickers(id!, filters),
    enabled: !!id,
  })
}

export function useCreateOffer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: offersApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offers'] }),
  })
}

export function useUpdateOffer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof offersApi.update>[1] }) =>
      offersApi.update(id, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['offers'] })
      qc.invalidateQueries({ queryKey: ['offers', variables.id] })
    },
  })
}

export function useDeleteOffer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: offersApi.deleteOffer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offers'] }),
  })
}
