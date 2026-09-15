const userRepository = require('../repositories/userRepository');

// Directory search for 1-on-1 chat: find people by name/email/usn/department.
const searchUsers = async (q, excludeId) => {
  if (!q || q.trim().length < 2) {
    const err = new Error('Type at least 2 characters to search');
    err.statusCode = 400;
    throw err;
  }
  return userRepository.search(q, excludeId);
};

module.exports = { searchUsers };
