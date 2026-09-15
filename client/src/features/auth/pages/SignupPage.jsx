import { Link, useNavigate } from 'react-router-dom';
import { SignupForm } from '../components/SignupForm';
import { Ticker } from '../../../components/design/kinetic';

export function SignupPage() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-4xl flex-col items-center justify-center gap-4 p-4">
      <Ticker
        items={['JOIN THE RIOT', 'FREE FOREVER-ISH', 'CAMPUS ID REQUIRED']}
        className="brutal-sm w-full bg-acid py-1.5 font-mono text-[11px] font-bold tracking-[0.25em] text-obsidian uppercase"
      />
      <div className="grid w-full items-stretch gap-4 md:grid-cols-[auto_1fr]">
        <SignupForm onSuccess={() => navigate('/')} />
        <div className="brutal-lg hidden flex-col justify-between bg-cobalt p-6 text-white md:flex">
          <p className="font-display text-4xl leading-[0.9] font-extrabold uppercase">Claim<br />your<br /><span className="bg-sun px-2 text-ink">corner.</span></p>
          <ul className="mt-6 space-y-2 font-mono text-[11px] font-bold tracking-[0.18em] uppercase">
            <li className="brutal-flat w-fit bg-white/15 px-2 py-1">✦ Post lost &amp; found</li>
            <li className="brutal-flat w-fit bg-white/15 px-2 py-1">⬣ DM owners instantly</li>
            <li className="brutal-flat w-fit bg-white/15 px-2 py-1">● Vote in CR polls</li>
          </ul>
        </div>
      </div>
      <p className="brutal-sm bg-paper px-3 py-2 font-mono text-[11px] font-bold tracking-widest text-ink uppercase dark:bg-void dark:text-cream">
        Have an account? <Link className="bg-hyper px-1 text-white underline underline-offset-4" to="/login">Login →</Link>
      </p>
    </div>
  );
}
