import { Search } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { LOST_FOUND_CATEGORIES } from '../api/lostFoundApi';
import { cn } from '../../../lib/utils';

const selectCls =
  'brutal-flat h-11 cursor-pointer bg-paper px-3 font-mono text-[11px] font-bold tracking-widest uppercase text-ink hover:bg-sun/40 dark:bg-void dark:text-cream dark:hover:bg-grape';

export function FilterToolbar({ filters, onChange }) {
  const set = (k) => (e) => onChange({ ...filters, [k]: e.target.value });

  const typePills = [
    { value: '', label: 'All' },
    { value: 'lost', label: '✦ Lost' },
    { value: 'found', label: '⬣ Found' },
  ];

  return (
    <div className="brutal bg-cobalt space-y-3 p-3 text-white">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink/60" />
          <Input
            placeholder="SEARCH THE CHAOS..."
            value={filters.q ?? ''}
            onChange={set('q')}
            className="pl-9"
          />
        </div>
        <select className={selectCls} value={filters.category ?? ''} onChange={set('category')} aria-label="Category">
          <option value="">All categories</option>
          {LOST_FOUND_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.replace('_', ' ')}</option>
          ))}
        </select>
        <select className={selectCls} value={filters.status ?? ''} onChange={set('status')} aria-label="Status">
          <option value="">Any status</option>
          <option value="open">Open</option>
          <option value="claimed">Claimed</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>
      <div className="flex gap-2">
        {typePills.map((p) => {
          const active = (filters.type ?? '') === p.value;
          return (
            <button
              key={p.label}
              onClick={() => onChange({ ...filters, type: p.value })}
              className={cn(
                'brutal-flat cursor-pointer px-4 py-1.5 font-display text-xs font-extrabold tracking-widest uppercase transition-all hover:-translate-y-0.5 hover:scale-[1.04] active:translate-x-0.5 active:translate-y-0.5 active:scale-100',
                active ? 'bg-acid text-obsidian' : 'bg-white/15 text-white hover:bg-hyper'
              )}
            >
              {p.label}
            </button>
          );
        })}
        <span className="ml-auto hidden font-mono text-[10px] font-bold tracking-[0.2em] uppercase opacity-70 sm:inline">FILTER OR PERISH ↓</span>
      </div>
    </div>
  );
}
