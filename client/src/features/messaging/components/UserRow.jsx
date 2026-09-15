import { cn } from '../../../lib/utils';

// Shared 1-on-1 user row: avatar initial + name + details + online dot.
export function UserRow({ user, online, active, unread, subtitle, onClick }) {
  const id = user._id?.toString?.() ?? user._id;
  return (
    <button
      key={id}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-accent',
        active && 'bg-accent'
      )}
    >
      <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
        {user.name?.charAt(0)?.toUpperCase() ?? '?'}
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background',
            online ? 'bg-green-500' : 'bg-muted-foreground/40'
          )}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">{user.name}</span>
          {unread > 0 && (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">
              {unread}
            </span>
          )}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {subtitle ?? [user.usn, user.department, user.role].filter(Boolean).join(' • ')}
        </span>
      </span>
    </button>
  );
}
