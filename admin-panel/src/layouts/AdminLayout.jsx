import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import Notification from '../components/Notification.jsx';
import Diagnostics from '../components/Diagnostics.jsx';
import { FiGrid, FiShoppingCart, FiClock, FiList, FiBell, FiSettings, FiDatabase, FiStar, FiTerminal } from 'react-icons/fi';
import { getSettings } from '../services/api';
import { subscribeToEvent } from '../services/socket';

const _HOSTNAME = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : 'localhost';
const _PROTOCOL = (typeof window !== 'undefined' && window.location && window.location.protocol) ? window.location.protocol : 'http:';
const WS_URL = import.meta.env.VITE_WS_URL || `${_PROTOCOL === 'https:' ? 'wss' : 'ws'}://${_HOSTNAME}:3000`;

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: FiGrid },
  { path: '/current-orders', label: 'Pedidos Atuais', icon: FiShoppingCart },
  { path: '/orders', label: 'Histórico', icon: FiClock },
  { path: '/menu', label: 'Cardápio', icon: FiList },
  { path: '/ads', label: 'Anúncios', icon: FiBell },
  { path: '/ratings', label: 'Avaliações', icon: FiStar },
  { path: '/settings', label: 'Configurações', icon: FiSettings },
  { path: '/database', label: 'Banco de Dados', icon: FiDatabase },
  { path: '/logs', label: 'Status do Sistema', icon: FiTerminal },
];

function usePageTitle(pathname) {
  switch (pathname) {
    case '/dashboard':
      return 'Dashboard do Restaurante';
    case '/orders':
      return 'Histórico de Pedidos';
    case '/menu':
      return 'Gerenciamento de Cardápio';
    case '/current-orders':
      return 'Gestão de Pedidos Atuais';
    case '/ads':
      return 'Gestão de Anúncios';
    case '/ratings':
      return 'Gestão de Avaliações';
    case '/settings':
      return 'Configurações Gerais';
    case '/database':
      return 'Configuração do Banco de Dados';
    case '/logs':
      return 'Status do Sistema';
    default:
      return 'Dashboard';
  }
}

export default function AdminLayout() {
  const [notification, setNotification] = useState(null); // { text, type }
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const persisted = localStorage.getItem('admin_sidebar_open');
      if (persisted === null) return true; // default aberto
      return persisted === '1';
    } catch {
      return true;
    }
  });
  const [settings, setSettings] = useState(null);
  const [locked, setLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const location = useLocation();
  const title = usePageTitle(location.pathname);

  useEffect(() => {
    // Buscar configurações do admin (para bloqueio de tela e outros)
    (async () => {
      try {
        const data = await getSettings();
        setSettings(data);
        const isLockEnabled = data?.screen_lock_enabled === true || data?.screen_lock_enabled === 'true';
        const persistedLocked = sessionStorage.getItem('admin_locked') === '1';
        if (isLockEnabled && persistedLocked) {
          setLocked(true);
        }
      } catch (e) {
        console.error('Falha ao buscar configurações do admin:', e);
      }
    })();

    const unsubNew = subscribeToEvent('NEW_ORDER', (payload) => {
      setNotification({ text: `Novo pedido da mesa ${payload.table_number}!`, type: 'info' });
    });
    const unsubCall = subscribeToEvent('CALL_WAITER', (payload) => {
      setNotification({ text: `Mesa ${payload.table_number} chamando!`, type: 'warning' });
    });
    const unsubPrep = subscribeToEvent('PREP_TIME_UPDATE', (payload) => {
      setNotification({ text: `Tempo de preparo ajustado para o pedido #${payload.order_id}`, type: 'info' });
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine'; o.frequency.setValueAtTime(880, ctx.currentTime);
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
        o.start();
        setTimeout(() => { g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05); o.stop(ctx.currentTime + 0.06); }, 200);
      } catch {}
    });
    const unsubCancel = subscribeToEvent('ORDER_CANCELLED', (payload) => {
      setNotification({ text: `Pedido #${payload.id} foi cancelado.`, type: 'warning' });
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'triangle'; o.frequency.setValueAtTime(220, ctx.currentTime);
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
        o.start();
        setTimeout(() => { g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1); o.stop(ctx.currentTime + 0.12); }, 300);
      } catch {}
    });
    // Listener para toasts globais
    const onToast = (e) => {
      const detail = e.detail || {};
      const text = detail.message || detail.text;
      const type = detail.type || 'success';
      if (text) setNotification({ text, type });
    };
    window.addEventListener('admin:toast', onToast);

    return () => { unsubNew(); unsubCall(); unsubPrep(); unsubCancel(); window.removeEventListener('admin:toast', onToast); };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('admin_sidebar_open', sidebarOpen ? '1' : '0');
    } catch {}
  }, [sidebarOpen]);

  useEffect(() => {
    // Fecha o menu mobile ao navegar
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex bg-gray-100 text-gray-800">
      <Notification message={notification?.text} type={notification?.type || 'success'} onClear={() => setNotification(null)} />

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white shadow-md transition-transform duration-200 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-16 flex items-center px-6 border-b">
          <span className="text-xl font-bold text-brand-600">Admin</span>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Conteúdo principal */}
      <div className={`flex-1 flex flex-col ${sidebarOpen ? 'md:pl-64' : ''}`}>
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white shadow">
          <div className="h-16 container flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100"
                onClick={() => setSidebarOpen((v) => !v)}
                aria-label={sidebarOpen ? 'Esconder menu' : 'Mostrar menu'}
                title={sidebarOpen ? 'Esconder menu' : 'Mostrar menu'}
              >
                {sidebarOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              {(() => {
                const isLockEnabled = settings?.screen_lock_enabled === true || settings?.screen_lock_enabled === 'true';
                if (!isLockEnabled) return null;
                return (
                  <button
                    className="inline-flex items-center justify-center px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                    onClick={() => { setLocked(true); sessionStorage.setItem('admin_locked','1'); }}
                    aria-label="Bloquear tela"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c.943 0 1.833.366 2.5 1.025A3.5 3.5 0 0118 15.5V17a2 2 0 01-2 2H8a2 2 0 01-2-2v-1.5a3.5 3.5 0 013.5-3.5h.5v-2a2 2 0 114 0v2h.5z" />
                    </svg>
                    Bloquear
                  </button>
                );
              })()}
            </div>
          </div>
        </header>

        {locked && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
              <h2 className="text-xl font-bold mb-4">Tela bloqueada</h2>
              <p className="text-gray-600 mb-4">Insira o PIN para desbloquear</p>
              <input
                type="password"
                inputMode="numeric"
                className="w-full border rounded px-3 py-2 mb-4"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="PIN"
              />
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={() => { setPinInput(''); setLocked(true); sessionStorage.setItem('admin_locked','1'); }}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                  onClick={() => {
                    const pin = settings?.screen_lock_pin ?? '';
                    if (pin && pinInput === pin) {
                      setLocked(false);
                      setPinInput('');
                      sessionStorage.removeItem('admin_locked');
                    } else {
                      alert('PIN incorreto');
                    }
                  }}
                >
                  Desbloquear
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="container py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

