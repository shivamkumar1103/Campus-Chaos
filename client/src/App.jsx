import { Routes, Route, Navigate, useOutletContext, Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { MainLayout } from './components/MainLayout';
import LostFoundFeed from './features/lost-found/components/LostFoundFeed';
import ChatLayout from './features/messaging/components/ChatLayout';
import { AuthRouteElements } from './features/auth/routes/AuthRoutes';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { AdminDashboard } from './features/admin/pages/AdminDashboard';
import { Hero } from './components/design/Hero';
import { BentoGrid } from './components/design/BentoGrid';
import { ChaosDashboard } from './components/design/ChaosDashboard';
import { RoomsPage } from './features/rooms/RoomsPage';
import { PollsPage } from './features/polls/pages/PollsPage';

function Home() {
  const { backendStatus } = useOutletContext();
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

function LostFoundRoute() {
  const { onMessageUser } = useOutletContext();
  return <LostFoundFeed onMessageFinder={(item) => onMessageUser?.(item.reportedBy)} />;
}

function MessagesRoute() {
  const { activeChatPeer, setActiveChatPeer } = useOutletContext();
  return (
    <ChatLayout
      initialPeer={activeChatPeer}
      onPeerConsumed={() => setActiveChatPeer?.(null)}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Public Authentication Routes */}
            {AuthRouteElements()}

            {/* Single Protected Route enclosing the entire application */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/lost-found" element={<LostFoundRoute />} />
                <Route path="/messages" element={<MessagesRoute />} />
                <Route path="/rooms" element={<RoomsPage />} />
                <Route path="/polls" element={<PollsPage />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={<Navigate to="/admin?tab=users" replace />}
                />
              </Route>
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
