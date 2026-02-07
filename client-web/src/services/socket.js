// Centralized WebSocket event layer for the client app
// Provides a singleton connection and simple subscribe API by event type
let socket = null;
let listenersByType = new Map(); // Map<string, Set<Function>>

// Runtime-overridable WS URL: priority -> window.__APP_WS_URL__ -> env -> dynamic fallback
function resolveWsUrl() {
  if (typeof window !== 'undefined' && window.__APP_WS_URL__) return window.__APP_WS_URL__;
  // Vite uses import.meta.env and variables must be prefixed with VITE_
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  
  // Fallback for local development if .env is not set
  const hostname = (typeof window !== 'undefined' && window.location.hostname) ? window.location.hostname : 'localhost';
  const protocol = (typeof window !== 'undefined' && window.location.protocol === 'https:') ? 'wss' : 'ws';
  return `${protocol}://${hostname}:3000`;
}

let reconnectAttempts = 0;
let explicitClose = false;
let heartbeatIntervalId = null;
const HEARTBEAT_MS = Number(import.meta.env.VITE_WS_HEARTBEAT_MS || 30000);

function createSocket() {
  const WS_URL = resolveWsUrl();
  try {
    const s = new WebSocket(WS_URL);

    s.onopen = () => {
      reconnectAttempts = 0;
      // start heartbeat pings
      if (heartbeatIntervalId) clearInterval(heartbeatIntervalId);
      heartbeatIntervalId = setInterval(() => {
        try {
          if (s && s.readyState === WebSocket.OPEN) s.send(JSON.stringify({ type: 'PING' }));
        } catch (_) {}
      }, HEARTBEAT_MS);
    };

    s.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (_) {
        return; // ignore non-JSON messages
      }
      if (!data || !data.type) return;

      const set = listenersByType.get(data.type);
      if (!set || set.size === 0) return;

      for (const handler of Array.from(set)) {
        try {
          handler(data.payload, data);
        } catch (err) {
          console.error('Socket listener error:', err);
        }
      }
    };

    s.onclose = () => {
      if (heartbeatIntervalId) { clearInterval(heartbeatIntervalId); heartbeatIntervalId = null; }
      socket = null;
      if (!explicitClose) {
        // schedule reconnect with backoff
        reconnectAttempts += 1;
        const delay = Math.min(30000, 500 * Math.pow(1.5, reconnectAttempts));
        setTimeout(() => ensureSocket(), delay);
      }
    };

    s.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    return s;
  } catch (e) {
    console.error('Failed to create WebSocket:', e);
    return null;
  }
}

function ensureSocket() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return socket;
  }
  explicitClose = false;
  socket = createSocket();
  return socket;
}

export function closeSocket() {
  explicitClose = true;
  if (heartbeatIntervalId) { clearInterval(heartbeatIntervalId); heartbeatIntervalId = null; }
  if (socket) {
    try { socket.close(); } catch (_) {}
    socket = null;
  }
}

export function subscribeToEvent(type, handler) {
  ensureSocket();

  if (!listenersByType.has(type)) {
    listenersByType.set(type, new Set());
  }
  const set = listenersByType.get(type);
  set.add(handler);

  // Unsubscribe/cleanup
  return () => {
    set.delete(handler);
    if (set.size === 0) {
      listenersByType.delete(type);
    }
    // Do not close the socket automatically here; keep it shared
  };
}

export function getSocket() {
  return ensureSocket();
}

