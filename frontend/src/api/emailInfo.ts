import apiClient from './client'
import type { EmailInfo, ApiResponse } from './types'

export const getAll = () =>
  apiClient.get<ApiResponse<EmailInfo[]>>('/email-info').then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<EmailInfo>>(`/email-info/${id}`).then(r => r.data)

export const getActive = () =>
  apiClient.get<ApiResponse<EmailInfo>>('/email-info/active').then(r => r.data)

export const create = (data: Omit<EmailInfo, 'id' | 'created_at'>) =>
  apiClient.post<ApiResponse<EmailInfo>>('/email-info', data).then(r => r.data)

export const update = (id: number, data: Partial<Omit<EmailInfo, 'id' | 'created_at'>>) =>
  apiClient.put<ApiResponse<EmailInfo>>(`/email-info/${id}`, data).then(r => r.data)

export const deleteById = (id: number) =>
  apiClient.delete<ApiResponse<EmailInfo>>(`/email-info/${id}`).then(r => r.data)
