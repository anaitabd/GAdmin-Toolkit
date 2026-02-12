import apiClient from './client'
import type { FromName, ApiResponse } from './types'

export const getAll = (params?: { offer_id?: number; status?: string; search?: string; limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<FromName[]>>('/from-names', { params }).then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<FromName>>(`/from-names/${id}`).then(r => r.data)

export const create = (data: {
  offer_id: number
  value: string
  status?: string
}) =>
  apiClient.post<ApiResponse<FromName>>('/from-names', data).then(r => r.data)

export const update = (id: number, data: Partial<{
  offer_id: number
  value: string
  status: string
}>) =>
  apiClient.put<ApiResponse<FromName>>(`/from-names/${id}`, data).then(r => r.data)

export const deleteById = (id: number) =>
  apiClient.delete<{ success: boolean; message: string }>(`/from-names/${id}`).then(r => r.data)
