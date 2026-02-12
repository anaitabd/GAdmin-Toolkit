import apiClient from './client'
import type { Vertical, ApiResponse } from './types'

export const getAll = (params?: { status?: string; search?: string; limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<Vertical[]>>('/verticals', { params }).then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<Vertical>>(`/verticals/${id}`).then(r => r.data)

export const create = (data: {
  name: string
  description?: string
  status?: string
  notes?: string
}) =>
  apiClient.post<ApiResponse<Vertical>>('/verticals', data).then(r => r.data)

export const update = (id: number, data: Partial<{
  name: string
  description: string | null
  status: string
  notes: string | null
}>) =>
  apiClient.put<ApiResponse<Vertical>>(`/verticals/${id}`, data).then(r => r.data)

export const deleteById = (id: number) =>
  apiClient.delete<{ success: boolean; message: string }>(`/verticals/${id}`).then(r => r.data)
