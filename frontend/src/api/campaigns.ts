import apiClient from './client'
import type { Campaign, ApiResponse, CampaignTrackingStats, CampaignOpener, CampaignClicker, CampaignLink } from './types'

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
  offer_id?: number | null
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
  offer_id: number | null
}>) =>
  apiClient.put<ApiResponse<Campaign>>(`/campaigns/${id}`, data).then(r => r.data)

export const deleteCampaign = (id: number) =>
  apiClient.delete<{ success: boolean; message: string }>(`/campaigns/${id}`).then(r => r.data)

export const clone = (id: number) =>
  apiClient.post<ApiResponse<Campaign>>(`/campaigns/${id}/clone`).then(r => r.data)

export const getStats = (id: number) =>
  apiClient.get<ApiResponse<CampaignTrackingStats>>(`/campaigns/${id}/stats`).then(r => r.data)

export const getOpeners = (id: number, params?: { limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<CampaignOpener[]> & { total: number }>(`/campaigns/${id}/openers`, { params }).then(r => r.data)

export const getClickers = (id: number, params?: { limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<CampaignClicker[]> & { total: number }>(`/campaigns/${id}/clickers`, { params }).then(r => r.data)

export const getLinks = (id: number) =>
  apiClient.get<ApiResponse<CampaignLink[]>>(`/campaigns/${id}/links`).then(r => r.data)

export const getRecipients = (id: number, params?: { limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<any[]> & { total: number }>(`/campaigns/${id}/recipients`, { params }).then(r => r.data)

export const getClicks = (id: number, params?: { limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<any[]> & { total: number }>(`/campaigns/${id}/clicks`, { params }).then(r => r.data)

export const getOpens = (id: number, params?: { limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<any[]> & { total: number }>(`/campaigns/${id}/opens`, { params }).then(r => r.data)

export const getLeads = (id: number, params?: { limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<any[]> & { total_leads: number; total_payout: number }>(`/campaigns/${id}/leads`, { params }).then(r => r.data)

export const compareCampaigns = (campaign_ids: number[]) =>
  apiClient.get<ApiResponse<any[]>>('/campaigns/compare', { params: { campaign_ids: campaign_ids.join(',') } }).then(r => r.data)

