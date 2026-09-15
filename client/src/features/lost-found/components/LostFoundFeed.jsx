import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useAuth } from '../../../context/AuthContext';
import { useLostFoundItems } from '../hooks/useLostFound';
import { FilterToolbar } from './FilterToolbar';
import { LostFoundCard } from './LostFoundCard';
import { ReportItemModal } from './ReportItemModal';
import { ItemDetailModal } from './ItemDetailModal';
import { Ticker } from '../../../components/design/kinetic';

export default function LostFoundFeed({ onMessageFinder }) {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ q: '', type: '', category: '', status: '' });
  const [reportOpen, setReportOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const { data: items, isLoading, isError, refetch } = useLostFoundItems(filters);

  return (
    <div className="space-y-4">
      <div className="brutal-lg relative overflow-hidden bg-tang p-5 text-white sm:p-7">
        <div className="halftone pointer-events-none absolute inset-0 opacity-25" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="brutal-flat inline-block bg-ink px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.2em] text-cream uppercase">
              <Flame className="mr-1 inline size-3 text-sun" /> Global board — desktop 3-col / mobile stack
            </p>
            <h2 className="font-display mt-2 text-4xl leading-[0.9] font-extrabold uppercase sm:text-6xl">
              Lost <span className="bg-ink px-2">&amp;</span> Found
            </h2>
            <p className="mt-2 max-w-lg text-[13px] font-semibold sm:text-sm">
              Report drops, flex finds, DM the owner. Every card tilts. Every hover slaps.
            </p>
          </div>
          {user ? (
            <Button variant="ink" size="lg" onClick={() => setReportOpen(true)}>
              <Plus className="size-4" /> Report item
            </Button>
          ) : (
            <p className="brutal-sm bg-ink p-3 font-mono text-[11px] font-bold tracking-widest text-cream uppercase">
              <Link to="/login" className="underline decoration-acid decoration-2 underline-offset-4">Login</Link> to post or DM →
            </p>
          )}
        </div>
      </div>

      <Ticker
        items={['REPORT IT', 'TAG IT', 'DM THE OWNER', 'MEET AT CANTEEN', 'BECOME LEGEND']}
        className="brutal-sm bg-ink py-1.5 font-mono text-[10px] font-bold tracking-[0.25em] text-cream uppercase dark:bg-acid dark:text-obsidian"
      />

      <FilterToolbar filters={filters} onChange={setFilters} />

      {isLoading && (
        <div className="brutal bg-sun p-4 font-mono text-xs font-bold tracking-widest text-ink uppercase animate-pulse">
          Scanning the chaos for items…
        </div>
      )}
      {isError && (
        <div className="brutal bg-hyper p-4 text-sm font-bold text-white">
          <p>Board exploded. Retry the raid.</p>
          <Button size="sm" variant="ink" className="mt-2" onClick={() => refetch()}>Retry</Button>
        </div>
      )}

      {!isLoading && !isError && items?.length === 0 && (
        <div className="brutal-lg bg-paper p-8 text-center text-ink dark:bg-obsidian dark:text-cream">
          <p className="font-display text-2xl font-extrabold uppercase">Silence… suspicious.</p>
          <p className="mt-1 font-mono text-[11px] tracking-widest uppercase opacity-70">No items match. Be the first legend.</p>
        </div>
      )}

      <div className="tilt-stage grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items?.map((item) => (
          <LostFoundCard key={item._id} item={item} onOpen={setSelected} />
        ))}
      </div>

      <ReportItemModal open={reportOpen} onClose={() => setReportOpen(false)} />

      <ItemDetailModal
        item={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        canModerate={Boolean(user && (user.role === 'admin' || selected?.reportedBy?._id === user._id))}
        onMessageFinder={onMessageFinder}
      />
    </div>
  );
}
