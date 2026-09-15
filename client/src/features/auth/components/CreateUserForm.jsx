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
    <Card className="w-full max-w-md overflow-hidden">
      <CardHeader className="bg-ink text-cream dark:bg-acid dark:text-obsidian">
        <CardTitle>Create user (admin)</CardTitle>
        <CardDescription className="opacity-80">Only admins mint teacher &amp; CR accounts.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input value={form.name} onChange={set('name')} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={set('email')} required />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" value={form.password} onChange={set('password')} required minLength={6} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <select className="brutal-flat h-11 w-full cursor-pointer bg-paper px-3 font-mono text-[11px] font-bold uppercase dark:bg-void" value={form.role} onChange={set('role')}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>USN</Label>
              <Input value={form.usn} onChange={set('usn')} />
            </div>
            <div className="space-y-1.5">
              <Label>Dept</Label>
              <Input value={form.department} onChange={set('department')} />
            </div>
          </div>
          {error && <p className="brutal-sm bg-hyper p-2 text-sm font-bold text-white">{error}</p>}
          {createUser.isSuccess && <p className="brutal-sm bg-mint p-2 font-mono text-[11px] font-bold text-ink uppercase">User minted ✓</p>}
          <Button variant="sun" className="w-full" disabled={createUser.isPending}>
            {createUser.isPending ? 'Minting...' : 'Create user →'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
