import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { useAuth } from '../../hooks/useAuth';
import { PageLoader } from '../ui';

export function ProtectedRoute() {
  const { isAuthenticated, accessToken } = useAuthStore();
  const { user } = useAuth();
  const [checked, setChecked] = useState(false);

  // Rehydrate auth state from localStorage on mount (not during render)
  useEffect(() => {
    const { checkAuth } = useAuthStore.getState();
    checkAuth();
    setChecked(true);
  }, []);

  // Still initializing — show loader
  if (!checked) {
    return <PageLoader />;
  }

  // No token at all — redirect to login
  const hasToken = !!accessToken || !!localStorage.getItem('accessToken');
  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" replace />;
  }

  // Token exists but user data not yet fetched — show loader
  if (!user) {
    return <PageLoader />;
  }

  return <Outlet />;
}
