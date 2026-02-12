import apiClient from './client'
import type { AffiliateNetwork, ApiResponse } from './types'

export const getAll = (params?: { status?: string; search?: string; limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<AffiliateNetwork[]>>('/affiliate-networks', { params }).then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<AffiliateNetwork>>(`/affiliate-networks/${id}`).then(r => r.data)

export const create = (data: {
  name: string
  description?: string
  contact_name?: string
  contact_email?: string
  api_endpoint?: string
  status?: string
  notes?: string
}) =>
  apiClient.post<ApiResponse<AffiliateNetwork>>('/affiliate-networks', data).then(r => r.data)

export const update = (id: number, data: Partial<{
  name: string
  description: string | null
  contact_name: string | null
  contact_email: string | null
  api_endpoint: string | null
  status: string
  notes: string | null
}>) =>
  apiClient.put<ApiResponse<AffiliateNetwork>>(`/affiliate-networks/${id}`, data).then(r => r.data)

export const deleteById = (id: number) =>
  apiClient.delete<{ success: boolean; message: string }>(`/affiliate-networks/${id}`).then(r => r.data)
