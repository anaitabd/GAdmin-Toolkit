import apiClient from './client';
import type { LoginRequest, LoginResponse, ApiResponse } from '@/types/api';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
      '/api/auth/login',
      credentials
    );
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Login failed');
    }
    return data.data;
  },
};
