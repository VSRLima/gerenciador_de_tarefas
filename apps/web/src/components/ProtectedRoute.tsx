import { Navigate } from 'react-router-dom';
import { PropsWithChildren } from 'react';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps extends PropsWithChildren {
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({
  children,
  requireAdmin = false,
}: ProtectedRouteProps): JSX.Element => {
  const { authState } = useAuth();

  if (!authState) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && authState.user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
