import apiClient from './client'
import type { EmailData, ApiResponse, ListFilters } from './types'

export const getAll = (params?: ListFilters) =>
  apiClient.get<ApiResponse<EmailData[]>>('/email-data', { params }).then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<EmailData>>(`/email-data/${id}`).then(r => r.data)

export const create = (data: Omit<EmailData, 'id' | 'created_at'>) =>
  apiClient.post<ApiResponse<EmailData>>('/email-data', data).then(r => r.data)

export const update = (id: number, data: Partial<Omit<EmailData, 'id' | 'created_at'>>) =>
  apiClient.put<ApiResponse<EmailData>>(`/email-data/${id}`, data).then(r => r.data)

export const deleteById = (id: number) =>
  apiClient.delete<ApiResponse<EmailData>>(`/email-data/${id}`).then(r => r.data)

export const bulkDelete = (ids: number[]) =>
  apiClient.delete('/email-data/bulk', { data: { ids } }).then(r => r.data)

export const deleteAll = () =>
  apiClient.delete('/email-data/all').then(r => r.data)

export const getGeos = () =>
  apiClient.get<ApiResponse<string[]>>('/email-data/geos').then(r => r.data)

export const getListNames = () =>
  apiClient.get<ApiResponse<string[]>>('/email-data/list-names').then(r => r.data)
