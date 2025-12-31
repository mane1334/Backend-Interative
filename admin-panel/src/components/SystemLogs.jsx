import React, { useState, useEffect } from 'react';
import { subscribeToEvent } from '../services/socket';
import apiClient from '../services/api';

// --- Componente de Diagnóstico de Saúde ---
const HealthCheck = () => {
  const [healthReport, setHealthReport] = useState(null);
  const [error, setError] = useState(null);

  const fetchHealth = () => {
    apiClient.get('/health')
      .then(response => {
        setHealthReport(response.data);
        setError(null);
      })
      .catch(err => {
        const report = err.response?.data;
        if (report && report.services) {
          setHealthReport(report);
        } else {
          setError('A API principal está inacessível.');
          setHealthReport(null);
        }
      });
  };

  useEffect(() => {
    fetchHealth();
    const intervalId = setInterval(fetchHealth, 10000);
    return () => clearInterval(intervalId);
  }, []);

  const StatusIcon = ({ status }) => {
    const bgColor = status === 'ok' ? 'bg-green-500' : 'bg-red-500';
    return <span className={`inline-block w-3 h-3 ${bgColor} rounded-full`}></span>;
  };

  const renderStatus = () => {
    if (error) {
      return <div className="text-red-600">{error}</div>;
    }
    if (!healthReport) {
      return <div>Verificando saúde dos sistemas...</div>;
    }
    return (
      <ul className="space-y-2 text-sm">
        {healthReport.services.map(service => (
          <li key={service.name} className="flex items-center justify-between p-2 bg-gray-100 rounded-md">
            <div className="flex items-center">
              <StatusIcon status={service.status} />
              <span className="ml-3 font-medium text-gray-800">{service.name}</span>
            </div>
            <div className="text-right">
              <span className={`font-semibold ${service.status === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                {service.status === 'ok' ? 'Operacional' : 'Erro'}
              </span>
              {service.details && (
                <p className="text-xs text-gray-500 truncate" title={service.details}>
                  {service.details}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  };

  const overallStatusText = healthReport?.status === 'healthy' ? 'Todos os sistemas operacionais' : 'Um ou mais sistemas com problemas';
  const overallStatusColor = healthReport?.status === 'healthy' ? 'text-green-700' : 'text-orange-600';

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold text-gray-700 mb-1">Diagnóstico de Serviços</h2>
      {healthReport && (
         <p className={`text-sm font-semibold mb-3 ${overallStatusColor}`}>{overallStatusText}</p>
      )}
      {renderStatus()}
      {healthReport && (
        <p className="text-xs text-gray-400 mt-3 text-right">
          Última verificação: {new Date(healthReport.timestamp).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};

// --- Componente Principal ---
function SystemLogs() {
  const [stdout, setStdout] = useState('Aguardando logs do servidor...');
  const [stderr, setStderr] = useState('Aguardando logs do servidor...');

  useEffect(() => {
    const unsubscribe = subscribeToEvent('LOG_DATA', (payload) => {
      const { source, content } = payload;
      if (source === 'stdout') {
        setStdout(content || ' '); // Evita que o estado seja nulo
      } else if (source === 'stderr') {
        setStderr(content || ' '); // Evita que o estado seja nulo
      }
    });

    // A função de limpeza retornada pelo useEffect cuidará do cancelamento da inscrição
    return () => {
      unsubscribe();
    };
  }, []); // O array vazio garante que a inscrição seja feita apenas uma vez

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Status do Sistema</h1>
        <p className="text-sm text-gray-500 mt-1">
          Diagnóstico de serviços e logs do sistema em tempo real.
        </p>
      </header>

      {/* Painel de Health Check */}
      <HealthCheck />

      {/* Painel de Logs */}
      <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Logs em Tempo Real</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-3">Saída Padrão (stdout)</h3>
          <pre className="bg-gray-900 text-white text-sm p-4 rounded-md overflow-auto h-96">
            <code>
              {stdout}
            </code>
          </pre>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-red-700 border-b pb-2 mb-3">Erros (stderr)</h3>
          <pre className="bg-red-50 text-red-800 text-sm p-4 rounded-md overflow-auto h-96">
            <code>
              {stderr}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}

export default SystemLogs;
