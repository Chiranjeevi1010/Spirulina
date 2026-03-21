import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../services/auth.api';
import type { LoginRequest } from '@spirulina/shared';
import toast from 'react-hot-toast';

export function useAuth() {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success('Login successful');
    },
    onError: () => {
      toast.error('Invalid email or password');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      clearAuth();
    },
    onError: () => {
      clearAuth();
    },
  });

  const { data: currentUser } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.getMe,
    enabled: isAuthenticated && !user,
    retry: false,
  });

  useEffect(() => {
    if (currentUser && !user) {
      useAuthStore.getState().setAuth(
        currentUser,
        localStorage.getItem('accessToken')!,
        localStorage.getItem('refreshToken')!,
      );
    }
  }, [currentUser, user]);

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user?.role?.permissions) return false;
    const perms = user.role.permissions as Record<string, string[]>;
    return perms[resource]?.includes(action) ?? false;
  };

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    hasPermission,
  };
}
