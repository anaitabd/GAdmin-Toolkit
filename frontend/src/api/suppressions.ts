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

export const getProcesses = (params?: { affiliate_network_id?: number; offer_id?: number; status?: string; limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<SuppressionProcess[]>>('/suppression-processes', { params }).then(r => r.data)

export const createProcess = (data: {
  affiliate_network_id: number
  offer_id: number
  data_list_ids: number[]
}) =>
  apiClient.post<ApiResponse<SuppressionProcess>>('/suppression-processes/start', data).then(r => r.data)

export const updateProcess = (id: number, data: Partial<{
  status: string
  progress: number
  emails_found: number
}>) =>
  apiClient.put<ApiResponse<SuppressionProcess>>(`/suppression-processes/${id}`, data).then(r => r.data)

export const deleteProcess = (id: number) =>
  apiClient.delete<{ success: boolean; message: string }>(`/suppression-processes/${id}`).then(r => r.data)
