import apiClient from './client'
import type { UserSession, ApiResponse } from './types'

export const getAll = (params?: { limit?: number; page?: number }) =>
  apiClient.get<ApiResponse<UserSession[]>>('/sessions', { params }).then(r => r.data)

export const deleteById = (id: number) =>
  apiClient.delete<ApiResponse<void>>(`/sessions/${id}`).then(r => r.data)

export const bulkDelete = (session_ids: number[]) =>
  apiClient.delete<ApiResponse<void>>('/sessions/bulk', { data: { session_ids } }).then(r => r.data)

export const cleanup = () =>
  apiClient.post<ApiResponse<void>>('/sessions/cleanup').then(r => r.data)
