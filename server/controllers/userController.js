// Thin HTTP layer — delegates to userService. No DB calls here.
const userService = require('../services/userService');
const catchAsync = require('../utils/catchAsync');

// GET /api/users?search=
const search = catchAsync(async (req, res, next) => {
  const users = await userService.searchUsers(req.query.search || '', req.user._id);
  res.json(users);
});

module.exports = { search };
