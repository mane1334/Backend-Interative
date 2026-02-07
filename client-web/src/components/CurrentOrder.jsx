import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { cancelOrder } from '../services/api';
import useOrderStatus from '../hooks/useOrderStatus';
import useIntervalManager from '../hooks/useIntervalManager';

// Pequeno card fixo para mostrar o pedido atual da mesa, com contagem regressiva e opção de cancelamento
const CurrentOrder = () => {
  const [orderId, setOrderId] = useState(null);
  const [remainingPrep, setRemainingPrep] = useState(null);
  const [cancelUntil, setCancelUntil] = useState(null);
  const [remainingCancelMs, setRemainingCancelMs] = useState(0);
  const [status, setStatus] = useState(null);
  const wsRef = useRef(null);
  const prepTimer = useIntervalManager();
  const cancelTimer = useIntervalManager();

  const formatSeconds = (total) => {
    const s = Math.max(0, Number(total) || 0);
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  // Carregar do sessionStorage e ouvir eventos globais
  useEffect(() => {
    const loadFromSession = () => {
      try {
        const id = sessionStorage.getItem('currentOrderId');
        const prepSeconds = Number(sessionStorage.getItem('currentPrepSeconds'));
        const cu = sessionStorage.getItem('currentCancelUntil');
        const savedStatus = sessionStorage.getItem('currentOrderStatus');
        setOrderId(id ? Number(id) : null);
        setRemainingPrep(Number.isFinite(prepSeconds) ? prepSeconds : null);
        setCancelUntil(cu || null);
        setStatus(savedStatus || null);
      } catch {}
    };
    loadFromSession();
    const onOrderUpdated = () => loadFromSession();
    window.addEventListener('order:updated', onOrderUpdated);
    return () => window.removeEventListener('order:updated', onOrderUpdated);
  }, []);

  // Estabelece a conexão WebSocket uma única vez
  useEffect(() => {
    if (wsRef.current) return; // evita múltiplas conexões
  const hostname = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : 'localhost';
  const protocol = (typeof window !== 'undefined' && window.location && window.location.protocol) ? window.location.protocol : 'http:';
  const WS_URL = (import.meta.env.VITE_WS_URL || `${protocol === 'https' ? 'wss' : 'ws'}://${hostname}:3000`);
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    return () => { try { ws.close(); } catch {} wsRef.current = null; };
  }, []);

  // Atualiza o handler conforme o orderId muda (usa sempre o orderId mais recente)
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws) return;
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'PREP_TIME_UPDATE' && orderId && data.payload.order_id === orderId) {
          const secs = Number(data.payload.prep_time_seconds) || 0;
          setRemainingPrep(secs);
          try { sessionStorage.setItem('currentPrepSeconds', String(secs)); } catch {}
        } else if (data.type === 'ORDER_CANCELLED' && orderId && data.payload.id === orderId) {
          toast.warn('Seu pedido foi cancelado.');
          clearOrderState();
        } else if (data.type === 'COURTESY_MESSAGE' && orderId && data.payload.order_id === orderId) {
          toast.info(data.payload.message || 'Pedimos desculpa pelo atraso, seu prato ficará pronto em breve.');
        }
      } catch {}
    };
  }, [orderId]);

// Timers para preparo e janela de cancelamento
useEffect(() => {
  // Sempre parar o timer ao recalcular condições
  prepTimer.stop();
  if (typeof remainingPrep === 'number' && status !== 'completed') {
    prepTimer.start(() => {
      setRemainingPrep(prev => (prev != null ? Math.max(0, prev - 1) : prev));
    }, 1000);
  }
  return () => {
    prepTimer.stop();
  };
}, [remainingPrep, status]);

  useEffect(() => {
    cancelTimer.stop();
    if (cancelUntil) {
      cancelTimer.start(() => {
        const diff = new Date(cancelUntil).getTime() - Date.now();
        setRemainingCancelMs(Math.max(0, diff));
      }, 500);
    } else {
      setRemainingCancelMs(0);
    }
    return () => { cancelTimer.stop(); };
  }, [cancelUntil]);

  const clearOrderState = () => {
    setOrderId(null);
    setRemainingPrep(null);
    setCancelUntil(null);
    setRemainingCancelMs(0);
    try {
      sessionStorage.removeItem('currentOrderId');
      sessionStorage.removeItem('currentPrepSeconds');
      sessionStorage.removeItem('currentCancelUntil');
      sessionStorage.removeItem('currentOrderStatus');
      window.dispatchEvent(new Event('order:updated'));
    } catch {}
  };

const handleCancel = async () => {
  if (!orderId) return;
  try {
    await cancelOrder(orderId);
    toast.success('Pedido cancelado com sucesso.');
    clearOrderState();
  } catch (e) {
    toast.error('Não foi possível cancelar. Janela pode ter expirado.');
  }
};

// Reagir a updates de status do pedido (ex.: completed)
useOrderStatus(orderId, (newStatus) => {
  setStatus((prev) => {
    if (newStatus === 'completed' && prev !== 'completed') {
      // Parar timers ativos ao completar
      prepTimer.stop();
      cancelTimer.stop();
      // Para não exibir mais o contador/permitir cancelar
      setRemainingPrep(null);
      setCancelUntil(null);
      setRemainingCancelMs(0);
      toast.success('Seu prato está pronto e a caminho!');
      try { sessionStorage.setItem('currentOrderStatus', 'completed'); } catch {}
    }
    return newStatus;
  });
});

// Skeleton while settings/order context might still be initializing
if (orderId === null) {
  return (
    <div className="bg-white rounded-xl shadow-xl p-4 border mb-6">
      <div className="h-6 w-32 skeleton rounded mb-3"></div>
      <div className="h-12 w-full skeleton rounded"></div>
    </div>
  );
}

return (
  <div className={`bg-white rounded-xl shadow-xl p-4 border mb-6 ${status === 'completed' ? 'border-green-300' : 'border-yellow-300'}`}>
    <div className="flex items-center justify-between mb-1">
      <h3 className={`text-lg font-bold ${status === 'completed' ? 'text-green-800' : 'text-yellow-800'}`}>Seu Pedido</h3>
      <span className={`text-sm ${status === 'completed' ? 'text-green-700' : 'text-yellow-700'}`}>#{orderId}</span>
    </div>
    <div className="flex items-center justify-between">
      <div className={status === 'completed' ? 'text-green-800' : 'text-yellow-800'}>
        {status === 'completed' ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
              Pronto
            </span>
          </div>
        ) : (
          <>
            <div className="text-sm">Tempo de preparo</div>
            <div className="text-2xl font-extrabold">{formatSeconds(remainingPrep)}</div>
          </>
        )}
      </div>
      {status !== 'completed' && (
        <button
          onClick={handleCancel}
          disabled={remainingCancelMs <= 0}
          className={`px-3 py-2 rounded font-semibold text-white ${remainingCancelMs <= 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
        >
          {remainingCancelMs > 0 ? `Cancelar (${Math.ceil(remainingCancelMs/1000)}s)` : 'Cancelar Indisponível'}
        </button>
      )}
    </div>
  </div>
);
};

export default CurrentOrder;
