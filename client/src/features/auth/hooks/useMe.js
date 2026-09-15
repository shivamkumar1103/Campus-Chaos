import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { authKeys } from '../../../lib/queryClient';

export function useMe(enabled = true) {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: authApi.me,
    enabled,
    retry: false,
  });
}
