import { CreateUserForm } from '../components/CreateUserForm';
import { useUsers } from '../hooks/useAdminUsers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';

export function AdminUsersPage() {
  const { data: users, isLoading, isError } = useUsers();

  return (
    <div className="mx-auto grid max-w-4xl gap-4 p-4 md:grid-cols-2">
      <CreateUserForm />
      <Card>
        <CardHeader className="bg-sun text-ink">
          <CardTitle>Roster</CardTitle>
          <CardDescription className="text-ink/70">{users?.length ?? 0} cadets registered</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading && <p className="brutal-flat bg-sun/40 p-2 font-mono text-[11px] font-bold uppercase">Loading users...</p>}
          {isError && <p className="brutal-sm bg-hyper p-2 text-sm font-bold text-white">Failed to load (admin only).</p>}
          <ul className="space-y-2 text-sm">
            {users?.map((u) => (
              <li key={u._id} className="brutal-sm flex items-center justify-between gap-2 bg-paper p-2 text-ink dark:bg-void dark:text-cream">
                <span className="min-w-0 font-bold">{u.name} <span className="font-mono text-[10px] opacity-60">({u.email})</span></span>
                <span className="brutal-flat shrink-0 bg-cobalt px-2 py-0.5 font-mono text-[10px] font-bold text-white uppercase">{u.role}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
