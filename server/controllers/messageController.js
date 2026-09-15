const Message = require('../models/Message');
const User = require('../models/User');

// GET /api/messages/conversations
const getConversations = async (req, res) => {
  try {
    const myId = req.user._id;
    const messages = await Message.find({
      $or: [{ senderId: myId }, { receiverId: myId }],
    }).sort({ createdAt: -1 });

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
    const users = await User.find({ _id: { $in: otherIds } }).select('name email usn role avatar');
    const result = users.map((u) => ({
      user: u,
      lastMessage: map.get(u._id.toString()).lastMessage,
      unread: map.get(u._id.toString()).unread,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/messages/history/:otherUserId
const getHistory = async (req, res) => {
  try {
    const myId = req.user._id;
    const { otherUserId } = req.params;
    const conversationId = Message.buildConversationId(myId, otherUserId);
    const history = await Message.find({ conversationId }).sort({ createdAt: 1 }).limit(200);
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getConversations, getHistory };
