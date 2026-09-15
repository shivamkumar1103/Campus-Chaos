import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import { useConversations, chatKeys } from '../hooks/useMessaging';
import { ConversationList } from './ConversationList';
import { UserSearch } from './UserSearch';
import { ChatWindow } from './ChatWindow';
import { cn } from '../../../lib/utils';

// 1-on-1 messaging: sidebar (Chats | People + search) + active chat window.
// initialPeer lets Lost & Found's "Message Owner/Finder" jump straight into a chat.
export default function ChatLayout({ initialPeer, onPeerConsumed }) {
  const { user } = useAuth();
  const { socket, onlineUserIds } = useSocket();
  const queryClient = useQueryClient();
  const [view, setView] = useState('chats');
  const [peer, setPeer] = useState(null);

  const { data: conversations } = useConversations(Boolean(user));

  // Deep-link from Lost & Found.
  useEffect(() => {
    if (initialPeer) {
      setPeer(initialPeer);
      setView('chats');
      onPeerConsumed?.();
    }
  }, [initialPeer, onPeerConsumed]);

  // New incoming message → refresh conversation list (unread badges, previews).
  useEffect(() => {
    if (!socket) return;
    const refresh = () => queryClient.invalidateQueries({ queryKey: chatKeys.conversations });
    socket.on('receive_message', refresh);
    return () => socket.off('receive_message', refresh);
  }, [socket, queryClient]);

  if (!user) {
    return (
      <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        Login to message other students.
      </div>
    );
  }

  const pick = (u) => {
    setPeer(u);
    setView('chats');
  };

  return (
    <div className="grid gap-4 md:grid-cols-[300px_1fr]">
      <div className="space-y-3 rounded-xl border bg-card p-3">
        <div className="flex gap-2">
          {['chats', 'people'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'flex-1 rounded-full px-3 py-1 text-sm capitalize',
                view === v ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'
              )}
            >
              {v}
            </button>
          ))}
        </div>
        {view === 'chats' ? (
          <ConversationList
            conversations={conversations}
            activeId={peer?._id?.toString?.() ?? peer?._id}
            onlineIds={onlineUserIds}
            onPick={pick}
          />
        ) : (
          <UserSearch onlineIds={onlineUserIds} onPick={pick} />
        )}
      </div>
      <ChatWindow peer={peer} />
    </div>
  );
}
