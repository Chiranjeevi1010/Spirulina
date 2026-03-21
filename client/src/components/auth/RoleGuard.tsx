import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import type { PermissionResource, PermissionAction } from '@spirulina/shared';

interface RoleGuardProps {
  resource: PermissionResource;
  action: PermissionAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ resource, action, children, fallback }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);

  if (!user?.role?.permissions) {
    return fallback ? <>{fallback}</> : <Navigate to="/dashboard" replace />;
  }

  const perms = user.role.permissions as Record<string, string[]>;
  const hasAccess = perms[resource]?.includes(action) ?? false;

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
