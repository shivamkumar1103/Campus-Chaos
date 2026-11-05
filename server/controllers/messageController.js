// Thin HTTP layer — delegates to messageService. No DB calls here.
const messageService = require('../services/messageService');
const catchAsync = require('../utils/catchAsync');

// GET /api/messages/conversations
const getConversations = catchAsync(async (req, res, next) => {
  const result = await messageService.getConversations(req.user._id);
  res.json(result);
});

// GET /api/messages/history/:otherUserId
const getHistory = catchAsync(async (req, res, next) => {
  const history = await messageService.getHistory(req.user._id, req.params.otherUserId);
  res.json(history);
});

module.exports = {
  getConversations,
  getHistory,
};
