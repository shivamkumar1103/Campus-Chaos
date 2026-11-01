import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { useRegister } from '../hooks/useRegister';
import { authApi } from '../api/authApi';

export function SignupForm({ onSuccess }) {
  const register = useRegister();
  const [form, setForm] = useState({ name: '', email: '', password: '', usn: '', department: '' });
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState('');

  const error = register.error?.response?.data?.message;

  const submit = (e) => {
    e.preventDefault();
    register.mutate(form, {
      onSuccess: (data) => {
        if (data?.requiresVerification) {
          setIsSuccess(true);
          setRegisteredEmail(form.email);
        } else if (data?.user) {
          onSuccess?.();
        }
      },
    });
  };

  const handleResend = async () => {
    try {
      setResending(true);
      setResendStatus('');
      const res = await authApi.resendVerification(registeredEmail);
      setResendStatus(res.message || 'Verification link resent!');
    } catch (err) {
      setResendStatus(err.response?.data?.message || 'Failed to resend email');
    } finally {
      setResending(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (isSuccess) {
    return (
      <Card className="w-full max-w-sm overflow-hidden border-2 border-ink">
        <CardHeader className="bg-acid text-obsidian">
          <p className="brutal-flat w-fit bg-obsidian px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.2em] text-acid uppercase">
            Check Your Email
          </p>
          <CardTitle className="mt-2 !text-3xl">Verification Sent!</CardTitle>
          <CardDescription className="text-obsidian/85 font-medium">
            We sent a verification link to your inbox.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="brutal-sm bg-paper p-3 text-sm dark:bg-void">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Sent to</p>
            <p className="font-mono font-bold text-ink dark:text-cream break-all">{registeredEmail}</p>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Click the link in the email to activate your account. Links expire after 24 hours.
          </p>
          {resendStatus && (
            <p className="brutal-sm bg-sun p-2 text-xs font-bold text-ink">
              {resendStatus}
            </p>
          )}
          <div className="space-y-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full font-mono text-xs"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? 'Resending email...' : 'Didn\'t get it? Resend link →'}
            </Button>
            <Link to="/login" className="block text-center text-xs font-mono font-bold text-hyper underline underline-offset-4">
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

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
            {register.isPending ? 'Sending verification...' : 'Create account & verify →'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
