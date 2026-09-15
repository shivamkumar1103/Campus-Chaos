import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/authApi";
import { authKeys } from "../../../lib/queryClient";
import { useAuth } from "../../../context/AuthContext";

export function useRegister() {
  const queryClient = useQueryClient();
  const { setSession } = useAuth();
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setSession(data.user);
      queryClient.setQueryData(authKeys.me, data.user);
    },
  });
}
