import { CreateUserForm } from '../components/CreateUserForm';
import { useUsers } from '../hooks/useAdminUsers';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';

export function AdminUsersPage() {
  const { data: users, isLoading, isError } = useUsers();

  return (
    <div className="mx-auto grid max-w-4xl gap-6 p-4 md:grid-cols-2">
      <CreateUserForm />
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Loading users...</p>}
          {isError && <p className="text-sm text-destructive">Failed to load (admin only).</p>}
          <ul className="space-y-2 text-sm">
            {users?.map((u) => (
              <li key={u._id} className="flex justify-between rounded border p-2">
                <span>{u.name} <span className="text-muted-foreground">({u.email})</span></span>
                <span className="rounded bg-secondary px-2 py-0.5 text-xs">{u.role}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
