import apiClient from './client'
import type { Blacklist, ApiResponse } from './types'

export const getAll = (params?: { status?: string; search?: string; limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<Blacklist[]>>('/blacklists', { params }).then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<Blacklist>>(`/blacklists/${id}`).then(r => r.data)

export const create = (data: {
  name: string
  description?: string
  status?: string
}) =>
  apiClient.post<ApiResponse<Blacklist>>('/blacklists', data).then(r => r.data)

export const update = (id: number, data: Partial<{
  name: string
  description: string | null
  status: string
}>) =>
  apiClient.put<ApiResponse<Blacklist>>(`/blacklists/${id}`, data).then(r => r.data)

export const deleteById = (id: number) =>
  apiClient.delete<{ success: boolean; message: string }>(`/blacklists/${id}`).then(r => r.data)

export const getEmails = (id: number, params?: { search?: string; limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<{ id: number; blacklist_id: number; email: string; created_at: string }[]>>(`/blacklists/${id}/emails`, { params }).then(r => r.data)

export const addEmail = (id: number, data: { email: string }) =>
  apiClient.post<ApiResponse<{ id: number; blacklist_id: number; email: string }>>(`/blacklists/${id}/emails`, data).then(r => r.data)

export const deleteEmail = (id: number, emailId: number) =>
  apiClient.delete<{ success: boolean; message: string }>(`/blacklists/${id}/emails/${emailId}`).then(r => r.data)

export const bulkAddEmails = (id: number, data: { emails: string[] }) =>
  apiClient.post<ApiResponse<{ added: number }>>(`/blacklists/${id}/emails/bulk`, data).then(r => r.data)
