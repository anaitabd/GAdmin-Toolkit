import apiClient from './client'
import type { AutoResponder, ApiResponse } from './types'

export const getAll = (params?: { search?: string; status?: string; limit?: number; page?: number }) =>
  apiClient.get<ApiResponse<AutoResponder[]>>('/auto-responders', { params }).then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<AutoResponder>>(`/auto-responders/${id}`).then(r => r.data)

export const create = (data: {
  name: string
  offer_id: number
  trigger_type: string
  delay_value?: number
  delay_unit?: string
  creative_id?: number
  from_name_id?: number
  subject_id?: number
  send_limit?: number
  status?: string
}) =>
  apiClient.post<ApiResponse<AutoResponder>>('/auto-responders', data).then(r => r.data)

export const update = (id: number, data: Partial<{
  name: string
  offer_id: number
  trigger_type: string
  delay_value: number
  delay_unit: string
  creative_id: number
  from_name_id: number
  subject_id: number
  send_limit: number
  status: string
}>) =>
  apiClient.put<ApiResponse<AutoResponder>>(`/auto-responders/${id}`, data).then(r => r.data)

export const deleteById = (id: number) =>
  apiClient.delete<ApiResponse<AutoResponder>>(`/auto-responders/${id}`).then(r => r.data)
