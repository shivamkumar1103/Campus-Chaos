import { Link } from 'react-router-dom';
import { ArrowUpRight, Building2, MessageCircle, Package, Vote } from 'lucide-react';
import { useTilt } from './kinetic';

const CELLS = [
  {
    to: '/lost-found',
    icon: Package,
    tag: '● LIVE NOW',
    tagCls: 'bg-mint text-ink',
    title: 'Lost & Found Hub',
    body: 'Report drops, hunt finds, DM the owner in one tap. The board never sleeps.',
    meta: ['GLOBAL BOARD', 'PHOTO PROOF', '1-TAP DM'],
    bg: 'bg-tang text-white',
    span: 'sm:col-span-2',
    tilt: 7,
  },
  {
    to: '/messages',
    icon: MessageCircle,
    tag: '◉ SOCKET.IO',
    tagCls: 'bg-acid text-obsidian',
    title: 'Turbo DMs',
    body: 'Presence dots, typing ghosts, read receipts. Group-chat speed, 1-on-1 focus.',
    meta: ['ONLINE NOW', 'TYPING…'],
    bg: 'bg-cobalt text-white dark:bg-cobalt',
    span: '',
    tilt: 9,
  },
  {
    to: '/rooms',
    icon: Building2,
    tag: '○ NEXT DROP',
    tagCls: 'bg-sun text-ink',
    title: 'Room Raids',
    body: 'Lab + classroom availability, CR cancels, faculty bookings. Coming in hot.',
    meta: ['TIMETABLE', 'CR OVERRIDE'],
    bg: 'bg-paper text-ink dark:bg-obsidian dark:text-cream',
    span: '',
    tilt: 9,
  },
  {
    to: '/polls',
    icon: Vote,
    tag: '⬣ VOTE LOUD',
    tagCls: 'bg-hyper text-white',
    title: 'Polls & CR Elections',
    body: 'Flash polls, manifestos, results with confetti-grade drama.',
    meta: ['ANON VOTES', 'LIVE TALLY'],
    bg: 'bg-hyper text-white',
    span: 'sm:col-span-2 lg:col-span-1',
    tilt: 7,
  },
  {
    to: '/lost-found',
    icon: ArrowUpRight,
    tag: '★ HOW IT SLAPS',
    tagCls: 'bg-ink text-cream dark:bg-acid dark:text-obsidian',
    title: 'Post → Ping → Recover',
    body: 'Snap it. Tag it. Owner gets pinged. Meet at the canteen. Legend status: earned.',
    meta: ['STEP 01/02/03'],
    bg: 'bg-sun text-ink',
    span: '',
    tilt: 8,
  },
];

function BentoCard({ cell }) {
  const { ref, onPointerMove, onPointerLeave } = useTilt(cell.tilt);
  const Icon = cell.icon;
  return (
    <Link
      to={cell.to}
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={`brutal tilt-card tilt-stage group relative flex min-h-[210px] flex-col justify-between overflow-hidden p-5 ${cell.bg} ${cell.span} brutal-hover`}
    >
      <div className="halftone pointer-events-none absolute inset-0 opacity-20" />
      <div className="relative flex items-start justify-between gap-2">
        <span className={`brutal-flat px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.16em] ${cell.tagCls}`}>{cell.tag}</span>
        <span className="brutal-flat bg-white/20 p-2 transition-transform duration-150 group-hover:scale-110 group-hover:rotate-6 dark:bg-black/30">
          <Icon className="size-5" />
        </span>
      </div>
      <div className="relative mt-8">
        <h3 className="font-display text-2xl leading-[0.95] font-extrabold uppercase sm:text-[1.7rem]">{cell.title}</h3>
        <p className="mt-2 max-w-sm text-[13px] leading-snug font-medium opacity-90">{cell.body}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {cell.meta.map((m) => (
            <span key={m} className="border border-current px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-[0.14em] opacity-90">{m}</span>
          ))}
        </div>
      </div>
      <span className="relative mt-4 inline-flex items-center gap-1 font-mono text-[11px] font-bold tracking-[0.18em] uppercase">
        Enter module <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </Link>
  );
}

export function BentoGrid() {
  return (
    <section aria-label="Feature grid" className="mt-6">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-display text-3xl font-extrabold tracking-tight uppercase sm:text-4xl">
          The <span className="bg-hyper px-2 text-white">Bento</span> Grid
        </h2>
        <p className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase opacity-70">05 modules // asymmetrical // zero whitespace guilt</p>
      </div>
      <div className="tilt-stage grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <BentoCard cell={CELLS[0]} />
        <BentoCard cell={CELLS[1]} />
        <BentoCard cell={CELLS[2]} />
        <BentoCard cell={CELLS[3]} />
        <BentoCard cell={CELLS[4]} />
        {/* overlapping sticker card */}
        <div className="brutal relative flex min-h-[210px] flex-col justify-between overflow-hidden bg-forest p-5 text-cream lg:-mt-0">
          <div className="halftone-dense pointer-events-none absolute inset-0 opacity-25" />
          <p className="relative font-mono text-[10px] font-bold tracking-[0.2em] text-acid">✦ STICKY RIBBON — ALWAYS ON</p>
          <p className="font-display relative text-2xl leading-tight font-extrabold uppercase">
            Built by Batch C8. Fueled by canteen chai.
          </p>
          <div className="relative flex gap-2">
            <span className="brutal-sm bg-acid px-2 py-1 font-mono text-[10px] font-bold text-obsidian">NIE MYSURU</span>
            <span className="brutal-sm bg-cream px-2 py-1 font-mono text-[10px] font-bold text-ink">OPEN SOURCE ENERGY</span>
          </div>
        </div>
      </div>
    </section>
  );
}
