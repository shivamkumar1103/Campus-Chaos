// Thin HTTP layer — delegates to authService. No DB calls here.
const authService = require('../services/authService');
const { COOKIE_NAME } = require('../middleware/auth');

const isProd = process.env.NODE_ENV === 'production';

const cookieOptions = () => ({
  httpOnly: true,
  secure: isProd, // https only in production
  sameSite: process.env.COOKIE_SAMESITE || 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7d, matches JWT_EXPIRES_IN default
  path: '/',
});

const setAuthCookie = (res, token) => res.cookie(COOKIE_NAME, token, cookieOptions());
const clearAuthCookie = (res) => res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });

const handleError = (res, err) => {
  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Server error' });
};

// POST /api/auth/register — public, always creates a student
const register = async (req, res) => {
  try {
    const { name, email, password, usn, department } = req.body;
    // NOTE: role is intentionally ignored — public signup is student-only.
    const { token, user } = await authService.registerStudent({ name, email, password, usn, department });
    setAuthCookie(res, token);
    res.status(201).json({ user });
  } catch (err) {
    handleError(res, err);
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { token, user } = await authService.login({ email, password });
    setAuthCookie(res, token);
    res.json({ user });
  } catch (err) {
    handleError(res, err);
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  clearAuthCookie(res);
  res.json({ message: 'Logged out' });
};

// GET /api/auth/me
const me = async (req, res) => {
  res.json(req.user);
};

// POST /api/auth/admin/users — admin only, can create teacher / cr / student / admin
const adminCreateUser = async (req, res) => {
  try {
    const { name, email, password, role, usn, department } = req.body;
    const user = await authService.createUserByAdmin({ name, email, password, role, usn, department });
    res.status(201).json({ user });
  } catch (err) {
    handleError(res, err);
  }
};

// GET /api/auth/admin/users — admin only
const adminListUsers = async (req, res) => {
  try {
    const users = await authService.listUsers();
    res.json(users);
  } catch (err) {
    handleError(res, err);
  }
};

module.exports = { register, login, logout, me, adminCreateUser, adminListUsers };
