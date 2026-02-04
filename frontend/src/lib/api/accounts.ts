import apiClient from './client';
import type { ApiResponse } from '@/types/api';
import type { SenderAccount } from '@/types/models';

export const accountsApi = {
  getAll: async (): Promise<SenderAccount[]> => {
    const { data } = await apiClient.get<ApiResponse<{ accounts: SenderAccount[] }>>('/api/accounts');
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to fetch accounts');
    }
    return data.data.accounts;
  },

  getById: async (id: number): Promise<SenderAccount> => {
    const { data } = await apiClient.get<ApiResponse<{ account: SenderAccount }>>(`/api/accounts/${id}`);
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to fetch account');
    }
    return data.data.account;
  },

  create: async (account: Partial<SenderAccount>): Promise<SenderAccount> => {
    const { data } = await apiClient.post<ApiResponse<{ account: SenderAccount }>>('/api/accounts', account);
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to create account');
    }
    return data.data.account;
  },

  update: async (id: number, updates: Partial<SenderAccount>): Promise<SenderAccount> => {
    const { data } = await apiClient.patch<ApiResponse<{ account: SenderAccount }>>(
      `/api/accounts/${id}`,
      updates
    );
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to update account');
    }
    return data.data.account;
  },

  delete: async (id: number): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse<void>>(`/api/accounts/${id}`);
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to delete account');
    }
  },
};
