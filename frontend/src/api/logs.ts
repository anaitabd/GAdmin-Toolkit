import apiClient from './client'
import type { ApplicationLog, ApiResponse } from './types'

export const getFrontendLogs = (params?: {
  level?: string
  date_from?: string
  date_to?: string
  search?: string
  limit?: number
  page?: number
}) =>
  apiClient.get<ApiResponse<ApplicationLog[]>>('/logs/frontend', { params }).then(r => r.data)

export const getBackendLogs = (params?: {
  level?: string
  date_from?: string
  date_to?: string
  search?: string
  limit?: number
  page?: number
}) =>
  apiClient.get<ApiResponse<ApplicationLog[]>>('/logs/backend', { params }).then(r => r.data)
