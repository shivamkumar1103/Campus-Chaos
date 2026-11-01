const Message = require('../models/Message');

// Repository = data-access only. No business rules, no HTTP.
const findUserMessages = (userId) => {
  return Message.find({
    $or: [{ senderId: userId }, { receiverId: userId }],
  }).sort({ createdAt: -1 });
};

const findConversationHistory = (conversationId, limit = 200) => {
  return Message.find({ conversationId })
    .sort({ createdAt: 1 })
    .limit(limit);
};

const create = (data) => {
  return Message.create(data);
};

const markAsRead = (conversationId, readerId) => {
  return Message.updateMany(
    { conversationId, receiverId: readerId, read: false },
    { $set: { read: true } }
  );
};

const buildConversationId = (id1, id2) => {
  return Message.buildConversationId(id1, id2);
};

module.exports = {
  findUserMessages,
  findConversationHistory,
  create,
  markAsRead,
  buildConversationId,
};
