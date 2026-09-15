import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

export function ProtectedRoute({ children, roles }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
