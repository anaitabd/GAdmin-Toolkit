import apiClient from './client';
import type { ApiResponse } from '@/types/api';

export interface TrackingDomain {
  id: number;
  full_domain: string;
  provider: string;
  hosted_zone_id: string | null;
  campaign_id: number | null;
  campaign_name: string | null;
  status: string;
  ssl_certificate_id: number | null;
  ssl_status: string | null;
  ssl_expires_at: string | null;
  ssl_days_remaining: number | null;
  ssl_enabled: boolean;
  verified_at: string | null;
  last_checked_at: string | null;
  created_at: string;
}

export const trackingDomainsApi = {
  getTrackingDomains: async (status?: string): Promise<TrackingDomain[]> => {
    const params = status ? { status } : {};
    const { data } = await apiClient.get<ApiResponse<{ tracking_domains: TrackingDomain[] }>>(
      '/api/tracking-domains',
      { params }
    );
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to fetch tracking domains');
    }
    return data.data.tracking_domains;
  },

  addTrackingDomain: async (
    domain: string,
    provider: string,
    hostedZoneId?: string
  ): Promise<TrackingDomain> => {
    const { data } = await apiClient.post<ApiResponse<{ tracking_domain: TrackingDomain }>>(
      '/api/tracking-domains',
      { domain, provider, hosted_zone_id: hostedZoneId }
    );
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to add tracking domain');
    }
    return data.data.tracking_domain;
  },

  deleteTrackingDomain: async (id: number): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse<void>>(
      `/api/tracking-domains/${id}`
    );
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to delete tracking domain');
    }
  },

  verifyTrackingDomain: async (id: number): Promise<{ verified: boolean; status: string }> => {
    const { data } = await apiClient.post<
      ApiResponse<{ verified: boolean; status: string; tracking_domain: string }>
    >(`/api/tracking-domains/${id}/verify`);
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to verify tracking domain');
    }
    return {
      verified: data.data.verified,
      status: data.data.status,
    };
  },

  getAvailableDomains: async (): Promise<TrackingDomain[]> => {
    const { data } = await apiClient.get<ApiResponse<{ available_domains: TrackingDomain[] }>>(
      '/api/tracking-domains/available'
    );
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to fetch available domains');
    }
    return data.data.available_domains;
  },
};
