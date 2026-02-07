import apiClient from './client'
import type { BounceLog, BounceLogFilters, BounceLogStats, ApiResponse } from './types'

export const getAll = (filters: BounceLogFilters = {}) =>
  apiClient.get<ApiResponse<BounceLog[]>>('/bounce-logs', { params: filters }).then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<BounceLog>>(`/bounce-logs/${id}`).then(r => r.data)

export const getStats = () =>
  apiClient.get<ApiResponse<BounceLogStats>>('/bounce-logs/stats/summary').then(r => r.data)
