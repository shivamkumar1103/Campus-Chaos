import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  MessageCircle,
  Building2,
  Vote,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useConversations } from '../features/messaging/hooks/useMessaging';
import { Button } from './ui/button';
import { ThemeToggle } from './design/ThemeToggle';
import { Ticker } from './design/kinetic';
import { cn } from '../lib/utils';

const links = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true, chip: 'bg-sun text-ink' },
  { to: '/lost-found', label: 'Lost & Found', icon: Package, chip: 'bg-tang text-white' },
  { to: '/messages', label: 'Messages', icon: MessageCircle, badge: 'unread', chip: 'bg-cobalt text-white' },
  { to: '/rooms', label: 'Rooms', icon: Building2, chip: 'bg-mint text-ink' },
  { to: '/polls', label: 'Polls', icon: Vote, chip: 'bg-hyper text-white' },
];

function SidebarBody({ backendStatus, onNavigate }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { data: conversations } = useConversations(Boolean(user));
  const unreadTotal = (conversations ?? []).reduce((n, c) => n + (c.unread ?? 0), 0);

  const handleLogout = async () => {
    await logout();
    onNavigate?.();
    navigate('/login');
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <Link to="/" onClick={onNavigate} className="brutal group block bg-acid p-3 text-obsidian transition-transform hover:-rotate-1 hover:scale-[1.02]">
        <p className="font-display text-xl leading-none font-extrabold tracking-tight uppercase">
          Campus<br />Chaos<span className="text-hyper">.</span>
        </p>
        <p className="mt-1 font-mono text-[9px] font-bold tracking-[0.22em] uppercase">Unified College OS</p>
      </Link>

      <nav className="flex flex-col gap-2">
        {links.map(({ to, label, icon: Icon, end, badge, chip }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'brutal-sm invert-hover flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-bold uppercase tracking-wide',
                isActive
                  ? 'bg-ink text-cream dark:bg-acid dark:text-obsidian'
                  : 'bg-paper text-ink hover:bg-sun dark:bg-void dark:text-cream dark:hover:bg-hyper dark:hover:text-white'
              )
            }
          >
            <span className={cn('brutal-flat flex size-7 shrink-0 items-center justify-center', chip)}>
              <Icon className="size-4" />
            </span>
            <span className="flex-1">{label}</span>
            {badge === 'unread' && unreadTotal > 0 && (
              <span className="brutal-flat flex min-w-6 items-center justify-center bg-hyper px-1.5 py-0.5 font-mono text-[11px] font-bold text-white animate-blink">
                {unreadTotal}
              </span>
            )}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/admin/users"
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'brutal-sm invert-hover flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-bold tracking-wide uppercase',
                isActive ? 'bg-hyper text-white' : 'bg-paper text-ink hover:bg-hyper hover:text-white dark:bg-void dark:text-cream'
              )
            }
          >
            <span className="brutal-flat flex size-7 items-center justify-center bg-ink text-cream dark:bg-cream dark:text-ink">
              <ShieldCheck className="size-4" />
            </span>
            <span className="flex-1">Admin</span>
          </NavLink>
        )}
      </nav>

      <div className="brutal-sm bg-cobalt p-2.5 text-white">
        <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-[0.18em] uppercase">
          <Zap className="size-3.5 text-sun" /> Chaos tip
        </p>
        <p className="mt-1 text-[12px] leading-snug font-semibold">Found something? Post it before the canteen rush. Karma is instant.</p>
      </div>

      <div className="mt-auto space-y-2.5 border-t-[3px] border-dashed border-[var(--ink-line)] pt-3">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-widest uppercase opacity-80">
            <span className={cn('inline-block size-2.5 border border-[var(--ink-line)]', backendStatus === 'ok' ? 'bg-mint' : 'bg-hyper animate-blink')} />
            API: {backendStatus}
          </p>
          <ThemeToggle compact />
        </div>
        {user ? (
          <div className="space-y-2">
            <p className="brutal-sm truncate bg-sun px-3 py-2 font-mono text-[11px] font-bold text-ink uppercase">
              {user.name} ✦ {user.role}
            </p>
            <Button size="sm" variant="ink" className="w-full" onClick={handleLogout}>
              <LogOut /> Logout
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" onClick={onNavigate} className="flex-1">
              <Button size="sm" variant="paper" className="w-full">Login</Button>
            </Link>
            <Link to="/signup" onClick={onNavigate} className="flex-1">
              <Button size="sm" className="w-full">Sign up</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Sidebar({ backendStatus }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center gap-2 border-b-[3px] border-[var(--ink-line)] bg-acid p-2.5 text-obsidian md:hidden">
        <Button size="icon" variant="ink" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu />
        </Button>
        <span className="font-display text-lg font-extrabold tracking-tight uppercase">Campus Chaos.</span>
        <span className="ml-auto"><ThemeToggle compact /></span>
      </div>
      <Ticker
        items={['NO BEIGE PORTALS', 'BATCH C8', 'LOST & FOUND LIVE', 'DM FASTER']}
        className="border-b-[3px] border-[var(--ink-line)] bg-hyper py-1 font-mono text-[10px] font-bold tracking-[0.2em] text-white uppercase md:hidden"
        fast
      />

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-80 overflow-y-auto border-r-[3px] border-[var(--ink-line)] bg-[var(--bg)]">
            <Button size="icon" variant="hyper" className="absolute top-2 right-2" onClick={() => setOpen(false)} aria-label="Close menu">
              <X />
            </Button>
            <SidebarBody backendStatus={backendStatus} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 overflow-y-auto border-r-[3px] border-[var(--ink-line)] bg-[var(--bg-2)] md:block">
        <SidebarBody backendStatus={backendStatus} />
      </aside>
    </>
  );
}
