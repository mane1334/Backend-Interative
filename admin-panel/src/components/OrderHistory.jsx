import React, { useEffect, useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import { formatMeticalDisplay } from '../utils/currency';
import { subscribeToEvent } from '../services/socket';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;
const PAGE_SIZE = 10;

const statusOptions = {
  all: 'Todos',
  pending: 'Aguardando',
  preparing: 'Em Preparo',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  preparing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const OrderCard = ({ order }) => (
  <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-gray-200">
    <div className="p-5">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg text-gray-800">Pedido #{order.id}</h3>
          <p className="text-sm text-gray-500">Mesa: {order.table_number}</p>
        </div>
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
          {statusOptions[order.status] || order.status}
        </span>
      </div>
      <div className="mb-4">
        <p className="text-sm text-gray-600">Data: {new Date(order.created_at).toLocaleString('pt-MZ')}</p>
        <p className="font-semibold text-gray-800 mt-1">Total: {formatMeticalDisplay(order.total_price)}</p>
      </div>
      <div>
        <h4 className="font-semibold text-sm text-gray-700 mb-2">Itens:</h4>
        <ul className="space-y-1 text-sm text-gray-600 list-disc list-inside">
          {Array.isArray(order.items) && order.items.map((item, idx) => (
            <li key={idx}>{item.name} (x{item.quantity})</li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [hasMore, setHasMore] = useState(true);

  const fetchOrders = (pageNum, status) => {
    setLoading(true);
    const url = new URL(`${API_URL}/orders`);
    url.searchParams.append('limit', PAGE_SIZE);
    url.searchParams.append('offset', pageNum * PAGE_SIZE);
    if (status && status !== 'all') {
      url.searchParams.append('status', status);
    }

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Erro ao buscar histórico de pedidos');
        return res.json();
      })
      .then(data => {
        setOrders(prevOrders => pageNum === 0 ? data.orders : [...prevOrders, ...data.orders]);
        setHasMore(data.orders.length === PAGE_SIZE);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(0); // Reset page when filter changes
    setOrders([]); // Clear orders before fetching new filtered data
    fetchOrders(0, statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    if (page > 0) {
        fetchOrders(page, statusFilter);
    }

    const unsubNew = subscribeToEvent('NEW_ORDER', () => fetchOrders(0, statusFilter));
    const unsubStatus = subscribeToEvent('ORDER_STATUS_UPDATE', () => fetchOrders(0, statusFilter));

    return () => { unsubNew(); unsubStatus(); };
  }, [page]);

  const handleExport = () => {
    const exportUrl = new URL(`${API_URL}/orders/export`);
    if (statusFilter !== 'all') {
      exportUrl.searchParams.append('status', statusFilter);
    }
    window.location.href = exportUrl.toString();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Histórico de Pedidos</h2>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          <FiDownload />
          Exportar para CSV
        </button>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg shadow-sm">
          {Object.entries(statusOptions).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                statusFilter === key
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {loading && orders.length === 0 ? (
        <div className="text-center p-8">Carregando histórico...</div>
      ) : error ? (
        <div className="text-center text-red-500 p-8">{error}</div>
      ) : orders.length === 0 ? (
        <div className="text-center text-gray-500 p-8">Nenhum pedido encontrado com este status.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      <div className="flex justify-center mt-8">
        {hasMore && (
          <button
            className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
            onClick={() => setPage(p => p + 1)}
            disabled={loading}
          >
            {loading ? 'Carregando...' : 'Carregar Mais'}
          </button>
        )}
      </div>
    </div>
  );
}

export default OrderHistory;