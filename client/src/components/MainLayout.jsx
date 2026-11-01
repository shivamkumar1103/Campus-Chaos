import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';
import Sidebar from './Sidebar';
import { Ticker } from './design/kinetic';
import api from '../utils/api';

export function MainLayout() {
  const [backendStatus, setBackendStatus] = useState('checking...');
  const [activeChatPeer, setActiveChatPeer] = useState(null);
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

  return (
    <div className="grain min-h-screen md:flex">
      <Sidebar backendStatus={backendStatus} />
      <main className="min-w-0 flex-1 px-3 py-4 sm:px-5 md:mx-auto md:w-full md:max-w-6xl md:py-6">
        {backendStatus.startsWith('offline') && (
          <div className="brutal-sm mb-4 flex items-center gap-2 bg-hyper p-2.5 text-[13px] font-bold text-white">
            <TriangleAlert className="size-4 shrink-0" />
            Backend {backendStatus} — board shows cached vibes. Run <code className="bg-black/30 px-1">cd server; npm run dev</code>
          </div>
        )}
        <Outlet context={{ backendStatus, onMessageUser, activeChatPeer, setActiveChatPeer }} />
        <Ticker
          items={['CAMPUS CHAOS', 'BATCH C8', 'NIE MYSURU', 'STAY LOUD']}
          className="brutal-sm mt-8 bg-ink py-1.5 font-mono text-[10px] font-bold tracking-[0.25em] text-cream uppercase dark:bg-void dark:text-acid"
          slow
        />
      </main>
    </div>
  );
}

export default MainLayout;
