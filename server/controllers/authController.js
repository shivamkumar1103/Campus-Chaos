// Thin HTTP layer — delegates to authService. No DB calls here.
const authService = require('../services/authService');
const { COOKIE_NAME } = require('../middleware/auth');
const catchAsync = require('../utils/catchAsync');

const isProd = process.env.NODE_ENV === 'production';

const cookieOptions = () => ({
  httpOnly: true,
  secure: isProd, // https only in production
  sameSite: process.env.COOKIE_SAMESITE || (isProd ? 'none' : 'lax'), // 'none' required for cross-domain on Vercel + Render
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7d, matches JWT_EXPIRES_IN default
  path: '/',
});

const setAuthCookie = (res, token) => res.cookie(COOKIE_NAME, token, cookieOptions());
const clearAuthCookie = (res) => res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });

// POST /api/auth/register — public, creates unverified student & sends verification email
const register = catchAsync(async (req, res, next) => {
  const { name, email, password, usn, department, classKey } = req.body;
  // NOTE: role is intentionally ignored — public signup is student-only.
  const result = await authService.registerStudent({
    name,
    email,
    password,
    usn,
    department,
    classKey,
  });
  // Note: Do NOT set auth cookie until email is verified.
  res.status(201).json(result);
});

// GET /api/auth/verify-email/:token (or query ?token=...)
const verifyEmail = catchAsync(async (req, res, next) => {
  const token = req.params.token || req.query.token;
  const { token: authToken, user, message } = await authService.verifyEmail(token);
  setAuthCookie(res, authToken);
  res.status(200).json({ message, user });
});

// POST /api/auth/resend-verification
const resendVerification = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const result = await authService.resendVerificationEmail(email);
  res.status(200).json(result);
});

// POST /api/auth/login
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const { token, user } = await authService.login({ email, password });
  setAuthCookie(res, token);
  res.json({ user });
});

// POST /api/auth/logout
const logout = (req, res) => {
  clearAuthCookie(res);
  res.json({ message: 'Logged out' });
};

// GET /api/auth/me
const me = (req, res) => {
  res.json(req.user);
};

// POST /api/auth/admin/users — admin only, can create teacher / cr / student / admin
const adminCreateUser = catchAsync(async (req, res, next) => {
  const { name, email, password, role, usn, department, classKey } = req.body;
  const user = await authService.createUserByAdmin({
    name,
    email,
    password,
    role,
    usn,
    department,
    classKey,
  });
  res.status(201).json({ user });
});

// GET /api/auth/admin/users — admin only
const adminListUsers = catchAsync(async (req, res, next) => {
  const users = await authService.listUsers();
  res.json(users);
});

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  logout,
  me,
  adminCreateUser,
  adminListUsers,
};
