const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const EmailUtils = require('../utils/emailUtils');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'dev_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const toPublicUser = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  usn: u.usn,
  department: u.department,
  avatar: u.avatar,
  isVerified: !!u.isVerified,
});

// Public signup: ALWAYS student, creates unverified user and sends verification email
const registerStudent = async ({ name, email, password, usn, department }) => {
  if (!name || !email || !password) {
    const err = new Error('Name, email and password are required');
    err.statusCode = 400;
    throw err;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await userRepository.findByEmail(normalizedEmail);

  if (existingUser) {
    if (existingUser.isVerified) {
      const err = new Error('Email already registered');
      err.statusCode = 400;
      throw err;
    }

    // User signed up before but never verified: update credentials and resend link
    existingUser.name = name.trim();
    existingUser.password = password;
    if (usn) existingUser.usn = usn;
    if (department) existingUser.department = department;

    const rawToken = existingUser.createEmailVerificationToken();
    await existingUser.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const verificationUrl = `${clientUrl}/verify-email?token=${rawToken}`;

    try {
      await new EmailUtils(existingUser, verificationUrl).sendVerificationEmail();
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr);
      const err = new Error('Account created, but failed to send verification email. Please try resending verification.');
      err.statusCode = 500;
      throw err;
    }

    return {
      message: 'Account updated. Please check your email inbox to verify your account.',
      email: normalizedEmail,
      requiresVerification: true,
    };
  }

  // Create new unverified student
  const user = await userRepository.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: 'student', // enforced
    usn,
    department,
    isVerified: false,
  });

  const rawToken = user.createEmailVerificationToken();
  await user.save();

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const verificationUrl = `${clientUrl}/verify-email?token=${rawToken}`;

  try {
    await new EmailUtils(user, verificationUrl).sendVerificationEmail();
  } catch (emailErr) {
    console.error('Failed to send verification email:', emailErr);
    const err = new Error('Account created, but failed to send verification email. Please try resending verification.');
    err.statusCode = 500;
    throw err;
  }

  return {
    message: 'Registration successful! Please check your email to verify your account.',
    email: user.email,
    requiresVerification: true,
  };
};

// Verify user email by token
const verifyEmail = async (token) => {
  if (!token) {
    const err = new Error('Verification token is required');
    err.statusCode = 400;
    throw err;
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await userRepository.findByVerificationToken(hashedToken);

  if (!user) {
    const err = new Error('Verification link is invalid or has expired');
    err.statusCode = 400;
    throw err;
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationExpires = undefined;
  await user.save();

  return {
    token: signToken(user._id),
    user: toPublicUser(user),
    message: 'Email verified successfully! You are now logged in.',
  };
};

// Resend verification email
const resendVerificationEmail = async (email) => {
  if (!email) {
    const err = new Error('Email is required');
    err.statusCode = 400;
    throw err;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await userRepository.findByEmail(normalizedEmail);

  if (!user) {
    const err = new Error('No account found with this email address');
    err.statusCode = 404;
    throw err;
  }

  if (user.isVerified) {
    const err = new Error('This account is already verified. Please log in.');
    err.statusCode = 400;
    throw err;
  }

  const rawToken = user.createEmailVerificationToken();
  await user.save();

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const verificationUrl = `${clientUrl}/verify-email?token=${rawToken}`;

  await new EmailUtils(user, verificationUrl).sendVerificationEmail();

  return {
    message: 'A fresh verification link has been sent to your email.',
    email: user.email,
  };
};

const login = async ({ email, password }) => {
  if (!email || !password) {
    const err = new Error('email and password are required');
    err.statusCode = 400;
    throw err;
  }
  const user = await userRepository.findByEmail(email, true);
  if (!user) {
    const err = new Error('Invalid credentials');
    err.statusCode = 400;
    throw err;
  }
  const match = await user.comparePassword(password);
  if (!match) {
    const err = new Error('Invalid credentials');
    err.statusCode = 400;
    throw err;
  }

  // Check email verification status
  if (user.isVerified === false) {
    const err = new Error('Please verify your email before logging in. Check your inbox for the verification link.');
    err.statusCode = 403;
    err.requiresVerification = true;
    err.email = user.email;
    throw err;
  }

  const fresh = await userRepository.findById(user._id);
  return { token: signToken(user._id), user: toPublicUser(fresh) };
};

// Admin-only: create teacher / cr / student (/admin).
const ADMIN_CREATABLE_ROLES = ['student', 'teacher', 'cr', 'admin'];

const createUserByAdmin = async ({ name, email, password, role, usn, department }) => {
  if (!name || !email || !password || !role) {
    const err = new Error('name, email, password and role are required');
    err.statusCode = 400;
    throw err;
  }
  if (!ADMIN_CREATABLE_ROLES.includes(role)) {
    const err = new Error(`Invalid role. Allowed: ${ADMIN_CREATABLE_ROLES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  const exists = await userRepository.findByEmail(email);
  if (exists) {
    const err = new Error('Email already registered');
    err.statusCode = 400;
    throw err;
  }
  const user = await userRepository.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role,
    usn,
    department,
    isVerified: true, // Admin-created accounts are pre-verified
  });
  return toPublicUser(user);
};

const listUsers = async () => {
  const users = await userRepository.listAll();
  return users;
};

module.exports = {
  registerStudent,
  verifyEmail,
  resendVerificationEmail,
  login,
  createUserByAdmin,
  listUsers,
  toPublicUser,
};
