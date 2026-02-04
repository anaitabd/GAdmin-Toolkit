import apiClient from './client';
import type { ApiResponse } from '@/types/api';
import type { Campaign } from '@/types/models';

export const campaignsApi = {
  getAll: async (): Promise<Campaign[]> => {
    const { data } = await apiClient.get<ApiResponse<Campaign[]>>('/api/campaigns');
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

  delete: async (id: number): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse<void>>(`/api/campaigns/${id}`);
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to delete campaign');
    }
  },
};
