import React, { useEffect, useState, useMemo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar, Line, BarChart, Cell, PieChart, Pie } from 'recharts';
import { getAnalytics } from '../services/api';
import { subscribeToEvent } from '../services/socket';
import { toast } from 'react-toastify';
import { FiDollarSign, FiShoppingCart, FiBarChart, FiClock, FiBell, FiStar, FiPieChart } from 'react-icons/fi';

// Helper para formatar moeda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(value || 0);
};

const COLORS = ['#34d399', '#60a5fa', '#a78bfa', '#facc15', '#fb923c', '#f87171'];

// Componente para os cartões de estatísticas
const StatCard = ({ title, value, icon, color }) => {
  const Icon = icon;
  return (
    <div className={`bg-white p-6 rounded-xl shadow-lg border-l-4 ${color} flex items-center space-x-4 hover:shadow-xl transition-shadow duration-300`}>
      <div className={`bg-gray-100 p-4 rounded-full`}>
        <Icon className="w-8 h-8 text-gray-700" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
        <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
    </div>
  );
};

// Tooltip customizado para o gráfico principal
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-bold text-gray-800">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {`${p.name}: ${p.dataKey === 'faturamento' || p.dataKey === 'revenue' ? formatCurrency(p.value) : p.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [waiterCalls, setWaiterCalls] = useState([]);

  const fetchAnalyticsData = async () => {
    try {
      const analyticsData = await getAnalytics();
      setData(analyticsData);
    } catch (err) {
      toast.error(`Erro ao carregar dados analíticos: ${err.message}`);
    }
  };

  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      await fetchAnalyticsData();
      setLoading(false);
    }
    initialLoad();

    const interval = setInterval(fetchAnalyticsData, 60000); // Atualiza a cada minuto

    const unsubCall = subscribeToEvent('CALL_WAITER', (payload) => {
      toast.warn(`Mesa ${payload.table_number} está chamando!`, { icon: "🔥" });
      setWaiterCalls(prev => [
        {
          table_number: payload.table_number,
          time: new Date(),
        },
        ...prev
      ].slice(0, 5));
    });

    const unsubNewOrder = subscribeToEvent('NEW_ORDER', () => {
      fetchAnalyticsData(); // Refresh analytics on new order
    });

    return () => {
      clearInterval(interval);
      unsubCall();
      unsubNewOrder();
    };
  }, []);

  const formattedOrdersByDay = useMemo(() => {
    return data?.ordersByDay?.map(item => ({
      ...item,
      day: new Date(item.day).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      faturamento: parseFloat(item.faturamento || 0),
    })) || [];
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard de Analytics</h1>
        <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
          Última atualização: {new Date().toLocaleTimeString('pt-BR')}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Faturamento Hoje" value={formatCurrency(data.dailySummary?.faturamento_dia)} icon={FiDollarSign} color="border-green-500" />
        <StatCard title="Pedidos Hoje" value={data.dailySummary?.total_pedidos_dia || 0} icon={FiShoppingCart} color="border-blue-500" />
        <StatCard title="Faturamento Mês" value={formatCurrency(data.monthlySummary?.faturamento_mes)} icon={FiBarChart} color="border-purple-500" />
        <StatCard title="Tempo Médio Atendimento" value={data.avgServiceTime ? `${Math.round(data.avgServiceTime / 60)} min` : 'N/A'} icon={FiClock} color="border-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Main Content Grid: 7-Day Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiBarChart className="text-indigo-600" /> Tendência de Vendas (7 Dias)
          </h2>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={formattedOrdersByDay} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value) => formatCurrency(value)} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} />
              <Bar yAxisId="left" dataKey="faturamento" name="Faturamento" fill="#818cf8" barSize={30} radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="pedidos" name="Pedidos" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Waiter Calls */}
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiBell className="text-red-500" /> Chamadas Ativas
          </h2>
          {waiterCalls.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <FiBell className="mx-auto text-4xl text-gray-200 mb-2" />
              Nenhuma chamada.
            </div>
          ) : (
            <div className="space-y-4">
              {waiterCalls.map((call, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-orange-500 rounded-full animate-ping"></div>
                    <span className="font-bold text-orange-800 text-lg">Mesa {call.table_number}</span>
                  </div>
                  <span className="text-sm text-orange-600 font-medium">{call.time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

        {/* Revenue by Category (Pie Chart) */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiPieChart className="text-emerald-500" /> Vendas por Categoria
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.revenueByCategory}
                dataKey="revenue"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={60}
                paddingAngle={5}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.revenueByCategory?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Peak Hours (Bar Chart) */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiClock className="text-blue-500" /> Fluxo por Horário
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.peakHours}>
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="count" name="Pedidos" fill="#60a5fa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Rated Dishes */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiStar className="text-yellow-500" /> Melhor Avaliados
          </h2>
          <div className="space-y-4">
            {data.topRated?.map((dish, idx) => (
              <div key={idx} className="flex items-center justify-between border-b border-gray-50 pb-2">
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{dish.name}</p>
                  <p className="text-xs text-gray-500">{dish.count} avaliações</p>
                </div>
                <div className="flex items-center text-yellow-500 font-bold">
                  {parseFloat(dish.avg_rating).toFixed(1)} <FiStar className="ml-1 fill-current" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
