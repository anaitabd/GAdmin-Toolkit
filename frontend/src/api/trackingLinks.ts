import apiClient from './client'
import type { ApiResponse, TrackingLink, TrackingLinkHtml, TrackingLinkStats, TrackingLinkFilters, ClickEventsResponse } from './types'

export const getAll = (filters: TrackingLinkFilters = {}) =>
  apiClient.get<ApiResponse<TrackingLink[]>>('/tracking-links', { params: filters }).then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<TrackingLink>>(`/tracking-links/${id}`).then(r => r.data)

export const create = (data: { original_url: string; name?: string; description?: string; tags?: string[] }) =>
  apiClient.post<ApiResponse<TrackingLink>>('/tracking-links', data).then(r => r.data)

export const createBatch = (links: { original_url: string; name?: string; description?: string; tags?: string[] }[]) =>
  apiClient.post<ApiResponse<TrackingLink[]>>('/tracking-links/batch', { links }).then(r => r.data)

export const update = (id: number, data: Partial<{ name: string; description: string; tags: string[]; original_url: string }>) =>
  apiClient.put<ApiResponse<TrackingLink>>(`/tracking-links/${id}`, data).then(r => r.data)

export const deleteLink = (id: number) =>
  apiClient.delete<{ success: boolean; message: string }>(`/tracking-links/${id}`).then(r => r.data)

export const getHtml = (id: number, params?: { linkText?: string; target?: string; style?: string }) =>
  apiClient.get<ApiResponse<TrackingLinkHtml>>(`/tracking-links/${id}/html`, { params }).then(r => r.data)

export const getStats = (id: number) =>
  apiClient.get<ApiResponse<TrackingLinkStats>>(`/tracking-links/${id}/stats`).then(r => r.data)

export const getClicks = (id: number, params?: { limit?: number; offset?: number }) =>
  apiClient.get<ClickEventsResponse>(`/tracking-links/${id}/clicks`, { params }).then(r => r.data)
