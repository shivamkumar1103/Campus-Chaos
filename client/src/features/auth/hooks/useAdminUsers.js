import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { authKeys } from '../../../lib/queryClient';

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.adminCreateUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.users }),
  });
}

export function useUsers() {
  return useQuery({ queryKey: authKeys.users, queryFn: authApi.adminListUsers, retry: false });
}
