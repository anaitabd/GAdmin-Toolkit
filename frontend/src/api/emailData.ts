import apiClient from './client'
import type { EmailData, ApiResponse } from './types'

export const getAll = () =>
  apiClient.get<ApiResponse<EmailData[]>>('/email-data').then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<EmailData>>(`/email-data/${id}`).then(r => r.data)

export const create = (data: Omit<EmailData, 'id' | 'created_at'>) =>
  apiClient.post<ApiResponse<EmailData>>('/email-data', data).then(r => r.data)

export const update = (id: number, data: Partial<Omit<EmailData, 'id' | 'created_at'>>) =>
  apiClient.put<ApiResponse<EmailData>>(`/email-data/${id}`, data).then(r => r.data)

export const deleteById = (id: number) =>
  apiClient.delete<ApiResponse<EmailData>>(`/email-data/${id}`).then(r => r.data)
