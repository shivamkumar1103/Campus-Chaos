import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { useCreateUser } from '../hooks/useAdminUsers';

const ROLES = ['student', 'teacher', 'cr', 'admin'];

export function CreateUserForm() {
  const createUser = useCreateUser();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'teacher', usn: '', department: '' });
  const error = createUser.error?.response?.data?.message;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    createUser.mutate(form, { onSuccess: () => setForm({ name: '', email: '', password: '', role: 'teacher', usn: '', department: '' }) });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create user (admin)</CardTitle>
        <CardDescription>Only admins can create teacher &amp; CR accounts.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input value={form.name} onChange={set('name')} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={set('email')} required />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={form.password} onChange={set('password')} required minLength={6} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Role</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={form.role} onChange={set('role')}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>USN</Label>
              <Input value={form.usn} onChange={set('usn')} />
            </div>
            <div className="space-y-2">
              <Label>Dept</Label>
              <Input value={form.department} onChange={set('department')} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {createUser.isSuccess && <p className="text-sm text-green-600">User created.</p>}
          <Button className="w-full" disabled={createUser.isPending}>
            {createUser.isPending ? 'Creating...' : 'Create user'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
