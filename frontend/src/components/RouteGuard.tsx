import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { ReactNode } from 'react';

interface RouteGuardProps {
  children: ReactNode;
  allowedRoles: string[];
}

/**
 * Route Guard — role-based access control.
 * Unauthenticated users → /login
 * Wrong role → /403
 */
export function RouteGuard({ children, allowedRoles }: RouteGuardProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
