import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState([]);

  useEffect(() => {
    const url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const s = io(url);
    setSocket(s);
    s.on('presence', (ids) => setOnlineUserIds(ids));
    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (socket && user?._id) socket.emit('join', user._id);
  }, [socket, user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUserIds }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
