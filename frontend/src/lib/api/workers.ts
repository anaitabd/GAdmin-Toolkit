import apiClient from './client';
import type { ApiResponse } from '@/types/api';

export interface WorkerStatus {
  accountId: number;
  email: string;
  accountStatus: string;
  lastHeartbeat: string | null;
  dailySent: number;
  dailyLimit: number;
  processStatus: string;
  uptime: number | null;
  pid?: number;
  restarts?: number;
}

export interface WorkerDetails {
  account: {
    id: number;
    email: string;
    status: string;
    dailySent: number;
    dailyLimit: number;
    dailyBounces: number;
    dailyErrors: number;
    lastUsedAt: string | null;
    lastHeartbeat: string | null;
  };
  workerProcess: {
    accountId?: number;
    pid?: number;
    status: string;
    uptime?: number;
    startedAt?: string;
    restarts?: number;
    lastRestart?: string | null;
    message?: string;
  };
  recentStats: {
    sent_count: string;
    failed_count: string;
    last_sent_at: string | null;
  };
  orchestratorAvailable: boolean;
}

export interface WorkerMetrics {
  lastHour: {
    totalSent: number;
    successful: number;
    failed: number;
    bounced: number;
    emailsPerSecond: number;
    errorRate: number;
    avgResponseTime: number;
    activeSenders: number;
  };
  orchestrator: {
    totalWorkers: number;
    runningWorkers: number;
    stoppingWorkers: number;
    workers: any[];
  } | null;
}

export interface WorkerLog {
  id: number;
  recipient_email: string;
  status: string;
  error_message: string | null;
  error_code: string | null;
  sent_at: string;
  response_time_ms: number;
  retry_attempt: number;
  campaign_id: string;
}

export interface WorkerLogsResponse {
  accountId: number;
  email: string;
  sendLogs: WorkerLog[];
  fileLogs: string[] | null;
  limit: number;
}

export const workersApi = {
  getWorkers: async (): Promise<WorkerStatus[]> => {
    const { data } = await apiClient.get<ApiResponse<{ workers: WorkerStatus[]; total: number }>>(
      '/api/workers'
    );
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to fetch workers');
    }
    return data.data.workers;
  },

  getWorkerStatus: async (accountId: number): Promise<WorkerDetails> => {
    const { data } = await apiClient.get<ApiResponse<WorkerDetails>>(
      `/api/workers/${accountId}/status`
    );
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to fetch worker status');
    }
    return data.data;
  },

  startWorker: async (accountId: number): Promise<void> => {
    const { data } = await apiClient.post<ApiResponse<void>>(
      `/api/workers/${accountId}/start`
    );
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to start worker');
    }
  },

  stopWorker: async (accountId: number): Promise<void> => {
    const { data } = await apiClient.post<ApiResponse<void>>(
      `/api/workers/${accountId}/stop`
    );
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to stop worker');
    }
  },

  restartWorker: async (accountId: number): Promise<void> => {
    const { data } = await apiClient.post<ApiResponse<void>>(
      `/api/workers/${accountId}/restart`
    );
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to restart worker');
    }
  },

  getWorkerLogs: async (accountId: number, limit = 100): Promise<WorkerLogsResponse> => {
    const { data } = await apiClient.get<ApiResponse<WorkerLogsResponse>>(
      `/api/workers/${accountId}/logs`,
      { params: { limit } }
    );
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to fetch worker logs');
    }
    return data.data;
  },

  getWorkerMetrics: async (): Promise<WorkerMetrics> => {
    const { data } = await apiClient.get<ApiResponse<WorkerMetrics>>(
      '/api/workers/metrics'
    );
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to fetch worker metrics');
    }
    return data.data;
  },
};
