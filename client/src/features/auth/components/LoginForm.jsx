import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { useLogin } from '../hooks/useLogin';

export function LoginForm({ onSuccess }) {
  const login = useLogin();
  const [form, setForm] = useState({ email: '', password: '' });
  const error = login.error?.response?.data?.message;

  const submit = (e) => {
    e.preventDefault();
    login.mutate(form, { onSuccess: () => onSuccess?.() });
  };

  return (
    <Card className="w-full max-w-sm overflow-hidden">
      <CardHeader className="bg-cobalt text-white">
        <p className="brutal-flat w-fit bg-acid px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.2em] text-obsidian uppercase">Welcome back, legend</p>
        <CardTitle className="mt-2 !text-3xl">Login</CardTitle>
        <CardDescription className="text-white/80">Re-enter the chaos →</CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="YOU@NIE.AC.IN"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          {error && <p className="brutal-sm bg-hyper p-2 text-sm font-bold text-white">{error}</p>}
          <Button className="w-full" size="lg" disabled={login.isPending}>
            {login.isPending ? 'Breaking in...' : 'Login →'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
