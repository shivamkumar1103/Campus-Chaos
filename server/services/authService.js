const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const EmailUtils = require('../utils/emailUtils');
const AppError = require('../utils/AppError');

const getPrimaryClientUrl = () => {
  const raw = process.env.CLIENT_URL || 'http://localhost:5173';
  return raw.split(',')[0].trim().replace(/\/+$/, '');
};

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'dev_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const COLLEGE_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@nie\.ac\.in$/i;

const toPublicUser = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  usn: u.usn,
  department: u.department,
  classKey: u.classKey || '',
  avatar: u.avatar,
  isVerified: !!u.isVerified,
});

// Public signup: ALWAYS student, validates @nie.ac.in and classKey, sends verification email
const registerStudent = async ({ name, email, password, usn, department, classKey }) => {
  if (!name || !email || !password) {
    throw new AppError('Name, college email and password are required.', 400);
  }

  const trimmedEmail = email.toLowerCase().trim();
  if (!COLLEGE_EMAIL_REGEX.test(trimmedEmail)) {
    throw new AppError('Only official college email ending with @nie.ac.in is allowed.', 400);
  }

  if (!classKey || !classKey.trim()) {
    throw new AppError('Class section (e.g. CSE-5C) is required.', 400);
  }

  const formattedClass = classKey.trim().toUpperCase();
  const formattedUsn = usn ? usn.trim().toUpperCase() : '';
  const formattedDept = department ? department.trim().toUpperCase() : formattedClass.split('-')[0] || 'CSE';

  const existingUser = await userRepository.findByEmail(trimmedEmail);

  if (existingUser) {
    if (existingUser.isVerified) {
      throw new AppError('Email already registered', 400);
    }

    // User signed up before but never verified: update credentials and resend link
    existingUser.name = name.trim();
    existingUser.password = password;
    existingUser.usn = formattedUsn;
    existingUser.classKey = formattedClass;
    existingUser.department = formattedDept;

    const rawToken = existingUser.createEmailVerificationToken();
    await existingUser.save();

    const clientUrl = getPrimaryClientUrl();
    const verificationUrl = `${clientUrl}/verify-email?token=${rawToken}`;
    console.log(`\n🔗 [EMAIL VERIFICATION LINK] (${existingUser.email}):\n${verificationUrl}\n`);

    try {
      await new EmailUtils(existingUser, verificationUrl).sendVerificationEmail();
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr);
      throw new AppError('Account updated, but failed to send verification email. Please try resending verification.', 500, true);
    }

    return {
      message: 'Account updated. Please check your email inbox to verify your account.',
      email: trimmedEmail,
      requiresVerification: true,
    };
  }

  // Create new unverified student
  const user = await userRepository.create({
    name: name.trim(),
    email: trimmedEmail,
    password,
    role: 'student', // Enforced: public registration is strictly for students
    usn: formattedUsn,
    department: formattedDept,
    classKey: formattedClass,
    isVerified: false,
  });

  const rawToken = user.createEmailVerificationToken();
  await user.save();

  const clientUrl = getPrimaryClientUrl();
  const verificationUrl = `${clientUrl}/verify-email?token=${rawToken}`;
  console.log(`\n🔗 [EMAIL VERIFICATION LINK] (${user.email}):\n${verificationUrl}\n`);

  try {
    await new EmailUtils(user, verificationUrl).sendVerificationEmail();
  } catch (emailErr) {
    console.error('Failed to send verification email:', emailErr);
    throw new AppError('Account created, but failed to send verification email. Please try resending verification.', 500, true);
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
    throw new AppError('Verification token is required', 400);
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await userRepository.findByVerificationToken(hashedToken);

  if (!user) {
    throw new AppError('Verification link is invalid or has expired', 400);
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
    throw new AppError('Email is required', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await userRepository.findByEmail(normalizedEmail);

  if (!user) {
    throw new AppError('No account found with this email address', 404);
  }

  if (user.isVerified) {
    throw new AppError('This account is already verified. Please log in.', 400);
  }

  const rawToken = user.createEmailVerificationToken();
  await user.save();

  const clientUrl = getPrimaryClientUrl();
  const verificationUrl = `${clientUrl}/verify-email?token=${rawToken}`;
  console.log(`\n🔗 [EMAIL VERIFICATION LINK] (${user.email}):\n${verificationUrl}\n`);

  await new EmailUtils(user, verificationUrl).sendVerificationEmail();

  return {
    message: 'A fresh verification link has been sent to your email.',
    email: user.email,
  };
};

const login = async ({ email, password }) => {
  if (!email || !password) {
    throw new AppError('email and password are required', 400);
  }
  const user = await userRepository.findByEmail(email, true);
  if (!user) {
    throw new AppError('Invalid credentials', 400);
  }
  const match = await user.comparePassword(password);
  if (!match) {
    throw new AppError('Invalid credentials', 400);
  }

  // Check email verification status
  if (user.isVerified === false) {
    const err = new AppError('Please verify your email before logging in. Check your inbox for the verification link.', 403);
    err.requiresVerification = true;
    err.email = user.email;
    throw err;
  }

  const fresh = await userRepository.findById(user._id);
  return { token: signToken(user._id), user: toPublicUser(fresh) };
};

// Admin-only: create teacher / cr / student (/admin).
const ADMIN_CREATABLE_ROLES = ['student', 'teacher', 'cr', 'admin'];

const createUserByAdmin = async ({ name, email, password, role, usn, department, classKey }) => {
  if (!name || !email || !password || !role) {
    throw new AppError('name, email, password and role are required', 400);
  }
  if (!ADMIN_CREATABLE_ROLES.includes(role)) {
    throw new AppError(`Invalid role. Allowed: ${ADMIN_CREATABLE_ROLES.join(', ')}`, 400);
  }
  const exists = await userRepository.findByEmail(email);
  if (exists) {
    throw new AppError('Email already registered', 400);
  }
  const user = await userRepository.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role,
    usn: usn ? usn.trim().toUpperCase() : '',
    department,
    classKey: classKey ? classKey.trim().toUpperCase() : '',
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
