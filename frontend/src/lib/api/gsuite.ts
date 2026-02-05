import apiClient from './client';
import type { ApiResponse } from '@/types/api';
import type { GSuiteDomain, GSuiteUser } from '@/types/models';

export const gsuiteApi = {
  // Domains
  getDomains: async (): Promise<GSuiteDomain[]> => {
    const { data } = await apiClient.get<ApiResponse<GSuiteDomain[]>>('/api/gsuite/domains');
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to fetch domains');
    }
    return data.data;
  },

  createDomain: async (domain: Partial<GSuiteDomain>): Promise<GSuiteDomain> => {
    const { data } = await apiClient.post<ApiResponse<GSuiteDomain>>('/api/gsuite/domains', domain);
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to create domain');
    }
    return data.data;
  },

  uploadServiceAccount: async (domainId: number, file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<ApiResponse<void>>(
      `/api/gsuite/domains/${domainId}/service-accounts`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to upload service account');
    }
  },

  // Users
  getUsers: async (domainId: number): Promise<GSuiteUser[]> => {
    const { data } = await apiClient.get<ApiResponse<GSuiteUser[]>>(
      `/api/gsuite/domains/${domainId}/users`
    );
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to fetch users');
    }
    return data.data;
  },

  generateUsers: async (domainId: number, count: number, password: string): Promise<void> => {
    const { data } = await apiClient.post<ApiResponse<void>>(
      `/api/gsuite/domains/${domainId}/users/generate`,
      { count, password }
    );
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to generate users');
    }
  },

  bulkCreateUsers: async (domainId: number): Promise<void> => {
    const { data } = await apiClient.post<ApiResponse<void>>(
      `/api/gsuite/domains/${domainId}/users/bulk-create`
    );
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to start bulk create');
    }
  },

  bulkDeleteUsers: async (domainId: number, userIds: number[]): Promise<void> => {
    const { data } = await apiClient.post<ApiResponse<void>>(
      `/api/gsuite/domains/${domainId}/users/bulk-delete`,
      { userIds }
    );
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to start bulk delete');
    }
  },

  syncFromGoogle: async (domainId: number): Promise<void> => {
    const { data } = await apiClient.post<ApiResponse<void>>(
      `/api/gsuite/domains/${domainId}/sync`
    );
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to sync from Google');
    }
  },

  createSenderAccounts: async (domainId: number, userIds: number[]): Promise<void> => {
    const { data } = await apiClient.post<ApiResponse<void>>(
      `/api/gsuite/domains/${domainId}/create-senders`,
      { userIds }
    );
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to create sender accounts');
    }
  },

  testAuthentication: async (domainId: number): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>(
      `/api/gsuite/domains/${domainId}/test-auth`
    );
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to test authentication');
    }
    return data.data;
  },

  deleteDomain: async (domainId: number): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse<void>>(
      `/api/gsuite/domains/${domainId}`
    );
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to delete domain');
    }
  },
};
