import apiClient from './client'
import type { Creative, ApiResponse } from './types'

export const getAll = (params?: { offer_id?: number; status?: string; search?: string; limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<Creative[]>>('/creatives', { params }).then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<Creative>>(`/creatives/${id}`).then(r => r.data)

export const create = (data: {
  offer_id: number
  subject: string
  from_name: string
  html_content: string
  status?: string
}) =>
  apiClient.post<ApiResponse<Creative>>('/creatives', data).then(r => r.data)

export const update = (id: number, data: Partial<{
  offer_id: number
  subject: string
  from_name: string
  html_content: string
  status: string
}>) =>
  apiClient.put<ApiResponse<Creative>>(`/creatives/${id}`, data).then(r => r.data)

export const deleteById = (id: number) =>
  apiClient.delete<{ success: boolean; message: string }>(`/creatives/${id}`).then(r => r.data)
