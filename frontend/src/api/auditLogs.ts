import apiClient from './client'
import type { AuditLog, ApiResponse } from './types'

export const getAll = (params?: { entity_type?: string; entity_id?: number; action?: string; user_email?: string; limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<AuditLog[]>>('/audit-logs', { params }).then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<AuditLog>>(`/audit-logs/${id}`).then(r => r.data)
