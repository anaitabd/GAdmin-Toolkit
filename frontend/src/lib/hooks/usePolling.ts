import { useQuery } from '@tanstack/react-query';

export function usePolling<T>(
  queryKey: any[],
  queryFn: () => Promise<T>,
  interval: number = 5000,
  enabled: boolean = true
) {
  return useQuery({
    queryKey,
    queryFn,
    refetchInterval: interval,
    refetchIntervalInBackground: false,
    enabled,
  });
}
