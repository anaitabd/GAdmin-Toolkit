import apiClient from './client'
import type { EmailLog, EmailLogFilters, EmailLogStats, ApiResponse } from './types'

export const getAll = (filters: EmailLogFilters = {}) =>
  apiClient.get<ApiResponse<EmailLog[]>>('/email-logs', { params: filters }).then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<EmailLog>>(`/email-logs/${id}`).then(r => r.data)

export const getStats = () =>
  apiClient.get<ApiResponse<EmailLogStats>>('/email-logs/stats/summary').then(r => r.data)
