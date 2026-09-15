import { useRef } from 'react';
import { cn } from '../../lib/utils';

/** Infinite marquee ticker. Duplicate content 2x for seamless loop. */
export function Ticker({ items, className, trackClassName, separator = '✦', fast = false, slow = false }) {
  const row = (ariaHidden) => (
    <span aria-hidden={ariaHidden} className="inline-flex shrink-0 items-center">
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center">
          <span className="mx-4">{it}</span>
          <span className="opacity-80">{separator}</span>
        </span>
      ))}
    </span>
  );
  return (
    <div className={cn('ticker-viewport', className)}>
      <div className={cn('ticker-track', fast && 'fast', slow && 'slow', trackClassName)}>
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

/** Snappy magnetic wrapper — pulls toward cursor, snaps back on leave. */
export function Magnetic({ children, strength = 14, className }) {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${(x / r.width) * strength}px, ${(y / r.height) * strength}px) scale(1.03)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = '';
  };
  return (
    <span
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={cn('inline-block transition-transform duration-150 ease-out will-change-transform', className)}
    >
      {children}
    </span>
  );
}

/** Hook: responsive tilt (rotateX/rotateY) for brutal cards. Disabled on touch / reduced motion. */
export function useTilt(max = 9) {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current;
    if (!el || e.pointerType === 'touch') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translate(-2px,-2px)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = '';
  };
  return { ref, onPointerMove: onMove, onPointerLeave: onLeave };
}
