import apiClient from './client'
import type { ApiResponse } from './types'

export interface DashboardStats {
  total_users: number
  total_campaigns: number
  total_emails_sent: number
  total_clicks: number
  total_leads: number
  total_revenue: number
}

export interface RevenueData {
  offer_id: number
  offer_name?: string
  campaign_id: number | null
  affiliate_network_id: number | null
  lead_count: number
  total_payout: number
}

export const getDashboardStats = () =>
  apiClient.get<ApiResponse<DashboardStats>>('/statistics/dashboard').then(r => r.data)

export const getRevenueReport = (params?: {
  date_from?: string
  date_to?: string
  offer_id?: number
  affiliate_network_id?: number
}) =>
  apiClient.get<ApiResponse<RevenueData[]>>('/statistics/revenue', { params }).then(r => r.data)
