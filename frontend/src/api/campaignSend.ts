import apiClient from './client'
import type { ApiResponse } from './types'

/**
 * Campaign Send Orchestration API
 * Endpoints for the campaign creation flow with cascading dropdowns
 */

export interface ResolveOfferResponse {
  offer: any
  from_names: Array<{ id: number; value: string }>
  subjects: Array<{ id: number; value: string }>
  creatives: Array<{ id: number; subject: string; from_name: string; html_content: string }>
  offer_links: {
    click: string[]
    unsub: string[]
  }
}

export interface ResolveCreativeResponse {
  subject: string
  from_name: string
  html_content: string
  links: {
    click: string[]
    unsub: string[]
  }
}

export interface DataList {
  id: number
  name: string
  total_count: number
  available_count: number
  provider_name: string
}

export interface ResolveListsResponse {
  data_lists: DataList[]
  total_emails: number
}

export interface PreviewResponse {
  estimated_recipients: number
  excluded_count: {
    total: number
    blacklisted: number
    suppressed: number
    bounced: number
    unsubbed: number
  }
  sample_personalized_email: {
    from: string
    subject: string
    html_preview: string
  } | null
}

export interface TestEmailResponse {
  sent: string[]
  failed: Array<{ email: string; error: string }>
}

export interface StartCampaignRequest {
  name: string
  description?: string
  offer_id: number
  affiliate_network_id?: number
  creative_id?: number
  from_name_id?: number
  subject_id?: number
  data_list_ids: number[]
  provider: 'gmail_api' | 'smtp'
  batch_size?: number
  batch_delay_ms?: number
  recipient_limit?: number
  recipient_offset?: number
  rotation_enabled?: boolean
  geo?: string
  user_ids?: number[]
  placeholders_config?: Record<string, any>
  scheduled_at?: string
}

export interface StartCampaignResponse {
  campaign_id: number
  job_id: number
  estimated_recipients: number
  status: string
}

export const resolveOffer = (offer_id: number) =>
  apiClient
    .post<ApiResponse<ResolveOfferResponse>>('/campaign-send/resolve-offer', { offer_id })
    .then(r => r.data)

export const resolveCreative = (creative_id: number) =>
  apiClient
    .post<ApiResponse<ResolveCreativeResponse>>('/campaign-send/resolve-creative', { creative_id })
    .then(r => r.data)

export const resolveLists = (params: {
  data_provider_ids?: number[]
  offer_id?: number
  verticals?: string
  geo?: string
}) =>
  apiClient
    .post<ApiResponse<ResolveListsResponse>>('/campaign-send/resolve-lists', params)
    .then(r => r.data)

export const preview = (params: {
  offer_id?: number
  creative_id?: number
  from_name_id?: number
  subject_id?: number
  data_list_ids: number[]
  recipient_limit?: number
  geo?: string
}) =>
  apiClient
    .post<ApiResponse<PreviewResponse>>('/campaign-send/preview', params)
    .then(r => r.data)

export const sendTest = (params: {
  offer_id?: number
  creative_id?: number
  from_name_id?: number
  subject_id?: number
  test_emails: string[]
  provider: 'gmail_api' | 'smtp'
}) =>
  apiClient
    .post<ApiResponse<TestEmailResponse>>('/campaign-send/test', params)
    .then(r => r.data)

export const start = (params: StartCampaignRequest) =>
  apiClient
    .post<ApiResponse<StartCampaignResponse>>('/campaign-send/start', params)
    .then(r => r.data)

export const pause = (campaignId: number) =>
  apiClient
    .post<ApiResponse<{ message: string }>>(`/campaign-send/pause/${campaignId}`)
    .then(r => r.data)

export const resume = (campaignId: number) =>
  apiClient
    .post<ApiResponse<{ message: string }>>(`/campaign-send/resume/${campaignId}`)
    .then(r => r.data)

export const kill = (campaignId: number) =>
  apiClient
    .post<ApiResponse<{ message: string }>>(`/campaign-send/kill/${campaignId}`)
    .then(r => r.data)
