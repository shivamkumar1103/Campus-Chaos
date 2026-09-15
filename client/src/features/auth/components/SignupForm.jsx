import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { useRegister } from '../hooks/useRegister';

export function SignupForm({ onSuccess }) {
  const register = useRegister();
  const [form, setForm] = useState({ name: '', email: '', password: '', usn: '', department: '' });
  const error = register.error?.response?.data?.message;

  const submit = (e) => {
    e.preventDefault();
    register.mutate(form, { onSuccess: () => onSuccess?.() });
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign up</CardTitle>
        <CardDescription>Create a student account. Teachers &amp; CRs are created by admin.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={form.name} onChange={set('name')} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="usn">USN</Label>
              <Input id="usn" placeholder="4NI24CS180" value={form.usn} onChange={set('usn')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept">Dept</Label>
              <Input id="dept" placeholder="CSE" value={form.department} onChange={set('department')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={set('email')} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={form.password} onChange={set('password')} required minLength={6} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" disabled={register.isPending}>
            {register.isPending ? 'Creating...' : 'Create student account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
