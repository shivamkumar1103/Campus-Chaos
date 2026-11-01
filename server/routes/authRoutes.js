const express = require('express');
const {
  register,
  login,
  logout,
  me,
  verifyEmail,
  resendVerification,
  adminCreateUser,
  adminListUsers,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public — student signup and email verification
router.post('/register', register);
router.get('/verify-email/:token', verifyEmail);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/login', login);
router.post('/logout', logout);

// Authenticated (cookie)
router.get('/me', protect, me);

// Admin-only — create teacher / CR / student / admin
router.post('/admin/users', protect, authorize('admin'), adminCreateUser);
router.get('/admin/users', protect, authorize('admin'), adminListUsers);

module.exports = router;
