import apiClient from './client'
import type { Offer, OfferClicker, OfferStats, OfferClickerFilters, ApiResponse } from './types'

export const getAll = (params?: { active?: boolean; limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<Offer[]>>('/offers', { params }).then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<Offer>>(`/offers/${id}`).then(r => r.data)

export const create = (data: {
  name: string
  subject: string
  from_name: string
  html_content: string
  click_url: string
  unsub_url?: string
  active?: boolean
}) =>
  apiClient.post<ApiResponse<Offer>>('/offers', data).then(r => r.data)

export const update = (id: number, data: Partial<{
  name: string
  subject: string
  from_name: string
  html_content: string
  click_url: string
  unsub_url: string | null
  active: boolean
}>) =>
  apiClient.put<ApiResponse<Offer>>(`/offers/${id}`, data).then(r => r.data)

export const deleteOffer = (id: number) =>
  apiClient.delete<{ success: boolean; message: string }>(`/offers/${id}`).then(r => r.data)

export const getStats = (id: number) =>
  apiClient.get<ApiResponse<OfferStats>>(`/offers/${id}/stats`).then(r => r.data)

export const getClickers = (id: number, filters: OfferClickerFilters = {}) =>
  apiClient.get<ApiResponse<OfferClicker[]> & { total: number }>(`/offers/${id}/clickers`, { params: filters }).then(r => r.data)
