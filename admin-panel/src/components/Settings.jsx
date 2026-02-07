import React, { useState, useEffect, useRef } from 'react';
import { getSettings, updateSettings, uploadImage } from '../services/api';
import { toast } from 'react-toastify';

const Settings = () => {
  const [settings, setSettings] = useState({
    restaurant_name: '',
    menu_theme: 'default',
    tables_count: 20,
    open_time: '09:00',
    close_time: '22:00',
    screen_lock_enabled: false,
    screen_lock_pin: '',
    // Novas configurações
    currency_symbol: 'R$',
    default_prep_time: 20,
    cancellation_window: 5,
    restaurant_logo_url: '',
    primary_color: '#4f46e5',
    enable_ai_chat: true,
    enable_customer_ratings: true,
    enable_ads_module: true,
    default_language: 'pt',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSettings();
        // Mescla as configurações do backend com as padrões para garantir que todos os campos existam
        setSettings(prev => ({ ...prev, ...data }));
      } catch (error) {
        toast.error('Falha ao carregar as configurações.');
      } finally {
        setIsFetching(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await uploadImage(file);
      // Assumindo que a API retorna um objeto com a propriedade `path`
      // e que o backend serve a pasta `uploads` na raiz.
      const logoUrl = response.path;
      setSettings(prev => ({ ...prev, restaurant_logo_url: logoUrl }));
      toast.success('Logo atualizada com sucesso!');
    } catch (error) {
      toast.error('Falha no upload da logo. Verifique o tamanho e tipo do arquivo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateSettings(settings);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar as configurações.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div className="p-6">Carregando configurações...</div>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Configurações</h1>
      <form onSubmit={handleSave} className="space-y-10">

        {/* Configurações Gerais */}
        <div className="bg-white p-8 rounded-lg shadow-md max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 border-b pb-4">Geral</h2>
          <div className="space-y-6">
            <div>
              <label htmlFor="restaurant_name" className="block text-sm font-medium text-gray-700">Nome do Restaurante</label>
              <input type="text" id="restaurant_name" name="restaurant_name" value={settings.restaurant_name || ''} onChange={handleChange} className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Digite o nome do seu restaurante" autoComplete="organization" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="open_time" className="block text-sm font-medium text-gray-700">Horário de Abertura</label>
                <input type="time" id="open_time" name="open_time" value={settings.open_time || '09:00'} onChange={handleChange} className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="close_time" className="block text-sm font-medium text-gray-700">Horário de Fechamento</label>
                <input type="time" id="close_time" name="close_time" value={settings.close_time || '22:00'} onChange={handleChange} className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Configurações Operacionais */}
        <div className="bg-white p-8 rounded-lg shadow-md max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 border-b pb-4">Operacional</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="currency_symbol" className="block text-sm font-medium text-gray-700">Símbolo da Moeda</label>
              <input type="text" id="currency_symbol" name="currency_symbol" value={settings.currency_symbol || 'R$'} onChange={handleChange} className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" autoComplete="off" />
            </div>
            <div>
              <label htmlFor="default_prep_time" className="block text-sm font-medium text-gray-700">Preparo Padrão (min)</label>
              <input type="number" id="default_prep_time" name="default_prep_time" min="1" value={settings.default_prep_time || 15} onChange={handleChange} className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="cancellation_window" className="block text-sm font-medium text-gray-700">Cancelamento (min)</label>
              <input type="number" id="cancellation_window" name="cancellation_window" min="0" value={settings.cancellation_window || 5} onChange={handleChange} className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="default_language" className="block text-sm font-medium text-gray-700">Idioma Padrão (App Cliente)</label>
              <select id="default_language" name="default_language" value={settings.default_language || 'pt'} onChange={handleChange} className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="pt">🇵🇹 Português</option>
                <option value="en">🇺🇸 English</option>
              </select>
            </div>
          </div>
        </div>

        {/* Personalização e Marca */}
        <div className="bg-white p-8 rounded-lg shadow-md max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 border-b pb-4">Personalização e Marca</h2>
          <div className="space-y-6">

            <div>
              <label className="block text-sm font-medium text-gray-700">Logo do Restaurante</label>
              <div className="mt-2 flex items-center gap-6">
                <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center border overflow-hidden">
                  {settings.restaurant_logo_url ? (
                    <img src={settings.restaurant_logo_url.startsWith('http') ? settings.restaurant_logo_url : `${import.meta.env.VITE_API_URL.replace('/api', '')}${settings.restaurant_logo_url}`} alt="Logo Preview" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-500">Sem Logo</span>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handleLogoUpload} ref={fileInputRef} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current.click()} disabled={isUploading} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-300 disabled:opacity-50">
                  {isUploading ? 'Enviando...' : 'Alterar Logo'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="menu_theme" className="block text-sm font-medium text-gray-700">Tema do Cardápio</label>
                <select id="menu_theme" name="menu_theme" value={settings.menu_theme || 'default'} onChange={handleChange} className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="default">Padrão</option>
                  <option value="dark">Escuro</option>
                  <option value="brand">Marca</option>
                </select>
              </div>
              <div>
                <label htmlFor="primary_color" className="block text-sm font-medium text-gray-700">Cor Primária do Tema</label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" id="primary_color" name="primary_color" value={settings.primary_color || '#4f46e5'} onChange={handleChange} className="w-10 h-10 p-0 border-none rounded-lg cursor-pointer" />
                  <label htmlFor="primary_color_hex" className="sr-only">Valor Hexadecimal da Cor Primária</label>
                  <input type="text" id="primary_color_hex" value={settings.primary_color || '#4f46e5'} onChange={handleChange} name="primary_color" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ativação de Módulos */}
        <div className="bg-white p-8 rounded-lg shadow-md max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 border-b pb-4">Módulos e Funcionalidades</h2>
          <div className="space-y-4">
            <label htmlFor="enable_ai_chat" className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <span className="font-medium text-gray-800">Ativar Chat com IA</span>
              <input id="enable_ai_chat" type="checkbox" name="enable_ai_chat" checked={!!settings.enable_ai_chat} onChange={handleChange} className="toggle-checkbox" />
            </label>
            <label htmlFor="enable_customer_ratings" className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <span className="font-medium text-gray-800">Ativar Avaliações de Pratos</span>
              <input id="enable_customer_ratings" type="checkbox" name="enable_customer_ratings" checked={!!settings.enable_customer_ratings} onChange={handleChange} className="toggle-checkbox" />
            </label>
            <label htmlFor="enable_ads_module" className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <span className="font-medium text-gray-800">Ativar Módulo de Anúncios</span>
              <input id="enable_ads_module" type="checkbox" name="enable_ads_module" checked={!!settings.enable_ads_module} onChange={handleChange} className="toggle-checkbox" />
            </label>
          </div>
        </div>

        {/* Segurança */}
        <div className="bg-white p-8 rounded-lg shadow-md max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 border-b pb-4">Segurança</h2>
          <div className="space-y-4">
            <label htmlFor="screen_lock_enabled" className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <span className="font-medium text-gray-800">Ativar bloqueio de tela</span>
              <input id="screen_lock_enabled" type="checkbox" name="screen_lock_enabled" checked={!!settings.screen_lock_enabled} onChange={handleChange} className="toggle-checkbox" />
            </label>
            {!!settings.screen_lock_enabled && (
              <div className="pl-4 pt-2">
                <label htmlFor="screen_lock_pin" className="block text-sm font-medium text-gray-700">PIN de desbloqueio (4-6 dígitos)</label>
                <input type="password" inputMode="numeric" pattern="[0-9]{4,6}" id="screen_lock_pin" name="screen_lock_pin" value={settings.screen_lock_pin || ''} onChange={handleChange} className="mt-1 w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Defina o PIN" autoComplete="one-time-code" />
              </div>
            )}
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="max-w-3xl mx-auto text-right">
          <button type="submit" disabled={isLoading} className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-indigo-700 transition-colors duration-300 disabled:opacity-50">
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default Settings;
