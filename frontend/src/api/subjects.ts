import apiClient from './client'
import type { Subject, ApiResponse } from './types'

export const getAll = (params?: { offer_id?: number; status?: string; search?: string; limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<Subject[]>>('/subjects', { params }).then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<Subject>>(`/subjects/${id}`).then(r => r.data)

export const create = (data: {
  offer_id: number
  value: string
  status?: string
}) =>
  apiClient.post<ApiResponse<Subject>>('/subjects', data).then(r => r.data)

export const update = (id: number, data: Partial<{
  offer_id: number
  value: string
  status: string
}>) =>
  apiClient.put<ApiResponse<Subject>>(`/subjects/${id}`, data).then(r => r.data)

export const deleteById = (id: number) =>
  apiClient.delete<{ success: boolean; message: string }>(`/subjects/${id}`).then(r => r.data)
