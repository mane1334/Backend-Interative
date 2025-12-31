import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';
import { getSocket } from '../services/socket';

export default function Diagnostics() {
  const [apiHealthy, setApiHealthy] = useState(null);
  const [wsState, setWsState] = useState('closed');

  useEffect(() => {
    let mounted = true;
    apiClient.get('/health').then(() => { if (mounted) setApiHealthy(true); }).catch(() => { if (mounted) setApiHealthy(false); });

    const s = getSocket();
    if (s) setWsState(socketStateLabel(s.readyState));
    const id = setInterval(() => {
      const current = getSocket();
      setWsState(current ? socketStateLabel(current.readyState) : 'closed');
    }, 1000);

    return () => { mounted = false; clearInterval(id); };
  }, []);

  function socketStateLabel(code) {
    switch (code) {
      case 0: return 'connecting';
      case 1: return 'open';
      case 2: return 'closing';
      case 3: return 'closed';
      default: return String(code);
    }
  }

  return (
    <div style={{fontSize:12, padding:8, background:'#fff5', border:'1px solid #ddd', borderRadius:6}}>
      <strong>Diagnostics</strong>
      <div>API health: {apiHealthy === null ? 'checking...' : apiHealthy ? 'OK' : 'DOWN'}</div>
      <div>WebSocket: {wsState}</div>
    </div>
  );
}