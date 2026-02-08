import client from './client'
import type { ApiResponse, TrackingLink, TrackingClick } from './types'

export const getTrackingLinks = () =>
  client.get<ApiResponse<TrackingLink[]>>('/api/tracking-links')

export const getTrackingLink = (id: number) =>
  client.get<ApiResponse<TrackingLink>>(`/api/tracking-links/${id}`)

export const getTrackingClicks = (id: number) =>
  client.get<ApiResponse<TrackingClick[]>>(`/api/tracking-links/${id}/clicks`)

export const createTrackingLink = (data: {
  offer_url: string
  name?: string
  short_code?: string
}) => client.post<ApiResponse<TrackingLink>>('/api/tracking-links', data)

export const updateTrackingLink = (
  id: number,
  data: { offer_url?: string; name?: string; active?: boolean }
) => client.put<ApiResponse<TrackingLink>>(`/api/tracking-links/${id}`, data)

export const deleteTrackingLink = (id: number) =>
  client.delete<ApiResponse<{ message: string }>>(`/api/tracking-links/${id}`)
