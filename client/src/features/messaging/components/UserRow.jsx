import { cn } from '../../../lib/utils';

// Shared 1-on-1 user row: brutal hover invert, active = ink/acid.
export function UserRow({ user, online, active, unread, subtitle, onClick }) {
  const id = user._id?.toString?.() ?? user._id;
  return (
    <button
      key={id}
      onClick={onClick}
      className={cn(
        'flex w-full cursor-pointer items-center gap-3 border-2 border-transparent p-2 text-left transition-all hover:-translate-y-px hover:border-[var(--ink-line)] hover:bg-sun hover:text-ink hover:shadow-[3px_3px_0_0_var(--shadow-color)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
        active && 'border-[var(--ink-line)] bg-ink text-cream shadow-[3px_3px_0_0_var(--shadow-color)] dark:bg-acid dark:text-obsidian'
      )}
    >
      <span className="brutal-flat relative flex size-9 shrink-0 items-center justify-center bg-cobalt font-display text-sm font-extrabold text-white">
        {user.name?.charAt(0)?.toUpperCase() ?? '?'}
        <span
          className={cn(
            'absolute -right-1 -bottom-1 size-3 border-2 border-[var(--ink-line)]',
            online ? 'bg-mint' : 'bg-hyper'
          )}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-bold">{user.name}</span>
          {unread > 0 && (
            <span className="brutal-flat flex min-w-5 items-center justify-center bg-hyper px-1 py-px font-mono text-[11px] font-bold text-white animate-blink">
              {unread}
            </span>
          )}
        </span>
        <span className={cn('block truncate font-mono text-[10px] tracking-wider uppercase', active ? 'opacity-80' : 'opacity-60')}>
          {online ? '● online — ' : '○ offline — '}{subtitle ?? [user.usn, user.department, user.role].filter(Boolean).join(' • ')}
        </span>
      </span>
    </button>
  );
}
