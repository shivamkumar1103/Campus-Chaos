import api from '../../../utils/api';

// Cookie auth — server sets/clears an httpOnly cookie. Responses carry { user }, never a token.
export const authApi = {
  // Public — always creates a student (backend enforces role)
  register: async ({ name, email, password, usn, department, classKey }) => {
    const { data } = await api.post('/auth/register', {
      name,
      email,
      password,
      usn,
      department,
      classKey,
    });
    return data; // { message, email, requiresVerification }
  },
  verifyEmail: async (token) => {
    const { data } = await api.get('/auth/verify-email', { params: { token } });
    return data; // { message, user }
  },
  resendVerification: async (email) => {
    const { data } = await api.post('/auth/resend-verification', { email });
    return data; // { message, email }
  },
  login: async ({ email, password }) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data; // { user }
  },
  logout: async () => {
    const { data } = await api.post('/auth/logout');
    return data;
  },
  me: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },
  // Admin-only
  adminCreateUser: async ({ name, email, password, role, usn, department, classKey }) => {
    const { data } = await api.post('/auth/admin/users', {
      name,
      email,
      password,
      role,
      usn,
      department,
      classKey,
    });
    return data; // { user }
  },
  adminListUsers: async () => {
    const { data } = await api.get('/auth/admin/users');
    return data;
  },
};
