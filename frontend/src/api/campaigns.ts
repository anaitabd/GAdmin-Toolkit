import apiClient from './client'
import type { Campaign, ApiResponse, CampaignTrackingStats } from './types'

export const getAll = (params?: { status?: string; limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<Campaign[]>>('/campaigns', { params }).then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<Campaign>>(`/campaigns/${id}`).then(r => r.data)

export const create = (data: {
  name: string
  description?: string
  from_name: string
  subject: string
  html_content: string
  provider: 'gmail_api' | 'smtp'
  batch_size?: number
  geo?: string
  list_name?: string
  recipient_offset?: number
  recipient_limit?: number
  user_ids?: number[]
  scheduled_at?: string
}) =>
  apiClient.post<ApiResponse<Campaign>>('/campaigns', data).then(r => r.data)

export const update = (id: number, data: Partial<{
  name: string
  description: string
  from_name: string
  subject: string
  html_content: string
  provider: 'gmail_api' | 'smtp'
  batch_size: number
  geo: string | null
  list_name: string | null
  recipient_offset: number | null
  recipient_limit: number | null
  user_ids: number[] | null
  scheduled_at: string | null
}>) =>
  apiClient.put<ApiResponse<Campaign>>(`/campaigns/${id}`, data).then(r => r.data)

export const deleteCampaign = (id: number) =>
  apiClient.delete<{ success: boolean; message: string }>(`/campaigns/${id}`).then(r => r.data)

export const clone = (id: number) =>
  apiClient.post<ApiResponse<Campaign>>(`/campaigns/${id}/clone`).then(r => r.data)

export const getStats = (id: number) =>
  apiClient.get<ApiResponse<CampaignTrackingStats>>(`/campaigns/${id}/stats`).then(r => r.data)
