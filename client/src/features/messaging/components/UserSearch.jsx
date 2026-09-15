import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { useUserSearch } from '../hooks/useMessaging';
import { UserRow } from './UserRow';

// Debounced people search by name / email / USN / department.
export function UserSearch({ onlineIds, onPick, autoFocus }) {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data: users, isLoading, isError } = useUserSearch(debounced);
  const online = new Set((onlineIds ?? []).map(String));

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search name, email, USN..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-8"
          autoFocus={autoFocus}
        />
      </div>
      {debounced.length >= 2 && (
        <div className="space-y-1">
          {isLoading && <p className="p-2 text-xs text-muted-foreground">Searching...</p>}
          {isError && <p className="p-2 text-xs text-destructive">Search failed.</p>}
          {!isLoading && !isError && users?.length === 0 && (
            <p className="p-2 text-xs text-muted-foreground">No users found.</p>
          )}
          {users?.map((u) => (
            <UserRow key={u._id} user={u} online={online.has(u._id.toString())} onClick={() => onPick?.(u)} />
          ))}
        </div>
      )}
    </div>
  );
}
