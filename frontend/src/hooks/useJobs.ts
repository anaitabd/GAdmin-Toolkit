import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, useRef, useCallback } from 'react'
import * as jobsApi from '../api/jobs'
import type { Job } from '../api/types'

export const useJobs = () =>
  useQuery({ queryKey: ['jobs'], queryFn: jobsApi.getAll, refetchInterval: 5000 })

export const useJob = (id: number | undefined) =>
  useQuery({ queryKey: ['jobs', id], queryFn: () => jobsApi.getById(id!), enabled: !!id })

export const useCancelJob = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => jobsApi.cancel(id),
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
    }) => jobsApi.sendCampaign(params),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
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
    mutationFn: jobsApi.bulkEmails,
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
