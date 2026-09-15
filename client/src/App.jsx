import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Sidebar from './components/Sidebar';
import LostFoundFeed from './features/lost-found/components/LostFoundFeed';
import ChatLayout from './features/messaging/components/ChatLayout';
import { AuthRouteElements } from './features/auth/routes/AuthRoutes';
import api from './utils/api';

function Home({ backendStatus }) {
  return (
    <div className="rounded-xl border bg-card p-6 text-card-foreground">
      <h1 className="text-2xl font-bold">Campus Chaos 🎓</h1>
      <p className="mt-1 text-sm text-muted-foreground">Your Unified College Operating System</p>
      <ul className="mt-4 list-disc pl-5 text-sm">
        <li>Lost &amp; Found Hub — report items, message owner/finder</li>
        <li>Real-time messaging via Socket.io</li>
        <li>Room &amp; Lab availability (next milestone)</li>
        <li>Polls / CR elections (next milestone)</li>
      </ul>
      <p className="mt-4 text-sm">
        Backend health: <code className="rounded bg-secondary px-1">{backendStatus}</code>
      </p>
    </div>
  );
}

function Placeholder({ text }) {
  return (
    <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">{text}</div>
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

  // Lost & Found "Message Owner/Finder" → open a 1-on-1 chat with the reporter.
  const onMessageUser = (reporter) => {
    if (reporter?._id) setActiveChatPeer(reporter);
    navigate('/messages');
  };

  const bare = AUTH_PATHS.includes(location.pathname);

  return (
    <div className="min-h-screen md:flex">
      {!bare && <Sidebar backendStatus={backendStatus} />}
      <main className="min-w-0 flex-1 px-4 py-6 md:mx-auto md:w-full md:max-w-6xl">
        <Routes>
          {AuthRouteElements()}
          <Route path="/" element={<Home backendStatus={backendStatus} />} />
          <Route path="/lost-found" element={<LostFoundFeed onMessageFinder={(item) => onMessageUser(item.reportedBy)} />} />
          <Route
            path="/messages"
            element={<ChatLayout initialPeer={activeChatPeer} onPeerConsumed={() => setActiveChatPeer(null)} />}
          />
          <Route path="/rooms" element={<Placeholder text="Room & Lab tracker — next milestone. Timetable model + CR cancel + faculty booking go here." />} />
          <Route path="/polls" element={<Placeholder text="Polls / CR elections — next milestone." />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppShell />
      </SocketProvider>
    </AuthProvider>
  );
}
