import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as settingsApi from '../api/settings'
import type { Settings } from '../api/types'

export const useSettings = () =>
  useQuery({ queryKey: ['settings'], queryFn: settingsApi.getAll })

export const useUpdateSettings = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Settings>) => settingsApi.update(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })
}
