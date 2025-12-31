import React, { useMemo, useState, useRef, useEffect } from 'react';
import { postOrder, cancelOrder } from '../services/api';
import { toast } from 'react-toastify';
import { formatCurrency } from '../utils/currency';
import { useCartState, useCartDispatch } from '../CartContext';
import { useSettings } from '../SettingsContext';
import useOrderStatus from '../hooks/useOrderStatus';
import useIntervalManager from '../hooks/useIntervalManager';

const Cart = () => {
  const cartItems = useCartState();
  const dispatch = useCartDispatch();
  const [updatingItemIds, setUpdatingItemIds] = useState(new Set());
  const [isOrdering, setIsOrdering] = useState(false);
  const [tableNumber, setTableNumber] = useState(1);
  const { settings, loading: settingsLoading } = useSettings();
  const lastOrderIdRef = useRef(null);
  const [currentOrder, setCurrentOrder] = useState({ id: null, prepSeconds: null, cancelUntil: null });
  const [remainingPrep, setRemainingPrep] = useState(null);
  const [remainingCancelMs, setRemainingCancelMs] = useState(0);
  const [orderStatus, setOrderStatus] = useState(null);
  const prepTimer = useIntervalManager();
  const cancelTimer = useIntervalManager();

  const formatSeconds = (total) => {
    const s = Math.max(0, Number(total) || 0);
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  // WS para mensagem de cortesia do pedido atual
  useEffect(() => {
  const hostname = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : 'localhost';
  const protocol = (typeof window !== 'undefined' && window.location && window.location.protocol) ? window.location.protocol : 'http:';
  const WS_URL = (import.meta.env.VITE_WS_URL || `${protocol === 'https' ? 'wss' : 'ws'}://${hostname}:3000`);
    const ws = new WebSocket(WS_URL);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'COURTESY_MESSAGE' && lastOrderIdRef.current && data.payload.order_id === lastOrderIdRef.current) {
          toast.info(data.payload.message || 'Pedimos desculpa pelo atraso, seu prato ficará pronto em breve.');
        } else if (data.type === 'PREP_TIME_UPDATE' && currentOrder?.id && data.payload.order_id === currentOrder.id) {
          const secs = Number(data.payload.prep_time_seconds) || 0;
          setCurrentOrder(prev => ({ ...prev, prepSeconds: secs }));
          setRemainingPrep(secs);
        } else if (data.type === 'ORDER_CANCELLED' && currentOrder?.id && data.payload.id === currentOrder.id) {
          toast.warn('Seu pedido foi cancelado.');
          setCurrentOrder({ id: null, prepSeconds: null, cancelUntil: null });
          setRemainingPrep(null);
          setRemainingCancelMs(0);
        }
      } catch {}
    };
    return () => ws.close();
  }, []);

// Timers
useEffect(() => {
  prepTimer.stop();
  if (typeof remainingPrep === 'number' && orderStatus !== 'completed') {
    prepTimer.start(() => {
      setRemainingPrep(prev => (prev != null ? Math.max(0, prev - 1) : prev));
    }, 1000);
  }
  return () => { prepTimer.stop(); };
}, [remainingPrep, orderStatus]);

