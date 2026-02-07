import React, { useState, useEffect } from 'react';
import { subscribeToEvent } from '../services/socket';
import { formatMeticalDisplay } from '../utils/currency';

const _HOSTNAME = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : 'localhost';
const _PROTOCOL = (typeof window !== 'undefined' && window.location && window.location.protocol) ? window.location.protocol : 'http:';
const API_URL = import.meta.env.VITE_API_URL || `${_PROTOCOL}//${_HOSTNAME}:3000/api`;
const WS_URL = import.meta.env.VITE_WS_URL || `${_PROTOCOL === 'https:' ? 'wss' : 'ws'}://${_HOSTNAME}:3000`;

const getItemUnitPrice = (item) => {
  const price = item?.price ?? item?.unit_price ?? item?.unitPrice ?? 0;
  const n = typeof price === 'string' ? parseFloat(price) : Number(price);
  return isNaN(n) ? 0 : n;
};

const getOrderItems = (order) => Array.isArray(order?.items) ? order.items : [];

const computeOrderTotal = (order) => {
  const declared = order?.total_price ?? order?.total ?? null;
  const declaredNum = declared != null ? Number(declared) : null;
  if (declaredNum != null && !isNaN(declaredNum)) return declaredNum;
  return getOrderItems(order).reduce((sum, it) => sum + getItemUnitPrice(it) * (Number(it?.quantity ?? 1) || 1), 0);
};

const statusLabel = (s) => ({
  pending: 'Aguardando',
  preparing: 'Em Preparo',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}[s] || s);

