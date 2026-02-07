import { useQuery } from '@tanstack/react-query'
import * as emailLogsApi from '../api/emailLogs'
import type { EmailLogFilters } from '../api/types'

export const useEmailLogs = (filters: EmailLogFilters = {}) =>
  useQuery({ queryKey: ['email-logs', filters], queryFn: () => emailLogsApi.getAll(filters) })

export const useEmailLog = (id: number | undefined) =>
  useQuery({ queryKey: ['email-logs', id], queryFn: () => emailLogsApi.getById(id!), enabled: !!id })

export const useEmailLogStats = () =>
  useQuery({ queryKey: ['email-logs', 'stats'], queryFn: emailLogsApi.getStats })
