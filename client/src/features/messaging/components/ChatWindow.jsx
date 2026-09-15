import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import { useChatHistory } from '../hooks/useMessaging';
import { buildConversationId } from '../api/chatApi';
import { MessageBubble } from './MessageBubble';
import { cn } from '../../../lib/utils';

// 1-on-1 chat window with one peer: REST history + live socket messages.
export function ChatWindow({ peer }) {
  const { user } = useAuth();
  const { socket, onlineUserIds } = useSocket();
  const [live, setLive] = useState([]);
  const [text, setText] = useState('');
  const [typingFrom, setTypingFrom] = useState(null);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  const peerId = peer?._id?.toString?.() ?? peer?._id;
  const myId = user?._id?.toString?.() ?? user?._id;
  const { data: history } = useChatHistory(peerId);
  const online = (onlineUserIds ?? []).map(String).includes(String(peerId));

  // Reset live buffer + mark read when switching peers.
  useEffect(() => {
    setLive([]);
    setTypingFrom(null);
    if (socket && myId && peerId) {
      socket.emit('mark_as_read', { conversationId: buildConversationId(myId, peerId), readerId: myId });
    }
  }, [socket, myId, peerId]);

  // Live socket events for this peer.
  useEffect(() => {
    if (!socket || !peerId) return;
    const relevant = (msg) =>
      [msg.senderId?.toString?.() ?? msg.senderId, msg.receiverId?.toString?.() ?? msg.receiverId].includes(peerId);

    const onMessage = (msg) => {
      if (!relevant(msg)) return;
      setLive((m) => (m.some((x) => x._id === msg._id) ? m : [...m, msg]));
      if ((msg.receiverId?.toString?.() ?? msg.receiverId) === myId) {
        socket.emit('mark_as_read', { conversationId: msg.conversationId, readerId: myId });
      }
    };
    const onTyping = ({ from }) => peerId === String(from) && setTypingFrom(from);
    const onStopTyping = ({ from }) => peerId === String(from) && setTypingFrom(null);

    socket.on('receive_message', onMessage);
    socket.on('message_saved', onMessage);
    socket.on('typing', onTyping);
    socket.on('stop_typing', onStopTyping);
    return () => {
      socket.off('receive_message', onMessage);
      socket.off('message_saved', onMessage);
      socket.off('typing', onTyping);
      socket.off('stop_typing', onStopTyping);
    };
  }, [socket, peerId, myId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, live, typingFrom]);

  if (!peer) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border bg-card p-8 text-sm text-muted-foreground">
        Pick a chat or search someone to start messaging.
      </div>
    );
  }

  const send = () => {
    if (!text.trim() || !socket) return;
    socket.emit('send_message', { senderId: myId, receiverId: peerId, messageText: text.trim() });
    socket.emit('stop_typing', { to: peerId });
    setText('');
  };

  const onType = (e) => {
    setText(e.target.value);
    if (!socket) return;
    socket.emit('typing', { to: peerId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket.emit('stop_typing', { to: peerId }), 1200);
  };

  const seen = new Set((history ?? []).map((m) => m._id));
  const messages = [...(history ?? []), ...live.filter((m) => !seen.has(m._id))];

  return (
    <div className="flex h-full min-h-[420px] flex-col rounded-xl border bg-card">
      <div className="flex items-center gap-3 border-b p-3">
        <span className="relative flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
          {peer.name?.charAt(0)?.toUpperCase()}
          <span className={cn('absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background', online ? 'bg-green-500' : 'bg-muted-foreground/40')} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{peer.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {[peer.usn, peer.department, peer.role].filter(Boolean).join(' • ')} {online ? '• online' : '• offline'}
          </p>
        </div>
        {typingFrom && <Badge variant="secondary" className="ml-auto">typing...</Badge>}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((m) => (
          <MessageBubble
            key={m._id ?? `${m.createdAt}-${m.messageText}`}
            text={m.messageText}
            mine={(m.senderId?.toString?.() ?? m.senderId) === myId}
            time={m.createdAt}
          />
        ))}
        {messages.length === 0 && <p className="p-4 text-center text-xs text-muted-foreground">No messages yet — say hi.</p>}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t p-3">
        <Input
          value={text}
          onChange={onType}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={`Message ${peer.name}...`}
        />
        <Button onClick={send} size="icon" aria-label="Send"><Send /></Button>
      </div>
    </div>
  );
}
