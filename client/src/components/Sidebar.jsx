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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useConversations } from '../features/messaging/hooks/useMessaging';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

const links = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/lost-found', label: 'Lost & Found', icon: Package },
  { to: '/messages', label: 'Messages', icon: MessageCircle, badge: 'unread' },
  { to: '/rooms', label: 'Rooms', icon: Building2 },
  { to: '/polls', label: 'Polls', icon: Vote },
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
      <Link to="/" onClick={onNavigate} className="px-2">
        <p className="text-lg font-bold leading-tight">Campus Chaos</p>
        <p className="text-xs text-muted-foreground">Unified College OS</p>
      </Link>

      <nav className="flex flex-col gap-1">
        {links.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent',
                isActive ? 'bg-accent font-medium' : 'text-muted-foreground'
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {badge === 'unread' && unreadTotal > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">
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
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent',
                isActive ? 'bg-accent font-medium' : 'text-muted-foreground'
              )
            }
          >
            <ShieldCheck className="size-4 shrink-0" />
            <span className="flex-1">Admin</span>
          </NavLink>
        )}
      </nav>

      <div className="mt-auto space-y-3 border-t pt-3">
        <p className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
          <span className={cn('inline-block size-2 rounded-full', backendStatus === 'ok' ? 'bg-green-500' : 'bg-red-400')} />
          API: {backendStatus}
        </p>
        {user ? (
          <div className="space-y-2">
            <p className="truncate rounded-lg bg-secondary px-3 py-2 text-xs">
              {user.name} ({user.role})
            </p>
            <Button size="sm" variant="outline" className="w-full" onClick={handleLogout}>
              <LogOut /> Logout
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" onClick={onNavigate} className="flex-1">
              <Button size="sm" variant="outline" className="w-full">Login</Button>
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
      <div className="sticky top-0 z-30 flex items-center gap-2 border-b bg-background/90 p-3 backdrop-blur md:hidden">
        <Button size="icon" variant="ghost" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu />
        </Button>
        <span className="font-bold">Campus Chaos</span>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r bg-background shadow-lg">
            <Button size="icon" variant="ghost" className="absolute right-2 top-2" onClick={() => setOpen(false)} aria-label="Close menu">
              <X />
            </Button>
            <SidebarBody backendStatus={backendStatus} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r bg-background md:block">
        <SidebarBody backendStatus={backendStatus} />
      </aside>
    </>
  );
}
