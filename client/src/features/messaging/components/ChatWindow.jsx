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

  useEffect(() => {
    setLive([]);
    setTypingFrom(null);
    if (socket && myId && peerId) {
      socket.emit('mark_as_read', { conversationId: buildConversationId(myId, peerId), readerId: myId });
    }
  }, [socket, myId, peerId]);

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
      <div className="brutal flex min-h-[420px] flex-col items-center justify-center gap-2 bg-sun p-8 text-center text-ink">
        <p className="font-display text-2xl font-extrabold uppercase">Pick a fighter</p>
        <p className="font-mono text-[11px] font-bold tracking-widest uppercase opacity-70">Chats ← or — People + search → start a DM</p>
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
    <div className="brutal flex h-full min-h-[420px] flex-col bg-paper text-ink dark:bg-obsidian dark:text-cream">
      <div className="flex items-center gap-3 border-b-[3px] border-[var(--ink-line)] bg-cobalt p-3 text-white">
        <span className="brutal-flat relative flex size-10 items-center justify-center bg-acid font-display text-base font-extrabold text-obsidian">
          {peer.name?.charAt(0)?.toUpperCase()}
          <span className={cn('absolute -right-1 -bottom-1 size-3 border-2 border-[var(--ink-line)]', online ? 'bg-mint animate-blink' : 'bg-hyper')} />
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-extrabold tracking-wide uppercase">{peer.name}</p>
          <p className="truncate font-mono text-[10px] tracking-widest uppercase opacity-80">
            {[peer.usn, peer.department, peer.role].filter(Boolean).join(' • ')} {online ? '• ● online' : '• ○ offline'}
          </p>
        </div>
        {typingFrom && <Badge variant="default" className="ml-auto animate-pulse">typing…</Badge>}
      </div>

      <div className="halftone flex-1 space-y-2.5 overflow-y-auto bg-cream p-3 text-ink dark:bg-void dark:text-cream">
        {messages.map((m) => (
          <MessageBubble
            key={m._id ?? `${m.createdAt}-${m.messageText}`}
            text={m.messageText}
            mine={(m.senderId?.toString?.() ?? m.senderId) === myId}
            time={m.createdAt}
          />
        ))}
        {messages.length === 0 && (
          <p className="brutal-sm mx-auto mt-6 w-fit bg-sun p-3 font-mono text-[11px] font-bold tracking-widest text-ink uppercase">
            No messages yet — say hi. Loudly.
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t-[3px] border-[var(--ink-line)] bg-[var(--bg-2)] p-3">
        <Input
          value={text}
          onChange={onType}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={`MESSAGE ${peer.name.toUpperCase()}...`}
        />
        <Button onClick={send} size="icon" variant="hyper" aria-label="Send"><Send /></Button>
      </div>
    </div>
  );
}
