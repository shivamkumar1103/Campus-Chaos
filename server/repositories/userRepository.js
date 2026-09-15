const User = require('../models/User');

// Repository = data-access only. No business rules, no HTTP.
const findByEmail = (email, withPassword = false) => {
  const q = User.findOne({ email: email?.toLowerCase().trim() });
  return withPassword ? q.select('+password') : q;
};

const findById = (id) => User.findById(id).select('-password');

const findByIdWithPassword = (id) => User.findById(id).select('+password');

const create = (data) => User.create(data);

const listAll = () => User.find({}).select('-password').sort({ createdAt: -1 }).limit(200);

// Search by name / email / usn / department. Excludes the requester.
const search = (q, excludeId) => {
  const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const filter = { $or: [{ name: rx }, { email: rx }, { usn: rx }, { department: rx }] };
  if (excludeId) filter._id = { $ne: excludeId };
  return User.find(filter).select('name email usn department role avatar').limit(20);
};

module.exports = { findByEmail, findById, findByIdWithPassword, create, listAll, search };
