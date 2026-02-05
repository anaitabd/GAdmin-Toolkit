import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '@/lib/api/accounts';
import { toast } from 'sonner';

export function useAccounts() {
  const queryClient = useQueryClient();

  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: accountsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Account created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) =>
      accountsApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Account updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: accountsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Account deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    accounts: accountsQuery.data ?? [],
    isLoading: accountsQuery.isLoading,
    error: accountsQuery.error,
    createAccount: createMutation.mutate,
    updateAccount: updateMutation.mutate,
    deleteAccount: deleteMutation.mutate,
  };
}
