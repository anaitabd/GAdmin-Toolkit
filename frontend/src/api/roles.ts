import apiClient from './client'
import type { Role, UserRole, ApiResponse } from './types'

export const getAll = (params?: { search?: string; status?: string; limit?: number; page?: number }) =>
  apiClient.get<ApiResponse<Role[]>>('/roles', { params }).then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<Role>>(`/roles/${id}`).then(r => r.data)

export const getPermissions = () =>
  apiClient.get<ApiResponse<Record<string, string>>>('/roles/permissions').then(r => r.data)

export const create = (data: {
  name: string
  role_type?: string
  description?: string
  status?: string
  permissions?: string[]
}) =>
  apiClient.post<ApiResponse<Role>>('/roles', data).then(r => r.data)

export const update = (id: number, data: Partial<{
  name: string
  role_type: string
  description: string
  status: string
  permissions: string[]
}>) =>
  apiClient.put<ApiResponse<Role>>(`/roles/${id}`, data).then(r => r.data)

export const deleteById = (id: number) =>
  apiClient.delete<ApiResponse<Role>>(`/roles/${id}`).then(r => r.data)

// User-Role assignments
export const getUserRoles = (params?: { user_id?: number; role_id?: number; limit?: number; page?: number }) =>
  apiClient.get<ApiResponse<UserRole[]>>('/roles/user-roles', { params }).then(r => r.data)

export const assignRole = (data: { user_id: number; role_id: number }) =>
  apiClient.post<ApiResponse<UserRole>>('/roles/user-roles', data).then(r => r.data)

export const unassignRole = (userId: number, roleId: number) =>
  apiClient.delete<ApiResponse<void>>(`/roles/user-roles/${userId}/${roleId}`).then(r => r.data)
