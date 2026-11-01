const jwt = require('jsonwebtoken');
const User = require('../models/User');

const COOKIE_NAME = process.env.COOKIE_NAME || 'cc_token';

// Extract token from either httpOnly cookie or Authorization: Bearer <token>
const getTokenFromRequest = (req) => {
  if (req.cookies?.[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

const protect = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no authentication token provided' });
  }

  try {
    // 1. Verify token signature & expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');

    // 2. Check if user still exists in DB
    const currentUser = await User.findById(decoded.id).select('+passwordChangedAt');
    if (!currentUser) {
      return res.status(401).json({ message: 'The user belonging to this token no longer exists.' });
    }

    // 3. Check if password was changed after JWT was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        message: 'Password was recently changed. Please log in again.',
        code: 'PASSWORD_CHANGED',
      });
    }

    // 4. Check if account email is verified
    if (currentUser.isVerified === false) {
      return res.status(403).json({
        message: 'Please verify your email address to access this resource.',
        requiresVerification: true,
        email: currentUser.email,
      });
    }

    req.user = currentUser;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Your session has expired. Please log in again.', code: 'TOKEN_EXPIRED' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid authentication token. Please log in again.', code: 'TOKEN_INVALID' });
    }
    return res.status(401).json({ message: err.message || 'Authentication failed' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access denied. Requires one of roles: [${roles.join(', ')}]`,
    });
  }
  next();
};

const optionalAuth = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    const currentUser = await User.findById(decoded.id).select('+passwordChangedAt');

    if (
      !currentUser ||
      currentUser.isVerified === false ||
      currentUser.changedPasswordAfter(decoded.iat)
    ) {
      req.user = null;
    } else {
      req.user = currentUser;
    }
  } catch (err) {
    req.user = null;
  }
  next();
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
  COOKIE_NAME,
  getTokenFromRequest,
};
