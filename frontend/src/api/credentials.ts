import apiClient from './client'
import type { Credential, ApiResponse } from './types'

export const getAll = () =>
  apiClient.get<ApiResponse<Credential[]>>('/credentials').then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<Credential>>(`/credentials/${id}`).then(r => r.data)

export const getActive = () =>
  apiClient.get<ApiResponse<Credential>>('/credentials/active').then(r => r.data)

export const create = (data: Omit<Credential, 'id' | 'created_at' | 'updated_at'>) =>
  apiClient.post<ApiResponse<Credential>>('/credentials', data).then(r => r.data)

export const update = (id: number, data: Partial<Omit<Credential, 'id' | 'created_at' | 'updated_at'>>) =>
  apiClient.put<ApiResponse<Credential>>(`/credentials/${id}`, data).then(r => r.data)

export const deleteById = (id: number) =>
  apiClient.delete<ApiResponse<Credential>>(`/credentials/${id}`).then(r => r.data)