useEffect(() => {
  cancelTimer.stop();
  if (currentOrder?.cancelUntil && orderStatus !== 'completed') {
    cancelTimer.start(() => {
      const diff = new Date(currentOrder.cancelUntil).getTime() - Date.now();
      setRemainingCancelMs(Math.max(0, diff));
    }, 500);
  } else {
    setRemainingCancelMs(0);
  }
  return () => { cancelTimer.stop(); };
}, [currentOrder?.cancelUntil, orderStatus]);

  const totalPrice = useMemo(() => cartItems.reduce((total, item) => total + item.price * item.quantity, 0), [cartItems]);
  const totalItems = useMemo(() => cartItems.reduce((total, item) => total + item.quantity, 0), [cartItems]);

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0 || !tableNumber) return;
    // Bloqueio por horário
    const open = isOpenNow(settings);
    if (!open) {
      toast.error('Estamos fechados. Retorne no horário de funcionamento.');
      return;
    }
    setIsOrdering(true);
    try {
      const items = cartItems.map(i => ({ dish_id: i.id, quantity: i.quantity }));
      const resp = await postOrder({ table_number: tableNumber, items });
      if (resp?.order_id) lastOrderIdRef.current = resp.order_id;
      if (resp?.order_id) {
        const prep = Number(resp.prep_time_seconds) || 0;
        const cancelUntil = resp.cancel_until || null;
        setCurrentOrder({ id: resp.order_id, prepSeconds: prep, cancelUntil });
        setRemainingPrep(prep);
        try {
          sessionStorage.setItem('currentOrderId', String(resp.order_id));
          sessionStorage.setItem('currentPrepSeconds', String(prep));
          sessionStorage.setItem('currentOrderStatus', 'preparing');
          if (cancelUntil) sessionStorage.setItem('currentCancelUntil', String(cancelUntil));
          window.dispatchEvent(new Event('order:updated'));
        } catch {}
      }
      toast.success('Pedido realizado com sucesso! A cozinha já foi notificada.');
      dispatch({ type: 'CLEAR' });
    } catch (e) {
      toast.error('Erro ao realizar o pedido. Tente novamente.');
    } finally {
      setIsOrdering(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!currentOrder?.id) return;
    try {
      await cancelOrder(currentOrder.id);
      toast.success('Pedido cancelado com sucesso.');
      setCurrentOrder({ id: null, prepSeconds: null, cancelUntil: null });
      setRemainingPrep(null);
      setRemainingCancelMs(0);
      try {
        sessionStorage.removeItem('currentOrderId');
        sessionStorage.removeItem('currentPrepSeconds');
        sessionStorage.removeItem('currentOrderStatus');
        sessionStorage.removeItem('currentCancelUntil');
        window.dispatchEvent(new Event('order:updated'));
      } catch {}
    } catch (e) {
      toast.error('Não foi possível cancelar. Janela pode ter expirado.');
    }
  };

  const isOpenNow = (settings) => {
    const open = settings?.open_time || '00:00';
    const close = settings?.close_time || '23:59';
    const now = new Date();
    const [oh, om] = open.split(':').map(Number);
    const [ch, cm] = close.split(':').map(Number);
    const openDate = new Date(now); openDate.setHours(oh, om, 0, 0);
    const closeDate = new Date(now); closeDate.setHours(ch, cm, 0, 0);
    return now >= openDate && now <= closeDate;
  }

  // Reagir a updates de status do pedido (ex.: completed)
  useOrderStatus(currentOrder?.id, (newStatus) => {
    setOrderStatus((prev) => {
      if (newStatus === 'completed' && prev !== 'completed') {
        // Parar contagens e bloquear cancelamento. Não disparar toast aqui para evitar duplicidade com CurrentOrder.
        setRemainingPrep(null);
        setRemainingCancelMs(0);
        try { sessionStorage.setItem('currentOrderStatus', 'completed'); } catch {}
      }
      return newStatus;
    });
  });

  if (settingsLoading) {
    return (
      <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-200">
        <div className="flex items-center justify-center mb-6">
          <div className="h-8 w-48 skeleton rounded"></div>
        </div>
        <div className="space-y-4">
          <div className="h-5 w-32 skeleton rounded"></div>
          <div className="h-10 w-full skeleton rounded"></div>
          <div className="h-24 w-full skeleton rounded"></div>
          <div className="h-10 w-full skeleton rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-200">
      <div className="flex items-center justify-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">🛒 Seu Carrinho</h2>
        {cartItems.length > 0 && (
          <span className="ml-3 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full">
            {totalItems} {totalItems === 1 ? 'item' : 'itens'}
          </span>
        )}
      </div>
      
      {/* Table Number Input */}
      <div className="mb-6">
        <label htmlFor="tableNumber" className="block text-sm font-medium text-gray-700 mb-2">
          Número da Mesa
        </label>
        <input
          type="number"
          id="tableNumber"
          min="1"
          max={Number(settings?.tables_count) || 50}
          value={tableNumber}
          onChange={(e) => setTableNumber(parseInt(e.target.value) || 1)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          placeholder="Digite o número da sua mesa"
        />
      </div>
      
      {cartItems.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🍽️</div>
          <p className="text-gray-600 text-lg">Seu carrinho está vazio</p>
          <p className="text-gray-500 text-sm mt-2">Peça alguns pratos deliciosos!</p>
        </div>
      ) : (
        <div>
          {currentOrder?.id && (
            <div id="current-order" className={`mb-4 p-3 rounded-lg border ${orderStatus === 'completed' ? 'border-green-300 bg-green-50' : 'border-yellow-300 bg-yellow-50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-semibold ${orderStatus === 'completed' ? 'text-green-800' : 'text-yellow-800'}`}>Pedido #{currentOrder.id}</p>
                  {orderStatus === 'completed' ? (
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
                        Pronto
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-yellow-700">Tempo de preparo: {formatSeconds(remainingPrep)}</p>
                  )}
                </div>
                {orderStatus !== 'completed' && (
                  <button
                    onClick={handleCancelOrder}
                    disabled={remainingCancelMs <= 0}
                    className={`px-3 py-2 rounded font-semibold text-white ${remainingCancelMs <= 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                  >
                    {remainingCancelMs > 0 ? `Cancelar (${Math.ceil(remainingCancelMs/1000)}s)` : 'Cancelar Indisponível'}
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="max-h-72 overflow-y-auto pr-2 mb-4">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg shadow-sm mb-3 border border-gray-100">
                <div className="flex-1">
                  <span className="font-semibold text-gray-900 text-lg">{item.name}</span>
                  <span className="text-gray-600 text-sm block">{formatCurrency(item.price)} cada</span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors duration-200 text-lg font-bold"
                    onClick={() => {
                      setUpdatingItemIds(prev => new Set(prev).add(item.id));
                      dispatch({ type: 'CHANGE_QUANTITY', id: item.id, quantity: item.quantity - 1 });
                      setTimeout(() => setUpdatingItemIds(prev => { const n = new Set(prev); n.delete(item.id); return n; }), 350);
                    }}>-</button>
                  <span className="font-medium text-gray-800 text-lg">{item.quantity}</span>
                  <button 
                    className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors duration-200 text-lg font-bold"
                    onClick={() => {
                      setUpdatingItemIds(prev => new Set(prev).add(item.id));
                      dispatch({ type: 'CHANGE_QUANTITY', id: item.id, quantity: item.quantity + 1 });
                      setTimeout(() => setUpdatingItemIds(prev => { const n = new Set(prev); n.delete(item.id); return n; }), 350);
                    }}>+</button>
                  <span className="font-bold text-red-600 ml-4 text-lg">{formatCurrency(item.price * item.quantity)}</span>
                  <button 
                    className="bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors duration-200 ml-2"
                    onClick={() => {
                      setUpdatingItemIds(prev => new Set(prev).add(item.id));
                      dispatch({ type: 'REMOVE_ITEM', id: item.id });
                      setTimeout(() => setUpdatingItemIds(prev => { const n = new Set(prev); n.delete(item.id); return n; }), 350);
                    }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                {updatingItemIds.has(item.id) ? (
                  <div className="ml-3 w-10 h-10 skeleton rounded"></div>
                ) : null}
              </div>
            ))}
          </div>
          <hr className="my-5 border-gray-300" />
          <div className="flex justify-between font-bold text-2xl text-gray-900 mb-6">
            <span>Total</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>
          <button 
            onClick={() => dispatch({ type: 'CLEAR' })}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-4 rounded-lg transition-colors duration-300 mb-3 shadow-md"
          >
            Limpar Carrinho
          </button>
          <button 
            onClick={handlePlaceOrder}
            disabled={cartItems.length === 0 || isOrdering} 
            className={`w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 shadow-md 
              ${cartItems.length === 0 || isOrdering ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}`}
          >
            {isOrdering ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white mr-3"></div>
                Enviando Pedido...
              </div>
            ) : (
              'Finalizar Pedido'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;
