import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Inbox, Users } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import { useConversations, chatKeys } from '../hooks/useMessaging';
import { ConversationList } from './ConversationList';
import { UserSearch } from './UserSearch';
import { ChatWindow } from './ChatWindow';
import { cn } from '../../../lib/utils';

export default function ChatLayout({ initialPeer, onPeerConsumed }) {
  const { user } = useAuth();
  const { socket, onlineUserIds } = useSocket();
  const queryClient = useQueryClient();
  const [view, setView] = useState('chats');
  const [peer, setPeer] = useState(null);

  const { data: conversations } = useConversations(Boolean(user));

  useEffect(() => {
    if (initialPeer) {
      setPeer(initialPeer);
      setView('chats');
      onPeerConsumed?.();
    }
  }, [initialPeer, onPeerConsumed]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => queryClient.invalidateQueries({ queryKey: chatKeys.conversations });
    socket.on('receive_message', refresh);
    return () => socket.off('receive_message', refresh);
  }, [socket, queryClient]);

  if (!user) {
    return (
      <div className="brutal-lg bg-hyper p-6 text-white">
        <p className="font-display text-2xl font-extrabold uppercase">DMs are members-only</p>
        <p className="mt-1 font-mono text-[11px] font-bold tracking-widest uppercase">Login to message other students →</p>
      </div>
    );
  }

  const pick = (u) => {
    setPeer(u);
    setView('chats');
  };

  return (
    <div className="space-y-3">
      <div className="brutal-lg flex flex-wrap items-end justify-between gap-2 overflow-hidden bg-mint p-5 text-ink">
        <div>
          <p className="brutal-flat inline-block bg-ink px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.2em] text-cream uppercase">Socket.io // presence on</p>
          <h2 className="font-display mt-2 text-4xl leading-none font-extrabold uppercase sm:text-5xl">Turbo DMs</h2>
        </div>
        <p className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase opacity-70">{(conversations ?? []).length} threads</p>
      </div>
      <div className="grid gap-4 md:grid-cols-[300px_1fr]">
        <div className="brutal space-y-3 bg-paper p-3 text-ink dark:bg-obsidian dark:text-cream">
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: 'chats', icon: Inbox, label: 'Chats' },
              { v: 'people', icon: Users, label: 'People' },
            ].map(({ v, icon: Icon, label }) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'brutal-sm flex cursor-pointer items-center justify-center gap-1.5 px-3 py-2 font-display text-xs font-extrabold tracking-widest uppercase transition-all hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5',
                  view === v ? 'bg-ink text-cream dark:bg-acid dark:text-obsidian' : 'bg-transparent hover:bg-sun hover:text-ink'
                )}
              >
                <Icon className="size-3.5" /> {label}
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
    </div>
  );
}
