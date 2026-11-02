import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { useAuth } from '../../../context/AuthContext';
import { authKeys } from '../../../lib/queryClient';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Ticker } from '../../../components/design/kinetic';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const routeParams = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser, setSession } = useAuth();

  // If already logged in and verified, take them straight home
  useEffect(() => {
    if (currentUser?.isVerified) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);

  const token = routeParams.token || searchParams.get('token');
  const tokenCalledRef = useRef(null);

  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Resend state
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [redirectCountdown, setRedirectCountdown] = useState(2);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No verification token found in URL.');
      return;
    }

    // Prevent double execution in React StrictMode
    if (tokenCalledRef.current === token) return;
    tokenCalledRef.current = token;

    setStatus('loading');

    authApi
      .verifyEmail(token)
      .then((data) => {
        setVerifiedUser(data.user);
        setStatus('success');
        if (data.user) {
          setSession(data.user);
          queryClient.setQueryData(authKeys.me, data.user);

          // Automatically take verified user directly to home page (no re-login needed)
          let count = 2;
          const interval = setInterval(() => {
            count -= 1;
            setRedirectCountdown(count);
            if (count <= 0) {
              clearInterval(interval);
              navigate('/', { replace: true });
            }
          }, 800);
        }
      })
      .catch((err) => {
        setStatus('error');
        setErrorMessage(
          err.response?.data?.message || 'Verification link is invalid or has expired.'
        );
      });
  }, [token, setSession, queryClient, navigate]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) return;
    try {
      setResending(true);
      setResendMessage('');
      const data = await authApi.resendVerification(resendEmail);
      setResendMessage(data.message || 'Verification link sent! Check your email.');
    } catch (err) {
      setResendMessage(
        err.response?.data?.message || 'Failed to send verification link.'
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-lg flex-col items-center justify-center gap-4 p-4">
      <Ticker
        items={['EMAIL VERIFICATION', 'BATCH C8 SECURITY', 'SECURE ACCESS']}
        className="brutal-sm w-full bg-acid py-1.5 font-mono text-[11px] font-bold tracking-[0.25em] text-obsidian uppercase"
      />

      {status === 'loading' && (
        <Card className="w-full overflow-hidden border-2 border-ink">
          <CardHeader className="bg-ink text-cream">
            <CardTitle className="!text-2xl font-black uppercase">Verifying token...</CardTitle>
            <CardDescription className="text-white/70">
              Please wait while we confirm your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-hyper border-t-transparent" />
            <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
              Confirming cryptographic signature...
            </p>
          </CardContent>
        </Card>
      )}

      {status === 'success' && (
        <Card className="w-full overflow-hidden border-2 border-ink shadow-[6px_6px_0px_#18181b]">
          <CardHeader className="bg-acid text-obsidian">
            <p className="brutal-flat w-fit bg-obsidian px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.2em] text-acid uppercase">
              Identity Confirmed
            </p>
            <CardTitle className="mt-2 !text-3xl font-black uppercase">
              You&apos;re In!
            </CardTitle>
            <CardDescription className="text-obsidian/85 font-medium">
              Your email has been verified successfully. Taking you directly to Campus Chaos...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {verifiedUser && (
              <div className="brutal-sm bg-paper p-4 font-mono text-xs dark:bg-void space-y-1.5">
                <p><span className="text-muted-foreground">NAME:</span> <strong>{verifiedUser.name}</strong></p>
                <p><span className="text-muted-foreground">EMAIL:</span> <strong>{verifiedUser.email}</strong></p>
                <p><span className="text-muted-foreground">ROLE:</span> <strong className="uppercase">{verifiedUser.role}</strong></p>
                {verifiedUser.usn && <p><span className="text-muted-foreground">USN:</span> <strong>{verifiedUser.usn}</strong></p>}
                {verifiedUser.classKey && <p><span className="text-muted-foreground">CLASS:</span> <strong>{verifiedUser.classKey}</strong></p>}
              </div>
            )}

            <div className="brutal-sm bg-hyper/10 border border-hyper p-3 text-center font-mono text-xs font-bold text-hyper">
              🚀 Redirecting to dashboard in {redirectCountdown}s...
            </div>

            <Button
              variant="hyper"
              size="lg"
              className="w-full font-black text-sm tracking-wide uppercase"
              onClick={() => navigate('/', { replace: true })}
            >
              Enter Campus Chaos Now →
            </Button>
          </CardContent>
        </Card>
      )}

      {status === 'error' && (
        <Card className="w-full overflow-hidden border-2 border-ink shadow-[6px_6px_0px_#18181b]">
          <CardHeader className="bg-hyper text-white">
            <p className="brutal-flat w-fit bg-ink px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.2em] text-cream uppercase">
              Verification Failed
            </p>
            <CardTitle className="mt-2 !text-3xl font-black uppercase">
              Invalid or Expired
            </CardTitle>
            <CardDescription className="text-white/85">
              {errorMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Verification links expire after 24 hours. Enter your registered email below to receive a fresh verification link.
            </p>

            <form onSubmit={handleResend} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="resend-email">Your Email Address</Label>
                <Input
                  id="resend-email"
                  type="email"
                  placeholder="YOU@NIE.AC.IN"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  required
                />
              </div>

              {resendMessage && (
                <p className="brutal-sm bg-sun p-2 text-xs font-bold text-ink">
                  {resendMessage}
                </p>
              )}

              <Button
                type="submit"
                variant="outline"
                className="w-full font-mono text-xs uppercase"
                disabled={resending}
              >
                {resending ? 'Sending Link...' : 'Resend Verification Link →'}
              </Button>
            </form>

            <div className="border-t pt-4 text-center">
              <Link
                to="/login"
                className="font-mono text-xs font-bold text-hyper underline underline-offset-4"
              >
                ← Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
