import { useQuery } from '@tanstack/react-query'
import * as bounceLogsApi from '../api/bounceLogs'
import type { BounceLogFilters } from '../api/types'

export const useBounceLogs = (filters: BounceLogFilters = {}) =>
  useQuery({ queryKey: ['bounce-logs', filters], queryFn: () => bounceLogsApi.getAll(filters) })

export const useBounceLog = (id: number | undefined) =>
  useQuery({ queryKey: ['bounce-logs', id], queryFn: () => bounceLogsApi.getById(id!), enabled: !!id })

export const useBounceLogStats = () =>
  useQuery({ queryKey: ['bounce-logs', 'stats'], queryFn: bounceLogsApi.getStats })
