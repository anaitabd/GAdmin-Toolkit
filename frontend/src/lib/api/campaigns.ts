import apiClient from './client';
import type { ApiResponse } from '@/types/api';
import type { Campaign, CampaignEmail, CampaignTimeline, TopPerformer } from '@/types/models';

export const campaignsApi = {
  getAll: async (status?: string): Promise<Campaign[]> => {
    const params = status ? { status } : {};
    const { data } = await apiClient.get<ApiResponse<Campaign[]>>('/api/campaigns', { params });
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to fetch campaigns');
    }
    return data.data;
  },

  getById: async (id: number): Promise<Campaign> => {
    const { data } = await apiClient.get<ApiResponse<Campaign>>(`/api/campaigns/${id}`);
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to fetch campaign');
    }
    return data.data;
  },

  create: async (campaign: Partial<Campaign>): Promise<Campaign> => {
    const { data } = await apiClient.post<ApiResponse<Campaign>>('/api/campaigns', campaign);
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to create campaign');
    }
    return data.data;
  },

  update: async (id: number, updates: Partial<Campaign>): Promise<Campaign> => {
    const { data } = await apiClient.patch<ApiResponse<Campaign>>(`/api/campaigns/${id}`, updates);
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to update campaign');
    }
    return data.data;
  },

  pause: async (id: number): Promise<Campaign> => {
    const { data } = await apiClient.post<ApiResponse<Campaign>>(`/api/campaigns/${id}/pause`);
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to pause campaign');
    }
    return data.data;
  },

  resume: async (id: number): Promise<Campaign> => {
    const { data } = await apiClient.post<ApiResponse<Campaign>>(`/api/campaigns/${id}/resume`);
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to resume campaign');
    }
    return data.data;
  },

  cancel: async (id: number): Promise<Campaign> => {
    const { data } = await apiClient.post<ApiResponse<Campaign>>(`/api/campaigns/${id}/cancel`);
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to cancel campaign');
    }
    return data.data;
  },

  delete: async (id: number): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse<void>>(`/api/campaigns/${id}`);
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to delete campaign');
    }
  },

  getEmails: async (id: number, status?: string): Promise<CampaignEmail[]> => {
    const params = status ? { status } : {};
    const { data } = await apiClient.get<ApiResponse<CampaignEmail[]>>(`/api/campaigns/${id}/emails`, { params });
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to fetch campaign emails');
    }
    return data.data;
  },

  getTimeline: async (id: number): Promise<CampaignTimeline[]> => {
    const { data } = await apiClient.get<ApiResponse<CampaignTimeline[]>>(`/api/campaigns/${id}/timeline`);
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to fetch campaign timeline');
    }
    return data.data;
  },

  getTopPerformers: async (id: number): Promise<TopPerformer[]> => {
    const { data } = await apiClient.get<ApiResponse<TopPerformer[]>>(`/api/campaigns/${id}/top-performers`);
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to fetch top performers');
    }
    return data.data;
  },

  duplicate: async (id: number): Promise<Campaign> => {
    const { data } = await apiClient.post<ApiResponse<Campaign>>(`/api/campaigns/${id}/duplicate`);
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to duplicate campaign');
    }
    return data.data;
  },
};
