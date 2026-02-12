import apiClient from './client'
import type { SuppressionEmail, SuppressionProcess, ApiResponse } from './types'

export const getEmails = (params?: { offer_id?: number; search?: string; limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<SuppressionEmail[]>>('/suppression-emails', { params }).then(r => r.data)

export const addEmail = (data: { offer_id: number; email: string; reason?: string }) =>
  apiClient.post<ApiResponse<SuppressionEmail>>('/suppression-emails', data).then(r => r.data)

export const deleteEmail = (id: number) =>
  apiClient.delete<{ success: boolean; message: string }>(`/suppression-emails/${id}`).then(r => r.data)

export const bulkAddEmails = (data: { offer_id: number; emails: string[] }) =>
  apiClient.post<ApiResponse<{ added: number }>>('/suppression-emails/bulk', data).then(r => r.data)

export const getProcesses = (params?: { offer_id?: number; status?: string; limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<SuppressionProcess[]>>('/suppression-processes', { params }).then(r => r.data)

export const createProcess = (data: {
  offer_id: number
  name: string
  description?: string
  source_file?: string
  total_count?: number
}) =>
  apiClient.post<ApiResponse<SuppressionProcess>>('/suppression-processes', data).then(r => r.data)

export const updateProcess = (id: number, data: Partial<{
  status: string
  processed_count: number
  added_count: number
  error_message: string | null
}>) =>
  apiClient.put<ApiResponse<SuppressionProcess>>(`/suppression-processes/${id}`, data).then(r => r.data)

export const deleteProcess = (id: number) =>
  apiClient.delete<{ success: boolean; message: string }>(`/suppression-processes/${id}`).then(r => r.data)
