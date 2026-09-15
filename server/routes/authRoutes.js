const express = require('express');
const { register, login, logout, me, adminCreateUser, adminListUsers } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public — student-only signup
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Authenticated (cookie)
router.get('/me', protect, me);

// Admin-only — create teacher / CR / student / admin
router.post('/admin/users', protect, authorize('admin'), adminCreateUser);
router.get('/admin/users', protect, authorize('admin'), adminListUsers);

module.exports = router;
