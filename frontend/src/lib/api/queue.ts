import apiClient from './client';
import type { ApiResponse } from '@/types/api';
import type { QueueStatus } from '@/types/models';

export const queueApi = {
  getStatus: async (): Promise<QueueStatus> => {
    const { data } = await apiClient.get<ApiResponse<QueueStatus>>('/api/queue/status');
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to fetch queue status');
    }
    return data.data;
  },

  enqueue: async (emails: any[]): Promise<void> => {
    const { data } = await apiClient.post<ApiResponse<void>>('/api/queue/enqueue', { emails });
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to enqueue emails');
    }
  },

  clearFailed: async (): Promise<void> => {
    const { data } = await apiClient.post<ApiResponse<void>>('/api/queue/clear-failed');
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to clear failed emails');
    }
  },

  retryFailed: async (): Promise<void> => {
    const { data } = await apiClient.post<ApiResponse<void>>('/api/queue/retry-failed');
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to retry failed emails');
    }
  },
};
