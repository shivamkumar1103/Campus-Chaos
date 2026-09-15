const Message = require('../models/Message');

// userId -> socketId
const onlineUsers = new Map();

function initChatSocket(io) {
  io.on('connection', (socket) => {
    // Client should emit: join { userId }
    socket.on('join', (userId) => {
      if (!userId) return;
      onlineUsers.set(userId.toString(), socket.id);
      socket.data.userId = userId.toString();
      io.emit('presence', [...onlineUsers.keys()]);
    });

    socket.on('send_message', async ({ senderId, receiverId, messageText }) => {
      try {
        if (!senderId || !receiverId || !messageText) return;
        const conversationId = Message.buildConversationId(senderId, receiverId);
        const msg = await Message.create({ senderId, receiverId, conversationId, messageText });

        const receiverSocketId = onlineUsers.get(receiverId.toString());
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', msg);
        }
        // echo back to sender for confirmation
        socket.emit('message_saved', msg);
      } catch (err) {
        socket.emit('message_error', { message: err.message });
      }
    });

    socket.on('typing', ({ to }) => {
      const s = onlineUsers.get(to?.toString());
      if (s) io.to(s).emit('typing', { from: socket.data.userId });
    });

    socket.on('stop_typing', ({ to }) => {
      const s = onlineUsers.get(to?.toString());
      if (s) io.to(s).emit('stop_typing', { from: socket.data.userId });
    });

    socket.on('mark_as_read', async ({ conversationId, readerId }) => {
      try {
        await Message.updateMany(
          { conversationId, receiverId: readerId, read: false },
          { $set: { read: true } }
        );
      } catch {}
    });

    socket.on('disconnect', () => {
      if (socket.data.userId) onlineUsers.delete(socket.data.userId);
      io.emit('presence', [...onlineUsers.keys()]);
    });
  });
}

module.exports = { initChatSocket, onlineUsers };
