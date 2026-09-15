const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

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
});

// Public signup: ALWAYS student, even if client sends role.
const registerStudent = async ({ name, email, password, usn, department }) => {
  if (!name || !email || !password) {
    const err = new Error('name, email and password are required');
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
    role: 'student', // enforced
    usn,
    department,
  });
  return { token: signToken(user._id), user: toPublicUser(user) };
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
  });
  return toPublicUser(user);
};

const listUsers = async () => {
  const users = await userRepository.listAll();
  return users;
};

module.exports = { registerStudent, login, createUserByAdmin, listUsers, toPublicUser };