const readPersistedStatuses = () => {
  try {
    const raw = sessionStorage.getItem('adminOrderStatuses');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const writePersistedStatus = (orderId, status) => {
  try {
    const map = readPersistedStatuses();
    if (status == null) {
      delete map[orderId];
    } else {
      map[orderId] = status;
    }
    sessionStorage.setItem('adminOrderStatuses', JSON.stringify(map));
  } catch (e) {
    // ignore storage errors
  }
};

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('pending'); // Default filter
  const [actionMessage, setActionMessage] = useState(null);
  const [editingPrep, setEditingPrep] = useState({}); // { [orderId]: minutesString }
  const [undoableCompletions, setUndoableCompletions] = useState(new Set()); // order IDs that can be undone

  const fetchOrders = async (status) => {
    setLoading(true);
    try {
      const url = status && status !== 'all' ? `${API_URL}/orders?status=${status}` : `${API_URL}/orders`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Erro ao buscar pedidos.');
      }
      const data = await response.json();
      setOrders(data.orders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(filterStatus);

    const unsubNew = subscribeToEvent('NEW_ORDER', () => {
      console.log('Atualização NEW_ORDER recebida via socket service.');
      fetchOrders(filterStatus);
    });
    const unsubStatus = subscribeToEvent('ORDER_STATUS_UPDATE', () => {
      console.log('Atualização ORDER_STATUS_UPDATE recebida via socket service.');
      fetchOrders(filterStatus);
    });
    const unsubPrep = subscribeToEvent('PREP_TIME_UPDATE', () => {
      console.log('Atualização PREP_TIME_UPDATE recebida via socket service.');
      fetchOrders(filterStatus);
    });
    const unsubCancel = subscribeToEvent('ORDER_CANCELLED', () => {
      console.log('Atualização ORDER_CANCELLED recebida via socket service.');
      fetchOrders(filterStatus);
    });

    return () => {
      unsubNew(); unsubStatus(); unsubPrep(); unsubCancel();
    };
  }, [filterStatus]);

  const handleStatusChange = async (orderId, newStatus, reason = null) => {
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, cancellation_reason: reason }),
      });
      if (!response.ok) {
        throw new Error('Erro ao atualizar status do pedido.');
      }
      // Atualiza a lista imediatamente após o sucesso
      setActionMessage(`Pedido #${orderId} atualizado para "${newStatus}".`);
      // persist admin-side completed state to avoid showing prep timers after refresh
      if (newStatus === 'completed') {
        writePersistedStatus(orderId, 'completed');
      } else {
        writePersistedStatus(orderId, null);
      }
      if (newStatus === 'completed') {
        setUndoableCompletions(prev => new Set([...prev, orderId]));
        setTimeout(() => {
          setUndoableCompletions(prev => {
            const next = new Set(prev);
            next.delete(orderId);
            return next;
          });
        }, 5000);
      }
      setTimeout(() => setActionMessage(null), 3000);
      fetchOrders(filterStatus);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelOrder = (orderId) => {
    if (window.confirm('Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.')) {
      const reason = window.prompt('Motivo do cancelamento (opcional):');
      handleStatusChange(orderId, 'cancelled', reason);
    }
  };

  const handleCompleteOrder = (orderId) => {
    if (window.confirm('Tem certeza que deseja marcar este pedido como concluído?')) {
      handleStatusChange(orderId, 'completed');
    }
  };

  const handleUndoComplete = (orderId) => {
    if (window.confirm('Desfazer conclusão e voltar para "Em Preparo"?')) {
      handleStatusChange(orderId, 'preparing');
      setUndoableCompletions(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      writePersistedStatus(orderId, null);
    }
  };

  const adjustPrepTime = async (orderId, { addMinutes, setMinutes }) => {
    try {
      const body = {};
      if (typeof setMinutes === 'number') body.set_minutes = setMinutes;
      if (typeof addMinutes === 'number') body.add_minutes = addMinutes;
      const res = await fetch(`${API_URL}/orders/${orderId}/prep-time`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Erro ao ajustar tempo de preparo.');
      setActionMessage(`Tempo de preparo atualizado para o pedido #${orderId}.`);
      setTimeout(() => setActionMessage(null), 3000);
      fetchOrders(filterStatus);
    } catch (err) {
      setError(err.message);
    }
  };

  // Read persisted admin-side statuses once per render
  const persisted = readPersistedStatuses();

  if (loading) return <div className="text-center p-8">Carregando pedidos...</div>;
  if (error) return <div className="text-center text-red-500 p-8">Erro: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Pedidos em Tempo Real</h1>
            <p className="text-gray-600 mt-1">Acompanhe e gerencie todos os pedidos do restaurante</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700">Filtrar por Status:</label>
              <select
                id="statusFilter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="pending">Aguardando</option>
                <option value="preparing">Em Preparo</option>
                <option value="completed">Concluído</option>
                <option value="cancelled">Cancelado</option>
                <option value="all">Todos</option>
              </select>
            </div>
            {actionMessage && (
              <div className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm">
                {actionMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-sm text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido encontrado</h3>
          <p className="text-gray-500">Não há pedidos com o status "{statusLabel(filterStatus)}" no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Pedido #{order.id}</h2>
                  <p className="text-sm text-gray-600">Mesa {order.table_number}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                    {statusLabel(order.status)}
                  </span>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold text-gray-900">{formatMeticalDisplay(computeOrderTotal(order))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Hora:</span>
                  <span className="text-gray-900">{new Date(order.created_at).toLocaleTimeString('pt-MZ')}</span>
                </div>
              </div>
              {typeof order.prep_time_seconds === 'number' && (order.status === 'pending' || order.status === 'preparing') && !(persisted && String(persisted[order.id]) === 'completed') && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Tempo de Preparo:</span>
                    <span className="text-lg font-bold text-gray-900">{Math.ceil(order.prep_time_seconds / 60)} min</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button onClick={() => adjustPrepTime(order.id, { addMinutes: 5 })} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-md text-sm font-medium transition-colors">+5 min</button>
                      <button onClick={() => adjustPrepTime(order.id, { addMinutes: 10 })} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-md text-sm font-medium transition-colors">+10 min</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Minutos"
                        value={editingPrep[order.id] ?? ''}
                        onChange={(e) => setEditingPrep(prev => ({ ...prev, [order.id]: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={() => {
                          const val = parseFloat(editingPrep[order.id]);
                          if (!isNaN(val)) adjustPrepTime(order.id, { setMinutes: val });
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      >Definir</button>
                    </div>
                  </div>
                </div>
              )}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Itens do Pedido:</h3>
                <div className="space-y-2">
                  {getOrderItems(order).map((item, idx) => {
                    const unit = getItemUnitPrice(item);
                    const qty = Number(item?.quantity ?? 1) || 1;
                    const subtotal = unit * qty;
                    return (
                      <div key={idx} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">{item.name}</span>
                          <span className="text-sm text-gray-500 ml-2">x{qty}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{formatMeticalDisplay(subtotal)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(order.id, 'preparing')}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Em Preparo
                    </button>
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Cancelar
                    </button>
                  </>
                )}
                {order.status === 'preparing' && (
                  <>
                    <button
                      onClick={() => handleCompleteOrder(order.id)}
                      className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Concluído
                    </button>
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Cancelar
                    </button>
                  </>
                )}
                {order.status === 'completed' && (
                  <>
                    {undoableCompletions.has(order.id) ? (
                      <button
                        onClick={() => handleUndoComplete(order.id)}
                        className="bg-orange-500 text-white px-3 py-1 rounded text-sm"
                      >
                        Desfazer (5s)
                      </button>
                    ) : (
                      <span className="text-sm text-gray-500">Concluído</span>
                    )}
                  </>
                )}
                {order.status === 'cancelled' && (
                  <span className="text-sm text-gray-500">Cancelado</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderManagement;

