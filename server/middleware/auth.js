const jwt = require('jsonwebtoken');
const User = require('../models/User');

const COOKIE_NAME = process.env.COOKIE_NAME || 'cc_token';

const protect = async (req, res, next) => {
  // Cookie-only auth: token is httpOnly, never exposed to JS.
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalid or expired' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: `Role ${req.user.role} not allowed` });
  }
  next();
};

module.exports = { protect, authorize, COOKIE_NAME };
