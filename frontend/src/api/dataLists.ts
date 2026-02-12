import apiClient from './client'
import type { DataList, ApiResponse } from './types'

export const getAll = (params?: { provider_id?: number; status?: string; search?: string; limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<DataList[]>>('/data-lists', { params }).then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<DataList>>(`/data-lists/${id}`).then(r => r.data)

export const create = (data: {
  name: string
  provider_id: number
  description?: string
  vertical_id?: number
  total_count?: number
  status?: string
  notes?: string
}) =>
  apiClient.post<ApiResponse<DataList>>('/data-lists', data).then(r => r.data)

export const update = (id: number, data: Partial<{
  name: string
  provider_id: number
  description: string | null
  vertical_id: number | null
  total_count: number | null
  status: string
  notes: string | null
}>) =>
  apiClient.put<ApiResponse<DataList>>(`/data-lists/${id}`, data).then(r => r.data)

export const deleteById = (id: number) =>
  apiClient.delete<{ success: boolean; message: string }>(`/data-lists/${id}`).then(r => r.data)
