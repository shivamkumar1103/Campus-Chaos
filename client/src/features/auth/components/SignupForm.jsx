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
    <Card className="w-full max-w-sm overflow-hidden">
      <CardHeader className="bg-hyper text-white">
        <p className="brutal-flat w-fit bg-ink px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.2em] text-cream uppercase">Join Batch C8</p>
        <CardTitle className="mt-2 !text-3xl">Sign up</CardTitle>
        <CardDescription className="text-white/85">Student accounts only — CRs &amp; faculty via admin.</CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={form.name} onChange={set('name')} placeholder="YOUR LEGEND NAME" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="usn">USN</Label>
              <Input id="usn" placeholder="4NI24CS000" value={form.usn} onChange={set('usn')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dept">Dept</Label>
              <Input id="dept" placeholder="CSE" value={form.department} onChange={set('department')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={set('email')} placeholder="YOU@NIE.AC.IN" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={form.password} onChange={set('password')} required minLength={6} />
          </div>
          {error && <p className="brutal-sm bg-hyper p-2 text-sm font-bold text-white">{error}</p>}
          <Button variant="hyper" size="lg" className="w-full" disabled={register.isPending}>
            {register.isPending ? 'Creating...' : 'Create account →'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
