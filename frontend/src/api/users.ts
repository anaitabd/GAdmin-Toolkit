import apiClient from './client'
import type { User, ApiResponse } from './types'

export const getAll = () =>
  apiClient.get<ApiResponse<User[]>>('/users').then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<User>>(`/users/${id}`).then(r => r.data)

export const create = (data: Omit<User, 'id' | 'created_at'>) =>
  apiClient.post<ApiResponse<User>>('/users', data).then(r => r.data)

export const update = (id: number, data: Partial<Omit<User, 'id' | 'created_at'>>) =>
  apiClient.put<ApiResponse<User>>(`/users/${id}`, data).then(r => r.data)

export const deleteById = (id: number) =>
  apiClient.delete<ApiResponse<User>>(`/users/${id}`).then(r => r.data)
