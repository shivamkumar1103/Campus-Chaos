import { Route } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { SignupPage } from '../pages/SignupPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';
import { ProtectedRoute } from '../components/ProtectedRoute';

// Single source of truth for auth routes.
// Rendered inside App's <Routes> — do NOT wrap in its own <Routes>.
export function AuthRouteElements() {
  return (
    <>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />
    </>
  );
}
