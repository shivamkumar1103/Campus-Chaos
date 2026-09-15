const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    conversationId: { type: String, required: true, index: true },
    messageText: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ receiverId: 1, read: 1 });

// Build a deterministic conversationId for 1-1 chats
messageSchema.statics.buildConversationId = (a, b) => {
  return [a.toString(), b.toString()].sort().join('_');
};

module.exports = mongoose.model('Message', messageSchema);
