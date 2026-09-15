import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { useUserSearch } from '../hooks/useMessaging';
import { UserRow } from './UserRow';

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
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 opacity-60" />
        <Input
          placeholder="SEARCH NAME / USN..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
          autoFocus={autoFocus}
        />
      </div>
      {debounced.length >= 2 && (
        <div className="space-y-1">
          {isLoading && <p className="brutal-flat bg-sun/40 p-2 font-mono text-[11px] font-bold tracking-widest uppercase">Scanning campus…</p>}
          {isError && <p className="brutal-flat bg-hyper p-2 font-mono text-[11px] font-bold text-white uppercase">Search failed.</p>}
          {!isLoading && !isError && users?.length === 0 && (
            <p className="p-2 font-mono text-[11px] tracking-widest uppercase opacity-60">No cadets found.</p>
          )}
          {users?.map((u) => (
            <UserRow key={u._id} user={u} online={online.has(u._id.toString())} onClick={() => onPick?.(u)} />
          ))}
        </div>
      )}
    </div>
  );
}
