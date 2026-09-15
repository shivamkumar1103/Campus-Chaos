import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { authKeys } from '../../../lib/queryClient';
import { useAuth } from '../../../context/AuthContext';

export function useLogin() {
  const queryClient = useQueryClient();
  const { setSession } = useAuth();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // No localStorage — session lives in the httpOnly cookie.
      setSession(data.user);
      queryClient.setQueryData(authKeys.me, data.user);
    },
  });
}
