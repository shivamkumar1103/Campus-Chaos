import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowUpRight, TriangleAlert } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import LostFoundFeed from './features/lost-found/components/LostFoundFeed';
import ChatLayout from './features/messaging/components/ChatLayout';
import { AuthRouteElements } from './features/auth/routes/AuthRoutes';
import { Hero } from './components/design/Hero';
import { BentoGrid } from './components/design/BentoGrid';
import { ChaosDashboard } from './components/design/ChaosDashboard';
import { Ticker } from './components/design/kinetic';
import api from './utils/api';

function Home({ backendStatus }) {
  return (
    <div className="space-y-6">
      <Hero backendStatus={backendStatus} />
      <BentoGrid />
      <ChaosDashboard />
      <footer className="brutal flex flex-wrap items-center gap-2 bg-ink p-4 text-cream dark:bg-acid dark:text-obsidian">
        <p className="font-display text-sm font-extrabold tracking-wide uppercase">Campus Chaos — Batch C8 ✦ NIE Mysuru</p>
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase opacity-70">Cyber-Acid dark ✦ Warm Retro-Pop light</p>
        <Link to="/lost-found" className="ml-auto inline-flex items-center gap-1 font-mono text-[11px] font-bold tracking-widest uppercase underline underline-offset-4 hover:no-underline">
          Enter the board <ArrowUpRight className="size-4" />
        </Link>
      </footer>
    </div>
  );
}

function Placeholder({ text, title }) {
  return (
    <div className="brutal-lg bg-sun p-6 text-ink">
      <p className="brutal-flat inline-block bg-ink px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.2em] text-cream uppercase">
        {title ?? 'Next drop'}
      </p>
      <p className="font-display mt-3 text-2xl font-extrabold uppercase">{text}</p>
      <p className="mt-1 font-mono text-[11px] font-bold tracking-widest uppercase opacity-70">UI preview live — backend lands next milestone</p>
    </div>
  );
}

const AUTH_PATHS = ['/login', '/signup'];

function AppShell() {
  const [backendStatus, setBackendStatus] = useState('checking...');
  const [activeChatPeer, setActiveChatPeer] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/health')
      .then(() => setBackendStatus('ok'))
      .catch(() => setBackendStatus('offline (start server/)'));
  }, []);

  const onMessageUser = (reporter) => {
    if (reporter?._id) setActiveChatPeer(reporter);
    navigate('/messages');
  };

  const bare = AUTH_PATHS.includes(location.pathname);

  return (
    <div className="grain min-h-screen md:flex">
      {!bare && <Sidebar backendStatus={backendStatus} />}
      <main className="min-w-0 flex-1 px-3 py-4 sm:px-5 md:mx-auto md:w-full md:max-w-6xl md:py-6">
        {!bare && backendStatus.startsWith('offline') && (
          <div className="brutal-sm mb-4 flex items-center gap-2 bg-hyper p-2.5 text-[13px] font-bold text-white">
            <TriangleAlert className="size-4 shrink-0" />
            Backend {backendStatus} — board shows cached vibes. Run <code className="bg-black/30 px-1">cd server; npm run dev</code>
          </div>
        )}
        <Routes>
          {AuthRouteElements()}
          <Route path="/" element={<Home backendStatus={backendStatus} />} />
          <Route path="/lost-found" element={<LostFoundFeed onMessageFinder={(item) => onMessageUser(item.reportedBy)} />} />
          <Route
            path="/messages"
            element={<ChatLayout initialPeer={activeChatPeer} onPeerConsumed={() => setActiveChatPeer(null)} />}
          />
          <Route path="/rooms" element={<Placeholder title="Room raids" text="Room & Lab tracker — timetable + CR cancel + faculty booking go here." />} />
          <Route path="/polls" element={<Placeholder title="Vote loud" text="Polls / CR elections — flash polls + live tally go here." />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {!bare && (
          <Ticker
            items={['CAMPUS CHAOS', 'BATCH C8', 'NIE MYSURU', 'STAY LOUD']}
            className="brutal-sm mt-8 bg-ink py-1.5 font-mono text-[10px] font-bold tracking-[0.25em] text-cream uppercase dark:bg-void dark:text-acid"
            slow
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <AppShell />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
