import React, { useState, useEffect, useCallback } from 'react';
import { getRatings, getRatingsSummary } from '../services/api';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';

const Star = ({ filled }) => (
  <svg
    className={`w-5 h-5`}
    fill={filled ? '#FFD700' : '#E4E5E9'}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

const StaticStarRating = ({ rating }) => (
  <div className="flex items-center">
    {[...Array(5)].map((_, index) => (
      <Star key={index} filled={index < rating} />
    ))}
  </div>
);

const PIE_COLORS = ['#10b981', '#84cc16', '#facc15', '#fb923c', '#f87171'];

// Custom Tooltip for Bar Chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-bold text-gray-800">{label}</p>
        <p className="text-indigo-600">{`Média: ${Number(payload[0].value).toFixed(2)} ★`}</p>
        <p className="text-gray-500 text-sm">{`Votos: ${payload[0].payload.rating_count}`}</p>
      </div>
    );
  }
  return null;
};

// Custom Shape for Rounded Bar Chart
const RoundedBar = (props) => {
  const { fill, x, y, width, height } = props;
  const radius = 6;
  return <path d={`M${x},${y + radius} A${radius},${radius} 0 0 1 ${x + radius},${y} L${x + width - radius},${y} A${radius},${radius} 0 0 1 ${x + width},${y + radius} L${x + width},${y + height} L${x},${y + height} Z`} fill={fill} />;
};

// Custom Active Shape for Pie Chart
const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-bold">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${value} Votos`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`(Rate: ${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

const RatingsManagement = () => {
  const [ratings, setRatings] = useState([]);
  const [summary, setSummary] = useState({ averageRatingsPerDish: [], ratingDistribution: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = useCallback((_, index) => {
    setActiveIndex(index);
  }, [setActiveIndex]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ratingsData, summaryData] = await Promise.all([
          getRatings(),
          getRatingsSummary()
        ]);
        setRatings(ratingsData);
        setSummary(summaryData);
      } catch (error) {
        toast.error('Falha ao carregar dados das avaliações.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const formattedDistribution = summary.ratingDistribution.map(item => ({ name: `${item.rating} Estrelas`, value: Number(item.count) })).sort((a, b) => b.name.localeCompare(a.name));

  if (isLoading) {
    return <div className="p-6">Carregando avaliações...</div>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Avaliações dos Clientes</h1>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Média de Avaliação por Prato</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={summary.averageRatingsPerDish} margin={{ top: 5, right: 20, left: -10, bottom: 110 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="dish_name" interval={0} angle={-45} textAnchor="end" height={100} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }} />
              <Legend />
              <Bar dataKey="average_rating" name="Média" fill="#4f46e5" shape={<RoundedBar />} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Distribuição das Notas</h2>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie 
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={formattedDistribution} 
                cx="50%" 
                cy="50%" 
                innerRadius={80}
                outerRadius={110}
                dataKey="value" 
                nameKey="name" 
                onMouseEnter={onPieEnter}
              >
                {formattedDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Ratings Table */}
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Todas as Avaliações</h2>
        {ratings.length === 0 ? (
          <p className="text-center text-gray-500">Nenhuma avaliação foi recebida ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prato</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avaliação</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comentário</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ratings.map((rating) => (
                  <tr key={rating.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{rating.dish_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StaticStarRating rating={rating.rating} />
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 break-words">{rating.comment || '-'}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(rating.created_at).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RatingsManagement;
