import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, Bolt, Flame, Package, Sparkles } from 'lucide-react';
import { Magnetic, Ticker } from './kinetic';

function MetaTag({ children, className = '' }) {
  return (
    <span className={`brutal-sm inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.14em] uppercase ${className}`}>
      {children}
    </span>
  );
}

export function Hero({ backendStatus }) {
  const online = backendStatus === 'ok';
  return (
    <section className="brutal-lg relative overflow-hidden bg-cobalt text-white dark:bg-grape dark:text-[#f5f3ea]">
      {/* halftone wash */}
      <div className="halftone pointer-events-none absolute inset-0 text-white/25 dark:text-acid/20" />
      {/* giant ghost type */}
      <div aria-hidden className="font-display pointer-events-none absolute -bottom-6 left-0 w-full overflow-hidden text-[18vw] leading-none font-extrabold whitespace-nowrap text-white/10 select-none md:text-[11rem] dark:text-acid/10">
        CHAOS✦CHAOS✦CHAOS
      </div>

      <div className="relative p-5 sm:p-8 lg:p-10">
        {/* metadata strip */}
        <div className="flex flex-wrap items-center gap-2">
          <MetaTag className="bg-acid text-obsidian"><Bolt className="size-3" /> Batch C8 — NIE Mysuru</MetaTag>
          <MetaTag className="bg-hyper text-white"><Flame className="size-3" /> Unified College OS</MetaTag>
          <MetaTag className="bg-paper text-ink dark:bg-void dark:text-acid">
            <span className={`inline-block size-2 rounded-full ${online ? 'bg-mint' : 'bg-tang'} animate-blink`} />
            API: {backendStatus}
          </MetaTag>
          <span className="ml-auto hidden font-mono text-[10px] tracking-[0.2em] uppercase opacity-80 lg:inline">EST. 2026 — v1.0 // NO BORING PORTALS</span>
        </div>

        {/* massive display type */}
        <h1 className="hero-giant mt-5 text-[17.5vw] sm:text-[13vw] lg:text-[7.2rem]">
          Campus
          <br />
          <span className="bg-acid px-3 text-obsidian rot-l inline-block dark:bg-acid">Chaos<span className="text-hyper">.</span></span>{' '}
          <span className="text-outline-acid hidden sm:inline">OS</span>
        </h1>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <p className="max-w-xl text-[15px] leading-snug font-medium sm:text-base">
            Your <span className="scribble px-1 font-bold text-obsidian dark:text-acid">unapologetic</span> college operating system —
            Lost &amp; Found hunts, lightning DMs, room raids &amp; CR elections.{' '}
            <span className="font-bold">Zero beige. All signal.</span>
          </p>
          <div className="flex flex-wrap gap-3">
            <Magnetic>
              <Link
                to="/lost-found"
                className="brutal-sm invert-hover inline-flex items-center gap-2 bg-tang px-5 py-3 font-display text-sm font-extrabold tracking-wide text-white uppercase hover:bg-acid hover:text-obsidian"
              >
                <Package className="size-4" /> Raid the board <ArrowUpRight className="size-4" />
              </Link>
            </Magnetic>
            <Magnetic>
              <Link
                to="/messages"
                className="brutal-sm invert-hover inline-flex items-center gap-2 bg-paper px-5 py-3 font-display text-sm font-extrabold tracking-wide text-ink uppercase hover:bg-hyper hover:text-white"
              >
                Start a DM <ArrowDownRight className="size-4" />
              </Link>
            </Magnetic>
          </div>
        </div>

        {/* stat stickers */}
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { k: '04', v: 'CORE MODULES', c: 'bg-sun text-ink', r: 'rot-l' },
            { k: '1:1', v: 'SOCKET DMS', c: 'bg-mint text-ink', r: 'rot-r' },
            { k: 'RBAC', v: 'ADMIN / CR / FACULTY', c: 'bg-hyper text-white', r: 'rot-l-sm' },
            { k: '24/7', v: 'CAMPUS PULSE', c: 'bg-acid text-obsidian', r: 'rot-r' },
          ].map((s) => (
            <div key={s.v} className={`brutal-sm ${s.c} ${s.r} brutal-hover px-3 py-2`}>
              <p className="font-display text-2xl font-extrabold">{s.k}</p>
              <p className="font-mono text-[10px] font-bold tracking-[0.16em]">{s.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* bottom ticker ribbon */}
      <Ticker
        items={['LOST & FOUND LIVE', 'DM YOUR CR', 'BOOK LABS FASTER', 'VOTE LOUD', 'NO BEIGE PORTALS', 'BATCH C8 ENERGY']}
        className="brutal-flat relative border-x-0 bg-acid py-2 font-mono text-[11px] font-bold tracking-[0.2em] text-obsidian uppercase"
        fast
        separator="✦"
      />
      <div className="pointer-events-none absolute top-6 right-6 hidden animate-float items-center gap-2 lg:flex" style={{ '--float-rot': '8deg' }}>
        <span className="brutal-sm flex items-center gap-1 bg-hyper px-3 py-1.5 font-mono text-[10px] font-bold tracking-widest text-white uppercase">
          <Sparkles className="size-3" /> 100% unhinged uptime
        </span>
      </div>
    </section>
  );
}
