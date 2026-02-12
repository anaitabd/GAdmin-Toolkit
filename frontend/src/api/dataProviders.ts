import apiClient from './client'
import type { DataProvider, ApiResponse } from './types'

export const getAll = (params?: { status?: string; search?: string; limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<DataProvider[]>>('/data-providers', { params }).then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<DataProvider>>(`/data-providers/${id}`).then(r => r.data)

export const create = (data: {
  name: string
  description?: string
  contact_email?: string
  contact_phone?: string
  api_endpoint?: string
  status?: string
  notes?: string
}) =>
  apiClient.post<ApiResponse<DataProvider>>('/data-providers', data).then(r => r.data)

export const update = (id: number, data: Partial<{
  name: string
  description: string | null
  contact_email: string | null
  contact_phone: string | null
  api_endpoint: string | null
  status: string
  notes: string | null
}>) =>
  apiClient.put<ApiResponse<DataProvider>>(`/data-providers/${id}`, data).then(r => r.data)

export const deleteById = (id: number) =>
  apiClient.delete<{ success: boolean; message: string }>(`/data-providers/${id}`).then(r => r.data)
