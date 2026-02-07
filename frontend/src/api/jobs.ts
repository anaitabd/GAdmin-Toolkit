import apiClient from './client'
import type { Job, ApiResponse } from './types'

export const getAll = () =>
  apiClient.get<ApiResponse<Job[]>>('/jobs').then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<Job>>(`/jobs/${id}`).then(r => r.data)

export const cancel = (id: number) =>
  apiClient.post<ApiResponse<Job>>(`/jobs/${id}/cancel`).then(r => r.data)

export const sendEmails = (provider: 'gmail_api' | 'smtp') =>
  apiClient.post<ApiResponse<Job>>('/jobs/send-emails', { provider }).then(r => r.data)

export const generateUsers = (domain: string, num_records: number) =>
  apiClient.post<ApiResponse<Job>>('/jobs/generate-users', { domain, num_records }).then(r => r.data)

export const createGoogleUsers = (admin_email: string) =>
  apiClient.post<ApiResponse<Job>>('/jobs/create-google-users', { admin_email }).then(r => r.data)

export const deleteGoogleUsers = (admin_email: string) =>
  apiClient.post<ApiResponse<Job>>('/jobs/delete-google-users', { admin_email }).then(r => r.data)

export const detectBounces = () =>
  apiClient.post<ApiResponse<Job>>('/jobs/detect-bounces').then(r => r.data)

export const bulkUsers = (users: Array<{ email: string; password?: string; given_name?: string; family_name?: string }>) =>
  apiClient.post('/jobs/bulk-users', { users }).then(r => r.data)

export const bulkEmails = (emails: string[]) =>
  apiClient.post('/jobs/bulk-emails', { emails }).then(r => r.data)

export const bulkNames = (names: Array<{ given_name: string; family_name: string }>) =>
  apiClient.post('/jobs/bulk-names', { names }).then(r => r.data)

export const streamUrl = (id: number) =>
  `${apiClient.defaults.baseURL}/jobs/${id}/stream`
