import { Input } from '../../../components/ui/input';
import { LOST_FOUND_CATEGORIES } from '../api/lostFoundApi';
import { cn } from '../../../lib/utils';

export function FilterToolbar({ filters, onChange }) {
  const set = (k) => (e) => onChange({ ...filters, [k]: e.target.value });

  const typePills = [
    { value: '', label: 'All' },
    { value: 'lost', label: 'Lost' },
    { value: 'found', label: 'Found' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search items..."
          value={filters.q ?? ''}
          onChange={set('q')}
          className="max-w-xs"
        />
        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          value={filters.category ?? ''}
          onChange={set('category')}
          aria-label="Category"
        >
          <option value="">All categories</option>
          {LOST_FOUND_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.replace('_', ' ')}</option>
          ))}
        </select>
        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          value={filters.status ?? ''}
          onChange={set('status')}
          aria-label="Status"
        >
          <option value="">Any status</option>
          <option value="open">Open</option>
          <option value="claimed">Claimed</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>
      <div className="flex gap-2">
        {typePills.map((p) => (
          <button
            key={p.label}
            onClick={() => onChange({ ...filters, type: p.value })}
            className={cn(
              'rounded-full px-3 py-1 text-sm',
              (filters.type ?? '') === p.value ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
