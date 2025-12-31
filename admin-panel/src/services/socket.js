// Final single socket service (minimal)

// Full centralized WebSocket service for admin-panel
// - Runtime WS URL resolution (window.__APP_WS_URL__ or Vite env)
// - Singleton socket with reconnect/backoff
// - Heartbeat PINGs (client) — server should reply PONG
// - subscribeToEvent(type, handler) / unsubscribe via returned function

let socket = null;
const listenersByType = new Map();
let reconnectAttempts = 0;
let explicitClose = false;
let heartbeatIntervalId = null;
const HEARTBEAT_MS = Number(import.meta.env.VITE_WS_HEARTBEAT_MS || 30000);

function resolveWsUrl() {
	if (typeof window !== 'undefined' && window.__APP_WS_URL__) return window.__APP_WS_URL__;
	if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
	return 'ws://localhost:3000';
}

function createSocket() {
	const url = resolveWsUrl();
	try {
		const s = new WebSocket(url);

			s.onopen = () => {
				console.debug('[admin-socket] onopen', url);
				reconnectAttempts = 0;
				if (heartbeatIntervalId) clearInterval(heartbeatIntervalId);
				heartbeatIntervalId = setInterval(() => {
					try { if (s && s.readyState === WebSocket.OPEN) s.send(JSON.stringify({ type: 'PING' })); } catch (_) {}
				}, HEARTBEAT_MS);
			};

			s.onmessage = (event) => {
				console.debug('[admin-socket] raw message', event.data);
				let data;
				try { data = JSON.parse(event.data); } catch (err) { console.warn('[admin-socket] invalid json', err); return; }
				if (!data || !data.type) return;

				// Keep backwards compatibility: if server PONGs, ignore
				if (data.type === 'PONG') { console.debug('[admin-socket] PONG received'); return; }

				const set = listenersByType.get(data.type);
				if (!set || set.size === 0) return;
				for (const h of Array.from(set)) {
					try { h(data.payload, data); } catch (err) { console.error('admin socket handler error', err); }
				}
			};

			s.onclose = (ev) => {
				console.debug('[admin-socket] onclose', ev.code, ev.reason);
				if (heartbeatIntervalId) { clearInterval(heartbeatIntervalId); heartbeatIntervalId = null; }
				socket = null;
				if (!explicitClose) {
					reconnectAttempts += 1;
					const delay = Math.min(30000, 500 * Math.pow(1.5, reconnectAttempts));
					setTimeout(() => ensureSocket(), delay);
				}
			};

		s.onerror = (err) => { console.error('admin WebSocket error', err); };

		return s;
	} catch (e) {
		console.error('Failed to create admin WebSocket', e);
		return null;
	}
}

function ensureSocket() {
	if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return socket;
	explicitClose = false;
	socket = createSocket();
	return socket;
}

export function subscribeToEvent(type, handler) {
	ensureSocket();
	if (!listenersByType.has(type)) listenersByType.set(type, new Set());
	const set = listenersByType.get(type);
	set.add(handler);
	return () => { set.delete(handler); if (set.size === 0) listenersByType.delete(type); };
}

export function closeSocket() {
	explicitClose = true;
	if (heartbeatIntervalId) { clearInterval(heartbeatIntervalId); heartbeatIntervalId = null; }
	if (socket) { try { socket.close(); } catch (_) {} socket = null; }
}

export function getSocket() { return ensureSocket(); }
