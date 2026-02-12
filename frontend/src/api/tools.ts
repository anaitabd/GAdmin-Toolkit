import apiClient from './client'
import type { ApiResponse } from './types'

export interface SPFResult {
  domain: string
  spf: string
  dmarc: string
  status: string
  error?: string
}

export interface ReputationResult {
  target: string
  blacklist: string
  listed: boolean
  details?: string
}

export interface ExtractorResult {
  values: string[]
  count: number
}

export const checkSPF = (domains: string[]) =>
  apiClient.post<ApiResponse<SPFResult[]>>('/tools/spf-lookup', { domains }).then(r => r.data)

export const checkReputation = (target: string) =>
  apiClient.post<ApiResponse<ReputationResult[]>>('/tools/reputation', { target }).then(r => r.data)

export const extractFromMailbox = (data: {
  server: string
  port: number
  username: string
  password: string
  folder?: string
}) =>
  apiClient.post<ApiResponse<{ emails: string[]; count: number }>>('/tools/mailbox-extractor', data).then(r => r.data)

export const extractValues = (data: { text: string; pattern: string }) =>
  apiClient.post<ApiResponse<ExtractorResult>>('/tools/extractor', data).then(r => r.data)
