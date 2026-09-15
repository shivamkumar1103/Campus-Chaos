import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useAuth } from '../../../context/AuthContext';
import { useLostFoundItems } from '../hooks/useLostFound';
import { FilterToolbar } from './FilterToolbar';
import { LostFoundCard } from './LostFoundCard';
import { ReportItemModal } from './ReportItemModal';
import { ItemDetailModal } from './ItemDetailModal';

export default function LostFoundFeed({ onMessageFinder }) {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ q: '', type: '', category: '', status: '' });
  const [reportOpen, setReportOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const { data: items, isLoading, isError, refetch } = useLostFoundItems(filters);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Lost &amp; Found Hub</h2>
          <p className="text-sm text-muted-foreground">
            Global board — report lost items, browse what others found, message the owner or finder to recover items.
          </p>
        </div>
        {user ? (
          <Button onClick={() => setReportOpen(true)}>
            <Plus className="size-4" /> Report item
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">Login to post items or message owners/finders.</p>
        )}
      </div>

      <FilterToolbar filters={filters} onChange={setFilters} />

      {isLoading && <p className="text-sm text-muted-foreground">Loading items...</p>}
      {isError && (
        <div className="rounded-xl border bg-card p-4 text-sm">
          <p className="text-destructive">Failed to load items.</p>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => refetch()}>Retry</Button>
        </div>
      )}

      {!isLoading && !isError && items?.length === 0 && (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          No items match. Be the first to report one.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
