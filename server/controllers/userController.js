// Thin HTTP layer — delegates to userService. No DB calls here.
const userService = require('../services/userService');

// GET /api/users?search=
const search = async (req, res) => {
  try {
    const users = await userService.searchUsers(req.query.search || '', req.user._id);
    res.json(users);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
  }
};

module.exports = { search };
