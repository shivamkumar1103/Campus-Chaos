const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

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

const protect = catchAsync(async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return next(new AppError('Not authorized, no authentication token provided', 401));
  }

  // 1. Verify token signature & expiry (any JWT error will be caught by catchAsync and converted in errorController)
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');

  // 2. Check if user still exists in DB
  const currentUser = await User.findById(decoded.id).select('+passwordChangedAt');
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // 3. Check if password was changed after JWT was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('Password was recently changed. Please log in again.', 401));
  }

  // 4. Check if account email is verified
  if (currentUser.isVerified === false) {
    const error = new AppError('Please verify your email address to access this resource.', 403);
    error.requiresVerification = true;
    error.email = currentUser.email;
    return next(error);
  }

  req.user = currentUser;
  next();
});

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(
      new AppError(`Access denied. Requires one of roles: [${roles.join(', ')}]`, 403)
    );
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
