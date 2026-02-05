import apiClient from './client';
import type { ApiResponse } from '@/types/api';

export interface EC2Instance {
  id: number;
  campaign_id: number;
  instance_id: string;
  status: string;
  public_ip: string | null;
  instance_type: string;
  created_at: string;
  terminated_at: string | null;
}

export interface DNSConfig {
  fullDomain: string;
  status: string;
  verified: boolean;
  last_checked: string;
}

export interface SSLCertificate {
  id: number;
  domain: string;
  status: string;
  issued_at: string | null;
  expires_at: string | null;
  days_remaining: number;
}

export interface DeploymentStatus {
  deployment_status: string;
  ec2_status: EC2Instance | null;
  dns_status: DNSConfig | null;
  ssl_status: SSLCertificate | null;
  deployment_logs: any[];
}

export const ec2Api = {
  // EC2 Instance Management
  createEC2Instance: async (campaignId: number, instanceType = 't3.micro'): Promise<EC2Instance> => {
    const { data } = await apiClient.post<ApiResponse<{ ec2_instance: EC2Instance }>>(
      `/api/campaigns/${campaignId}/ec2`,
      { instanceType }
    );
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to create EC2 instance');
    }
    return data.data.ec2_instance;
  },

  getEC2Status: async (campaignId: number): Promise<EC2Instance | null> => {
    const { data } = await apiClient.get<ApiResponse<{ ec2_instance: EC2Instance | null }>>(
      `/api/campaigns/${campaignId}/ec2`
    );
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to get EC2 status');
    }
    return data.data.ec2_instance;
  },

  terminateEC2Instance: async (campaignId: number): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse<void>>(
      `/api/campaigns/${campaignId}/ec2`
    );
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to terminate EC2 instance');
    }
  },

  // DNS Management
  createDNSRecords: async (campaignId: number, domain?: string, subdomain?: string): Promise<DNSConfig> => {
    const { data } = await apiClient.post<ApiResponse<{ dns_config: DNSConfig }>>(
      `/api/campaigns/${campaignId}/dns`,
      { domain, subdomain }
    );
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to create DNS records');
    }
    return data.data.dns_config;
  },

  getDNSStatus: async (campaignId: number): Promise<DNSConfig> => {
    const { data } = await apiClient.get<ApiResponse<DNSConfig>>(
      `/api/campaigns/${campaignId}/dns`
    );
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to get DNS status');
    }
    return data.data;
  },

  deleteDNSRecords: async (campaignId: number): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse<void>>(
      `/api/campaigns/${campaignId}/dns`
    );
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to delete DNS records');
    }
  },

  // SSL Certificate Management
  createSSLCertificate: async (campaignId: number, email?: string): Promise<SSLCertificate> => {
    const { data } = await apiClient.post<ApiResponse<{ ssl_certificate: SSLCertificate }>>(
      `/api/campaigns/${campaignId}/ssl`,
      { email }
    );
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to create SSL certificate');
    }
    return data.data.ssl_certificate;
  },

  getSSLStatus: async (campaignId: number): Promise<SSLCertificate | null> => {
    const { data } = await apiClient.get<ApiResponse<{ ssl_certificate: SSLCertificate | null; ssl_active: boolean }>>(
      `/api/campaigns/${campaignId}/ssl`
    );
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to get SSL status');
    }
    return data.data.ssl_certificate;
  },

  renewSSLCertificate: async (campaignId: number): Promise<SSLCertificate> => {
    const { data } = await apiClient.post<ApiResponse<{ ssl_certificate: SSLCertificate }>>(
      `/api/campaigns/${campaignId}/ssl/renew`
    );
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to renew SSL certificate');
    }
    return data.data.ssl_certificate;
  },

  // VPS Deployment
  deployVPS: async (
    campaignId: number, 
    config?: { instanceType?: string; subdomain?: string; email?: string }
  ): Promise<DeploymentStatus> => {
    const { data } = await apiClient.post<ApiResponse<DeploymentStatus>>(
      `/api/campaigns/${campaignId}/deploy`,
      config
    );
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to deploy VPS');
    }
    return data.data;
  },

  getDeploymentStatus: async (campaignId: number): Promise<DeploymentStatus> => {
    const { data } = await apiClient.get<ApiResponse<DeploymentStatus>>(
      `/api/campaigns/${campaignId}/deploy/status`
    );
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to get deployment status');
    }
    return data.data;
  },
};
