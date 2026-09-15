import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowUpRight, BellRing, CalendarCheck2, CheckCircle2, Megaphone, Radio, Zap } from 'lucide-react';
import { useLostFoundItems } from '../../features/lost-found/hooks/useLostFound';
import { useConversations } from '../../features/messaging/hooks/useMessaging';
import { useAuth } from '../../context/AuthContext';
import { Ticker } from './kinetic';

/**
 * Interactive module / dashboard: live-feeling campus pulse board.
 * Desktop: 3-col command deck. Mobile: stacked, ticker on top.
 */
export function ChaosDashboard() {
  const { user } = useAuth();
  const { data: items } = useLostFoundItems({ q: '', type: '', category: '', status: '' });
  const { data: conversations } = useConversations(Boolean(user));
  const [filter, setFilter] = useState('all');
  const [shout, setShout] = useState('');
  const [shouts, setShouts] = useState([
    { name: 'CR • Shreyas', text: 'Lab 4 PCs free till 5PM — sprint now!', hot: true },
    { name: 'Shariq', text: 'Found: black Casio near library steps', hot: false },
  ]);

  const stats = useMemo(() => {
    const list = items ?? [];
    return {
      open: list.filter((i) => i.status === 'open').length,
      lost: list.filter((i) => i.type === 'lost').length,
      found: list.filter((i) => i.type === 'found').length,
      unread: (conversations ?? []).reduce((n, c) => n + (c.unread ?? 0), 0),
    };
  }, [items, conversations]);

  const feed = useMemo(() => {
    const list = (items ?? []).slice(0, 5);
    if (filter === 'all') return list;
    return list.filter((i) => i.type === filter);
  }, [items, filter]);

  const postShout = (e) => {
    e.preventDefault();
    if (!shout.trim()) return;
    setShouts((s) => [{ name: user?.name ?? 'Guest cadet', text: shout.trim(), hot: true }, ...s].slice(0, 4));
    setShout('');
  };

  return (
    <section aria-label="Campus pulse dashboard" className="mt-6">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-display text-3xl font-extrabold tracking-tight uppercase sm:text-4xl">
          Pulse <span className="bg-cobalt px-2 text-white">Deck</span>
        </h2>
        <p className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase opacity-70">Interactive module // live-ish data</p>
      </div>

      <Ticker
        items={[`OPEN CASES: ${stats.open}`, `LOST: ${stats.lost} / FOUND: ${stats.found}`, `UNREAD DMS: ${stats.unread}`, user ? `LOGGED IN AS ${user.name.toUpperCase()}` : 'LOGIN TO UNLOCK DMS']}
        className="brutal-sm mb-4 bg-ink py-1.5 font-mono text-[11px] font-bold tracking-[0.18em] text-cream uppercase dark:bg-acid dark:text-obsidian"
        slow
      />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
        {/* COL 1 — activity */}
        <div className="brutal bg-paper p-4 text-ink dark:bg-obsidian dark:text-cream">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 font-mono text-[11px] font-bold tracking-[0.2em] uppercase">
              <Activity className="size-4" /> Live board feed
            </p>
            <div className="flex gap-1.5">
              {['all', 'lost', 'found'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`brutal-flat cursor-pointer px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${filter === f ? 'bg-ink text-cream dark:bg-acid dark:text-obsidian' : 'bg-transparent hover:bg-sun'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {feed?.length ? feed.map((it) => (
              <Link
                key={it._id}
                to="/lost-found"
                className="brutal-sm invert-hover flex items-center gap-3 bg-cream p-2 hover:bg-sun dark:bg-void dark:hover:bg-grape"
              >
                <span className={`shrink-0 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${it.type === 'lost' ? 'bg-hyper text-white' : 'bg-mint text-ink'}`}>
                  {it.type}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold">{it.title}</span>
                  <span className="block truncate font-mono text-[10px] opacity-70">{it.location || it.locationFound || 'campus'} • {it.status}</span>
                </span>
                <ArrowUpRight className="size-4 shrink-0" />
              </Link>
            )) : (
              <p className="brutal-flat bg-sun/40 p-3 text-sm font-bold">No signal yet. Post the first case →</p>
            )}
          </div>
          <Link to="/lost-found" className="brutal-sm invert-hover mt-3 inline-flex items-center gap-1 bg-tang px-3 py-2 font-mono text-[11px] font-bold tracking-widest text-white uppercase hover:bg-hyper">
            Open full board <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        {/* COL 2 — stat blocks */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'OPEN CASES', value: String(stats.open), cls: 'bg-sun text-ink', sub: 'NEED HEROES' },
            { label: 'UNREAD DMS', value: String(stats.unread), cls: 'bg-hyper text-white', sub: user ? 'GO REPLY' : 'LOGIN REQ' },
            { label: 'ROOMS FREE', value: '6/12', cls: 'bg-mint text-ink', sub: 'MOCK • LIVE SOON' },
            { label: 'ACTIVE POLL', value: '68%', cls: 'bg-cobalt text-white', sub: 'CR TURNOUT' },
          ].map((s) => (
            <div key={s.label} className={`brutal brutal-hover p-3 ${s.cls}`}>
              <p className="font-mono text-[10px] font-bold tracking-[0.18em]">{s.label}</p>
              <p className="font-display text-4xl font-extrabold">{s.value}</p>
              <p className="font-mono text-[10px] font-bold opacity-80">{s.sub}</p>
            </div>
          ))}
          <div className="brutal-sm col-span-2 flex items-center gap-2 bg-acid p-2.5 font-mono text-[11px] font-bold text-obsidian uppercase">
            <Radio className="size-4 animate-blink" /> Rooms + Polls ship next milestone — UI is live preview
          </div>
        </div>

        {/* COL 3 — shoutboard + quick actions */}
        <div className="flex flex-col gap-4">
          <div className="brutal bg-cobalt p-4 text-white">
            <p className="flex items-center gap-1.5 font-mono text-[11px] font-bold tracking-[0.2em] uppercase"><Megaphone className="size-4" /> Shoutboard</p>
            <form onSubmit={postShout} className="mt-2 flex gap-2">
              <input
                value={shout}
                onChange={(e) => setShout(e.target.value)}
                placeholder={user ? 'Broadcast to campus…' : 'Login to shout…'}
                disabled={!user}
                className="brutal-flat min-w-0 flex-1 bg-white px-2.5 py-2 text-sm font-medium text-ink placeholder:text-ink/50 disabled:opacity-60"
              />
              <button type="submit" disabled={!user} className="brutal-flat cursor-pointer bg-acid px-3 py-2 font-mono text-[11px] font-bold text-obsidian uppercase hover:bg-hyper hover:text-white disabled:opacity-50">
                <Zap className="size-4" />
              </button>
            </form>
            <div className="mt-2 space-y-1.5">
              {shouts.map((s, i) => (
                <div key={i} className={`border-2 border-white/90 p-2 text-[13px] ${s.hot ? 'bg-hyper' : 'bg-white/10'}`}>
                  <p className="font-mono text-[10px] font-bold tracking-widest opacity-90">{s.name}</p>
                  <p className="font-semibold">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="brutal flex items-center gap-2 bg-paper p-3 text-ink dark:bg-obsidian dark:text-cream">
            <CalendarCheck2 className="size-5 shrink-0" />
            <p className="text-[13px] font-semibold">Lab 4 free till 5PM • CR meet Fri 4PM • Elections open Mon</p>
            <CheckCircle2 className="ml-auto size-5 shrink-0 text-mint" />
          </div>
          <button className="brutal-sm invert-hover flex cursor-pointer items-center justify-center gap-2 bg-ink py-2.5 font-mono text-[11px] font-bold tracking-[0.2em] text-cream uppercase hover:bg-hyper hover:text-white dark:bg-cream dark:text-ink dark:hover:bg-hyper dark:hover:text-white">
            <BellRing className="size-4" /> Enable chaos alerts
          </button>
        </div>
      </div>
    </section>
  );
}
