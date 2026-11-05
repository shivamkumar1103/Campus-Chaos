const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/AppError');

// Directory search for 1-on-1 chat: find people by name/email/usn/department.
const searchUsers = async (q, excludeId) => {
  if (!q || q.trim().length < 2) {
    throw new AppError('Type at least 2 characters to search', 400);
  }
  return userRepository.search(q, excludeId);
};

module.exports = { searchUsers };
