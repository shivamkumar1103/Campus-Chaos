import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { useRegister } from '../hooks/useRegister';
import { authApi } from '../api/authApi';
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
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState('');

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
      {
        onSuccess: (data) => {
          if (data?.requiresVerification) {
            setIsSuccess(true);
            setRegisteredEmail(trimmedEmail.toLowerCase());
          } else if (data?.user) {
            onSuccess?.();
          }
        },
      }
    );
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

  const set = (k) => (e) => {
    setClientError(null);
    setForm({ ...form, [k]: e.target.value });
  };

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
              {resending ? 'Resending email...' : "Didn't get it? Resend link →"}
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
            {register.isPending ? 'Sending verification...' : 'Create account & verify →'}
          </Button>

          <p className="text-center font-mono text-[10px] text-muted-foreground">
            Once submitted, your class section can only be updated by a Campus Admin.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
