import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../features/auth/api/authApi';
import { authKeys } from '../lib/queryClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cookie session: browser sends httpOnly cookie automatically.
  useEffect(() => {
    authApi
      .me()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const setSession = useCallback((nextUser) => {
    setUser(nextUser ?? null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore — clear client state regardless
    }
    setUser(null);
    queryClient.removeQueries({ queryKey: authKeys.me });
    queryClient.removeQueries({ queryKey: authKeys.users });
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{ user, token: null, isLoading, setSession, logout, isAdmin: user?.role === 'admin' }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
