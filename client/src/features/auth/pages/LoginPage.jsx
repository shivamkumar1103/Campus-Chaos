import { Link, useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { Ticker } from '../../../components/design/kinetic';

export function LoginPage() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-4xl flex-col items-center justify-center gap-4 p-4">
      <Ticker
        items={['RE-ENTER THE CHAOS', 'NO BEIGE LOGINS', 'BATCH C8 ONLY']}
        className="brutal-sm w-full bg-sun py-1.5 font-mono text-[11px] font-bold tracking-[0.25em] text-ink uppercase"
      />
      <div className="grid w-full items-stretch gap-4 md:grid-cols-[1fr_auto]">
        <div className="brutal-lg hidden flex-col justify-between bg-ink p-6 text-cream md:flex dark:bg-grape">
          <p className="font-display text-4xl leading-[0.9] font-extrabold uppercase">Missed<br />the<br /><span className="bg-hyper px-2 text-white">chaos?</span></p>
          <p className="mt-6 font-mono text-[11px] tracking-[0.2em] uppercase opacity-70">Lost items pile up.<br />DMs go unanswered.<br />Don&apos;t let it happen.</p>
          <div className="halftone mt-6 h-16 opacity-30" />
        </div>
        <LoginForm onSuccess={() => navigate('/')} />
      </div>
      <p className="brutal-sm bg-paper px-3 py-2 font-mono text-[11px] font-bold tracking-widest text-ink uppercase dark:bg-void dark:text-cream">
        No account? <Link className="bg-acid px-1 text-obsidian underline underline-offset-4" to="/signup">Sign up as student →</Link>
      </p>
    </div>
  );
}
