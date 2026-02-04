import apiClient from './client';
import type { ApiResponse } from '@/types/api';
import type { AnalyticsOverview } from '@/types/models';

export const analyticsApi = {
  getOverview: async (days: number = 7): Promise<AnalyticsOverview> => {
    const { data } = await apiClient.get<ApiResponse<AnalyticsOverview>>(
      `/api/analytics/overview?days=${days}`
    );
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to fetch analytics');
    }
    return data.data;
  },
};
