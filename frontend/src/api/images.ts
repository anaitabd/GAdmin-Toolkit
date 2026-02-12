import apiClient from './client'
import type { UploadedImage, ApiResponse } from './types'

export const getAll = (params?: { search?: string; limit?: number; page?: number }) =>
  apiClient.get<ApiResponse<UploadedImage[]>>('/images', { params }).then(r => r.data)

export const getById = (id: number) =>
  apiClient.get<ApiResponse<UploadedImage>>(`/images/${id}`).then(r => r.data)

export const upload = (file: File) => {
  const formData = new FormData()
  formData.append('image', file)
  return apiClient.post<ApiResponse<UploadedImage>>('/images/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data)
}

export const deleteById = (id: number) =>
  apiClient.delete<ApiResponse<UploadedImage>>(`/images/${id}`).then(r => r.data)
