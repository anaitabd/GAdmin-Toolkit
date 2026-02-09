import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, useRef, useCallback } from 'react'
import * as jobsApi from '../api/jobs'
import type { Job } from '../api/types'

export const useJobs = () =>
  useQuery({ queryKey: ['jobs'], queryFn: jobsApi.getAll, refetchInterval: 5000 })

export const useJob = (id: number | undefined) =>
  useQuery({ queryKey: ['jobs', id], queryFn: () => jobsApi.getById(id!), enabled: !!id })

export const useDeleteJob = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => jobsApi.deleteJob(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
}

export const useCampaignStats = (jobId: number | undefined) =>
  useQuery({
    queryKey: ['campaign-stats', jobId],
    queryFn: () => jobsApi.getCampaignStats(jobId!),
    enabled: !!jobId,
    refetchInterval: 5000,
  })

export const useCancelJob = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => jobsApi.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
}

export const usePauseJob = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => jobsApi.pause(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
}

export const useResumeJob = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => jobsApi.resume(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
}

export const useSendEmails = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (provider: 'gmail_api' | 'smtp') => jobsApi.sendEmails(provider),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
}

export const useSendCampaign = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      provider: 'gmail_api' | 'smtp'
      from_name: string
      subject: string
      html_content: string
      batch_size: number
      geo?: string | null
      list_name?: string | null
      recipient_offset?: number | null
      recipient_limit?: number | null
      user_ids?: number[] | null
      offer_id?: number | null
    }) => jobsApi.sendCampaign(params),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
}

export const useSendTestEmail = () => {
  return useMutation({
    mutationFn: (params: {
      provider: 'gmail_api' | 'smtp'
      from_name: string
      subject: string
      html_content: string
      test_email: string
    }) => jobsApi.sendTestEmail(params),
  })
}

export const useGenerateUsers = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ domain, num_records }: { domain: string; num_records: number }) =>
      jobsApi.generateUsers(domain, num_records),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export const useCreateGoogleUsers = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (admin_email: string) => jobsApi.createGoogleUsers(admin_email),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
}

export const useDeleteGoogleUsers = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (admin_email: string) => jobsApi.deleteGoogleUsers(admin_email),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
}

export const useDetectBounces = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => jobsApi.detectBounces(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['bounce-logs'] })
    },
  })
}

export const useBulkUsers = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: jobsApi.bulkUsers,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export const useBulkEmails = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (emails: Array<string | { to_email: string; geo?: string }>) => jobsApi.bulkEmails(emails),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-data'] }),
  })
}

export const useBulkNames = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: jobsApi.bulkNames,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['names'] }),
  })
}

// SSE hook for real-time job progress
export function useJobStream(jobId: number | null): Job | null {
  const [job, setJob] = useState<Job | null>(null)
  const esRef = useRef<EventSource | null>(null)

  const close = useCallback(() => {
    if (esRef.current) { esRef.current.close(); esRef.current = null }
  }, [])

  useEffect(() => {
    if (!jobId) { close(); setJob(null); return }

    const url = jobsApi.streamUrl(jobId)
    const es = new EventSource(url)
    esRef.current = es

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as Job
        setJob(data)
        if (['completed', 'failed', 'cancelled'].includes(data.status)) {
          es.close()
        }
      } catch { /* ignore parse errors */ }
    }
    es.onerror = () => { es.close() }

    return close
  }, [jobId, close])

  return job
}

// SSE hook for streaming multiple jobs at once (campaign grid)
export function useMultiJobStream(jobIds: number[]): Map<number, Job> {
  const [jobs, setJobs] = useState<Map<number, Job>>(new Map())
  const sourcesRef = useRef<Map<number, EventSource>>(new Map())

  useEffect(() => {
    const current = sourcesRef.current
    const activeIds = new Set(jobIds)

    // Close streams for removed job IDs
    for (const [id, es] of current) {
      if (!activeIds.has(id)) {
        es.close()
        current.delete(id)
      }
    }

    // Open streams for new job IDs
    for (const id of jobIds) {
      if (current.has(id)) continue
      const url = jobsApi.streamUrl(id)
      const es = new EventSource(url)
      current.set(id, es)

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as Job
          setJobs(prev => {
            const next = new Map(prev)
            next.set(id, data)
            return next
          })
          if (['completed', 'failed', 'cancelled'].includes(data.status)) {
            es.close()
            current.delete(id)
          }
        } catch { /* ignore */ }
      }
      es.onerror = () => { es.close(); current.delete(id) }
    }

    return () => {
      for (const es of current.values()) es.close()
      current.clear()
    }
  }, [jobIds.join(',')])  // eslint-disable-line react-hooks/exhaustive-deps

  return jobs
}
