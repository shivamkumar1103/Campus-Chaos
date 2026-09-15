import { UserRow } from './UserRow';

// 1-on-1 conversation list: user info + last-message preview + unread badge.
export function ConversationList({ conversations, activeId, onlineIds, onPick }) {
  const online = new Set((onlineIds ?? []).map(String));

  if (!conversations?.length) {
    return <p className="brutal-flat bg-sun/40 p-2.5 font-mono text-[11px] font-bold tracking-widest text-ink uppercase">No chats yet — hit People → start one.</p>;
  }

  return (
    <div className="space-y-1">
      {conversations.map(({ user, lastMessage, unread }) => (
        <UserRow
          key={user._id}
          user={user}
          online={online.has(user._id.toString())}
          active={activeId === user._id.toString()}
          unread={unread}
          subtitle={lastMessage?.messageText}
          onClick={() => onPick?.(user)}
        />
      ))}
    </div>
  );
}
