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
  res.status(status).json({
    message: err.message || 'Server error',
    requiresVerification: !!err.requiresVerification,
    email: err.email,
  });
};

// POST /api/auth/register — public, creates unverified student & sends verification email
const register = async (req, res) => {
  try {
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
  } catch (err) {
    handleError(res, err);
  }
};

// GET /api/auth/verify-email/:token (or query ?token=...)
const verifyEmail = async (req, res) => {
  try {
    const token = req.params.token || req.query.token;
    const { token: authToken, user, message } = await authService.verifyEmail(token);
    setAuthCookie(res, authToken);
    res.status(200).json({ message, user });
  } catch (err) {
    handleError(res, err);
  }
};

// POST /api/auth/resend-verification
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.resendVerificationEmail(email);
    res.status(200).json(result);
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
