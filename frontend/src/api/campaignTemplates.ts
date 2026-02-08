import apiClient from './client'
import type { CampaignTemplate, ApiResponse } from './types'

export const getAll = () =>
  apiClient.get<ApiResponse<CampaignTemplate[]>>('/campaign-templates').then(r => r.data)

export const getActive = () =>
  apiClient.get<ApiResponse<CampaignTemplate[]>>('/campaign-templates/active').then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<CampaignTemplate>>(`/campaign-templates/${id}`).then(r => r.data)

export const create = (data: {
  name: string
  description?: string
  from_name: string
  subject: string
  html_content: string
  provider: 'gmail_api' | 'smtp'
  batch_size?: number
  active?: boolean
}) =>
  apiClient.post<ApiResponse<CampaignTemplate>>('/campaign-templates', data).then(r => r.data)

export const update = (id: number, data: Partial<{
  name: string
  description: string
  from_name: string
  subject: string
  html_content: string
  provider: 'gmail_api' | 'smtp'
  batch_size: number
  active: boolean
}>) =>
  apiClient.put<ApiResponse<CampaignTemplate>>(`/campaign-templates/${id}`, data).then(r => r.data)

export const deleteTemplate = (id: number) =>
  apiClient.delete<{ success: boolean; message: string }>(`/campaign-templates/${id}`).then(r => r.data)
