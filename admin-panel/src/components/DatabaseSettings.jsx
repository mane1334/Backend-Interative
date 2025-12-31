import React, { useState, useEffect, useRef } from 'react';
import { getDatabaseStatus, testDatabaseConnection, setupDatabase, exportDatabase, importDatabase } from '../services/api';
import { toast } from 'react-toastify';

// Helper function to format bytes
const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const DatabaseSettings = () => {
  const [dbConfig, setDbConfig] = useState({
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: 'restaurantes',
    username: 'postgres',
    password: '',
    ssl: false
  });
  
  const [dbStatus, setDbStatus] = useState({
    connected: false,
    type: 'unknown',
    error: null,
    tables: [],
    size: null,
    rowCounts: [],
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [backupFile, setBackupFile] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    setIsLoading(true);
    try {
      const status = await getDatabaseStatus();
      setDbStatus(status);
      if (status.config) {
        setDbConfig(prev => ({ ...prev, ...status.config }));
      }
      toast.success('Status do banco de dados atualizado!');
    } catch (error) {
      console.error('Erro ao verificar status do banco:', error);
      toast.error('Falha ao buscar status do banco de dados.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDbConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const result = await testDatabaseConnection(dbConfig);
      if (result.success) {
        toast.success('✅ Conexão com banco de dados bem-sucedida!');
        setDbStatus(prev => ({ ...prev, connected: true, error: null }));
      } else {
        toast.error(`❌ Falha na conexão: ${result.error}`);
        setDbStatus(prev => ({ ...prev, connected: false, error: result.error }));
      }
    } catch (error) {
      toast.error('❌ Erro ao testar conexão');
      setDbStatus(prev => ({ ...prev, connected: false, error: error.message }));
    } finally {
      setIsTesting(false);
    }
  };

  const handleSetupDatabase = async () => {
    setIsSettingUp(true);
    try {
      const result = await setupDatabase(dbConfig);
      if (result.success) {
        toast.success('🎉 Banco de dados configurado com sucesso!');
        await checkDatabaseStatus();
      } else {
        toast.error(`❌ Erro na configuração: ${result.error}`);
      }
    } catch (error) {
      toast.error('❌ Erro ao configurar banco de dados');
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportDatabase();
      toast.success('🚀 Exportação iniciada! O download começará em breve.');
    } catch (error) {
      toast.error(error.error || 'Falha ao exportar o banco de dados.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e) => {
    setBackupFile(e.target.files[0]);
  };

  const handleImport = async () => {
    if (!backupFile) {
      toast.warn('Por favor, selecione um arquivo de backup.');
      return;
    }

    const confirmed = window.confirm(
      '⚠️ ATENÇÃO! ⚠️\n\nEsta ação irá sobrescrever COMPLETAMENTE o banco de dados atual. Todos os dados existentes serão perdidos.\n\nTem certeza de que deseja continuar?'
    );

    if (confirmed) {
      setIsImporting(true);
      const formData = new FormData();
      formData.append('backupFile', backupFile);

      try {
        const result = await importDatabase(formData);
        toast.success(result.message || 'Banco de dados importado com sucesso!');
        if(fileInputRef.current) fileInputRef.current.value = "";
        setBackupFile(null);
        setTimeout(checkDatabaseStatus, 2000);
      } catch (error) {
        toast.error(error.response?.data?.error || 'Falha ao importar o banco de dados.');
      } finally {
        setIsImporting(false);
      }
    }
  };

  const getStatusColor = () => {
    if (dbStatus.connected) return 'text-green-600 bg-green-100';
    if (dbStatus.error) return 'text-red-600 bg-red-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  const getStatusText = () => {
    if (dbStatus.connected) return '✅ Conectado';
    if (dbStatus.error) return '❌ Erro de Conexão';
    return '⚠️ Desconhecido';
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Configuração do Banco de Dados</h1>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </div>
          </div>

          {/* Status do Banco */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Status Atual</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-sm text-gray-600">Tipo:</span>
                <p className="font-medium">{dbStatus.type || 'Não configurado'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Conexão:</span>
                <p className="font-medium">{dbStatus.connected ? 'Ativa' : 'Inativa'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Tamanho:</span>
                <p className="font-medium">{formatBytes(dbStatus.size)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Tabelas:</span>
                <p className="font-medium">{dbStatus.tables?.length || 0} encontradas</p>
              </div>
            </div>
            {dbStatus.rowCounts && dbStatus.rowCounts.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Registros nas Tabelas Principais:</h4>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {dbStatus.rowCounts.map(({table, count}) => (
                            <div key={table} className="text-sm">
                                <span className="font-semibold capitalize">{table}:</span>
                                <span className="text-gray-600 ml-1">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {dbStatus.error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-red-700 text-sm">{dbStatus.error}</p>
              </div>
            )}
          </div>

          {/* Backup e Restauração */}
          <div className="mb-8 p-4 bg-indigo-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-indigo-800">Backup e Restauração</h3>
            <div className="grid md:grid-cols-2 gap-6 items-center">
                <div>
                    <p className="text-indigo-700 mb-2 text-sm">Exporte o banco de dados atual como um arquivo .sql.</p>
                    <button
                      onClick={handleExport}
                      disabled={isExporting || isImporting}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 w-full md:w-auto"
                    >
                      {isExporting ? 'Exportando...' : 'Exportar Dados'}
                    </button>
                </div>
                <div>
                    <p className="text-indigo-700 mb-2 text-sm">Importe um arquivo .sql para restaurar o banco de dados.</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input 
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".sql"
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200"
                        />
                        <button
                          onClick={handleImport}
                          disabled={!backupFile || isImporting || isExporting}
                          className="bg-indigo-800 text-white px-4 py-2 rounded-lg hover:bg-indigo-900 disabled:opacity-50 flex-shrink-0"
                        >
                          {isImporting ? 'Importando...' : 'Importar'}
                        </button>
                    </div>
                </div>
            </div>
          </div>

          {/* Configuração Manual */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Configuração Manual</h3>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {showAdvanced ? 'Ocultar' : 'Mostrar'} Opções
              </button>
            </div>

            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Banco</label>
                  <select name="type" value={dbConfig.type} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="postgresql">PostgreSQL</option>
                    <option value="sqlite">SQLite (Local)</option>
                    <option value="mysql">MySQL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Host</label>
                  <input type="text" name="host" value={dbConfig.host} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="localhost" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Porta</label>
                  <input type="number" name="port" value={dbConfig.port} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="5432" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Banco</label>
                  <input type="text" name="database" value={dbConfig.database} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="restaurantes" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Usuário</label>
                  <input type="text" name="username" value={dbConfig.username} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="postgres" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
                  <input type="password" name="password" value={dbConfig.password} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
                </div>

                <div className="flex items-center">
                  <input type="checkbox" name="ssl" checked={dbConfig.ssl} onChange={handleChange} className="mr-2" />
                  <label className="text-sm text-gray-700">Usar SSL</label>
                </div>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleTestConnection}
              disabled={isTesting || isSettingUp || isLoading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isTesting ? 'Testando...' : 'Testar Conexão'}
            </button>

            <button
              onClick={handleSetupDatabase}
              disabled={!dbStatus.connected || isSettingUp || isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSettingUp ? 'Salvando...' : 'Salvar e Aplicar'}
            </button>

            <button
              onClick={checkDatabaseStatus}
              disabled={isLoading}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {isLoading ? 'Atualizando...' : 'Atualizar Status'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSettings;
