import apiClient from './client'
import type { Settings, ApiResponse } from './types'

export const getAll = () =>
  apiClient.get<ApiResponse<Settings>>('/settings').then(r => r.data)

export const update = (data: Partial<Settings>) =>
  apiClient.put<ApiResponse<Settings>>('/settings', data).then(r => r.data)
