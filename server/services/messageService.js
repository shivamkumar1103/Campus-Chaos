const messageRepository = require('../repositories/messageRepository');
const userRepository = require('../repositories/userRepository');

const getConversations = async (myId) => {
  const messages = await messageRepository.findUserMessages(myId);

  const map = new Map();
  for (const m of messages) {
    const otherId = m.senderId.toString() === myId.toString() ? m.receiverId.toString() : m.senderId.toString();
    if (!map.has(otherId)) {
      map.set(otherId, { lastMessage: m, unread: 0 });
    }
    if (m.receiverId.toString() === myId.toString() && !m.read) {
      map.get(otherId).unread += 1;
    }
  }

  const otherIds = [...map.keys()];
  const users = await userRepository.findByIds(otherIds, 'name email usn role avatar');

  return users.map((u) => ({
    user: u,
    lastMessage: map.get(u._id.toString()).lastMessage,
    unread: map.get(u._id.toString()).unread,
  }));
};

const getHistory = async (myId, otherUserId) => {
  const conversationId = messageRepository.buildConversationId(myId, otherUserId);
  return await messageRepository.findConversationHistory(conversationId, 200);
};

module.exports = {
  getConversations,
  getHistory,
};
