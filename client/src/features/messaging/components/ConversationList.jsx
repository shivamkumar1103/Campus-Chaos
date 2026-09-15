import { UserRow } from './UserRow';

// 1-on-1 conversation list: user info + last-message preview + unread badge.
export function ConversationList({ conversations, activeId, onlineIds, onPick }) {
  const online = new Set((onlineIds ?? []).map(String));

  if (!conversations?.length) {
    return <p className="p-2 text-xs text-muted-foreground">No chats yet — find someone in People to start.</p>;
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
