import apiClient from './client'
import type { Team, TeamMember, TeamAuthorization, ApiResponse } from './types'

export const getAll = (params?: { search?: string; status?: string; limit?: number; page?: number }) =>
  apiClient.get<ApiResponse<Team[]>>('/teams', { params }).then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<Team>>(`/teams/${id}`).then(r => r.data)

export const create = (data: { name: string; status?: string }) =>
  apiClient.post<ApiResponse<Team>>('/teams', data).then(r => r.data)

export const update = (id: number, data: Partial<{ name: string; status: string }>) =>
  apiClient.put<ApiResponse<Team>>(`/teams/${id}`, data).then(r => r.data)

export const deleteById = (id: number) =>
  apiClient.delete<ApiResponse<Team>>(`/teams/${id}`).then(r => r.data)

// Team Members
export const getMembers = (teamId: number) =>
  apiClient.get<ApiResponse<TeamMember[]>>(`/teams/${teamId}/members`).then(r => r.data)

export const addMember = (teamId: number, data: { user_id: number }) =>
  apiClient.post<ApiResponse<TeamMember>>(`/teams/${teamId}/members`, data).then(r => r.data)

export const removeMember = (teamId: number, userId: number) =>
  apiClient.delete<ApiResponse<void>>(`/teams/${teamId}/members/${userId}`).then(r => r.data)

// Team Authorizations
export const getAuthorizations = (teamId: number) =>
  apiClient.get<ApiResponse<TeamAuthorization[]>>(`/teams/${teamId}/authorizations`).then(r => r.data)

export const addAuthorization = (teamId: number, data: { resource_type: string; resource_id: number }) =>
  apiClient.post<ApiResponse<TeamAuthorization>>(`/teams/${teamId}/authorizations`, data).then(r => r.data)

export const removeAuthorization = (teamId: number, authId: number) =>
  apiClient.delete<ApiResponse<void>>(`/teams/${teamId}/authorizations/${authId}`).then(r => r.data)
