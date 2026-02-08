import apiClient from './client'
import type { Name, ApiResponse, ListFilters } from './types'

export const getAll = (params?: ListFilters) =>
  apiClient.get<ApiResponse<Name[]>>('/names', { params }).then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<Name>>(`/names/${id}`).then(r => r.data)

export const create = (data: Omit<Name, 'id' | 'created_at'>) =>
  apiClient.post<ApiResponse<Name>>('/names', data).then(r => r.data)

export const update = (id: number, data: Partial<Omit<Name, 'id' | 'created_at'>>) =>
  apiClient.put<ApiResponse<Name>>(`/names/${id}`, data).then(r => r.data)

export const deleteById = (id: number) =>
  apiClient.delete<ApiResponse<Name>>(`/names/${id}`).then(r => r.data)

export const bulkDelete = (ids: number[]) =>
  apiClient.delete<ApiResponse<{ deleted: number }>>('/names/bulk', { data: { ids } }).then(r => r.data)

export const deleteAll = () =>
  apiClient.delete<ApiResponse<{ deleted: number }>>('/names/all').then(r => r.data)
