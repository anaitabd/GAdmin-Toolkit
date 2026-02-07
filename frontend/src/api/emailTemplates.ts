import apiClient from './client'
import type { EmailTemplate, ApiResponse } from './types'

export const getAll = () =>
  apiClient.get<ApiResponse<EmailTemplate[]>>('/email-templates').then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<EmailTemplate>>(`/email-templates/${id}`).then(r => r.data)

export const getActive = () =>
  apiClient.get<ApiResponse<EmailTemplate>>('/email-templates/active').then(r => r.data)

export const create = (data: Omit<EmailTemplate, 'id' | 'created_at'>) =>
  apiClient.post<ApiResponse<EmailTemplate>>('/email-templates', data).then(r => r.data)

export const update = (id: number, data: Partial<Omit<EmailTemplate, 'id' | 'created_at'>>) =>
  apiClient.put<ApiResponse<EmailTemplate>>(`/email-templates/${id}`, data).then(r => r.data)

export const deleteById = (id: number) =>
  apiClient.delete<ApiResponse<EmailTemplate>>(`/email-templates/${id}`).then(r => r.data)
