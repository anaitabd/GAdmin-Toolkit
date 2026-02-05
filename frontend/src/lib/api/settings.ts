import apiClient from './client';
import type { ApiResponse } from '@/types/api';

export interface Setting {
  value: any;
  description: string;
  updatedAt: string;
}

export interface Settings {
  [key: string]: Setting;
}

export interface SettingUpdate {
  key: string;
  value: any;
  updatedAt: string;
}

export const settingsApi = {
  getSettings: async (): Promise<Settings> => {
    const { data } = await apiClient.get<ApiResponse<{ settings: Settings; allowedSettings: string[] }>>(
      '/api/settings'
    );
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to fetch settings');
    }
    return data.data.settings;
  },

  updateSettings: async (updates: Record<string, any>): Promise<SettingUpdate[]> => {
    const { data } = await apiClient.patch<ApiResponse<{ updated: SettingUpdate[] }>>(
      '/api/settings',
      updates
    );
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to update settings');
    }
    return data.data.updated;
  },

  getSetting: async (key: string): Promise<Setting> => {
    const { data } = await apiClient.get<ApiResponse<{ setting: Setting }>>(
      `/api/settings/${key}`
    );
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to fetch setting');
    }
    return data.data.setting;
  },
};
