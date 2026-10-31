import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { useRegister } from '../hooks/useRegister';
import { AlertCircle, Lock, ShieldAlert } from 'lucide-react';

const COLLEGE_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@nie\.ac\.in$/i;

export function SignupForm({ onSuccess }) {
  const register = useRegister();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    usn: '',
    department: '',
    classKey: '',
  });
  const [clientError, setClientError] = useState(null);

  const error = clientError || register.error?.response?.data?.message;

  const submit = (e) => {
    e.preventDefault();
    setClientError(null);

    const trimmedEmail = form.email.trim();
    if (!COLLEGE_EMAIL_REGEX.test(trimmedEmail)) {
      setClientError('Only official college email ending with @nie.ac.in is allowed.');
      return;
    }

    if (!form.classKey.trim()) {
      setClientError('Class section (e.g. CSE-5C) is required.');
      return;
    }

    register.mutate(
      {
        ...form,
        email: trimmedEmail.toLowerCase(),
        usn: form.usn.trim().toUpperCase(),
        classKey: form.classKey.trim().toUpperCase(),
        department: form.department.trim().toUpperCase() || form.classKey.trim().split('-')[0].toUpperCase(),
      },
      { onSuccess: () => onSuccess?.() }
    );
  };

  const set = (k) => (e) => {
    setClientError(null);
    setForm({ ...form, [k]: e.target.value });
  };

  return (
    <Card className="w-full max-w-sm overflow-hidden">
      <CardHeader className="bg-hyper text-white">
        <p className="brutal-flat w-fit bg-ink px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.2em] text-cream uppercase">
          Cadet Registration
        </p>
        <CardTitle className="mt-2 !text-3xl">Sign up</CardTitle>
        <CardDescription className="text-white/85">
          Student accounts only. Section locked upon creation.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {/* Faculty Notice */}
        <div className="brutal-sm flex items-start gap-2 bg-cobalt/15 border border-cobalt p-2.5 text-foreground text-[11px] leading-snug">
          <ShieldAlert className="size-4 shrink-0 text-cobalt mt-0.5" />
          <span>
            <strong>Faculty Notice:</strong> Teachers cannot register here. Accounts are provisioned exclusively by Campus Administration.
          </span>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="name" className="text-xs font-bold uppercase">Full name *</Label>
            <Input id="name" value={form.name} onChange={set('name')} placeholder="YOUR FULL NAME" required />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <Label htmlFor="usn" className="text-xs font-bold uppercase">USN</Label>
              <Input
                id="usn"
                placeholder="4NI24CS000"
                value={form.usn}
                onChange={set('usn')}
                className="uppercase text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="classKey" className="text-xs font-bold uppercase flex items-center justify-between">
                <span>Class *</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 lowercase">
                  <Lock className="size-2.5 text-hyper" /> permanent
                </span>
              </Label>
              <Input
                id="classKey"
                placeholder="CSE-5C"
                value={form.classKey}
                onChange={set('classKey')}
                required
                className="uppercase text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs font-bold uppercase flex items-center justify-between">
              <span>College Email *</span>
              <span className="font-mono text-[10px] text-muted-foreground lowercase">@nie.ac.in only</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="cadet@nie.ac.in"
              required
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password" className="text-xs font-bold uppercase">Password *</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={set('password')}
              required
              minLength={6}
              className="text-xs"
            />
          </div>

          {error && (
            <div className="brutal-sm flex items-center gap-2 bg-hyper p-2.5 text-xs font-bold text-white">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button variant="hyper" size="lg" className="w-full font-mono text-xs font-bold uppercase" disabled={register.isPending}>
            {register.isPending ? 'Creating Account...' : 'Register as Student →'}
          </Button>

          <p className="text-center font-mono text-[10px] text-muted-foreground">
            Once submitted, your class section can only be updated by a Campus Admin.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

