import apiClient from './client'
import type { OfferLink, ApiResponse } from './types'

export const getAll = (params?: { offer_id?: number; creative_id?: number; type?: string; status?: string; limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<OfferLink[]>>('/offer-links', { params }).then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<OfferLink>>(`/offer-links/${id}`).then(r => r.data)

export const create = (data: {
  offer_id: number
  type: 'click' | 'unsub'
  value: string
  creative_id?: number
  status?: string
}) =>
  apiClient.post<ApiResponse<OfferLink>>('/offer-links', data).then(r => r.data)

export const update = (id: number, data: Partial<{
  offer_id: number
  type: 'click' | 'unsub'
  value: string
  creative_id: number | null
  status: string
}>) =>
  apiClient.put<ApiResponse<OfferLink>>(`/offer-links/${id}`, data).then(r => r.data)

export const deleteById = (id: number) =>
  apiClient.delete<{ success: boolean; message: string }>(`/offer-links/${id}`).then(r => r.data)
