import { Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { SignupPage } from '../pages/SignupPage';
import { VerifyEmailPage } from '../pages/VerifyEmailPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AdminDashboard } from '../../admin/pages/AdminDashboard';

// Single source of truth for auth & admin routes.
// Rendered inside App's <Routes> — do NOT wrap in its own <Routes>.
export function AuthRouteElements() {
  return (
    <>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={<Navigate to="/admin?tab=users" replace />}
      />
    </>
  );
}
