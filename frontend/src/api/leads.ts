import apiClient from './client'
import type { Lead, ApiResponse } from './types'

export const getAll = (params?: { offer_id?: number; campaign_id?: number; status?: string; search?: string; limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<Lead[]>>('/leads', { params }).then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<Lead>>(`/leads/${id}`).then(r => r.data)

export const create = (data: {
  offer_id: number
  campaign_id?: number
  affiliate_network_id?: number
  to_email: string
  payout?: number
  ip_address?: string
}) =>
  apiClient.post<ApiResponse<Lead>>('/leads', data).then(r => r.data)

export const update = (id: number, data: Partial<{
  payout: number | null
  ip_address: string | null
}>) =>
  apiClient.put<ApiResponse<Lead>>(`/leads/${id}`, data).then(r => r.data)

export const deleteById = (id: number) =>
  apiClient.delete<{ success: boolean; message: string }>(`/leads/${id}`).then(r => r.data)
