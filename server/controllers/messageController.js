// Thin HTTP layer — delegates to messageService. No DB calls here.
const messageService = require('../services/messageService');

// GET /api/messages/conversations
const getConversations = async (req, res) => {
  try {
    const result = await messageService.getConversations(req.user._id);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
  }
};

// GET /api/messages/history/:otherUserId
const getHistory = async (req, res) => {
  try {
    const history = await messageService.getHistory(req.user._id, req.params.otherUserId);
    res.json(history);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
  }
};

module.exports = {
  getConversations,
  getHistory,
};
