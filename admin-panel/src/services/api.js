
import axios from 'axios';

// Lê a URL da API do arquivo .env, com detecção automática do IP
const getDefaultAPIUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    // Se estiver em localhost, tenta detectar o IP real da máquina
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:3000/api`;
    }

    // Se não for localhost, usa o hostname atual
    return `${protocol}//${hostname}:3000/api`;
  }

  return 'http://localhost:3000/api';
};

const API_URL = import.meta.env.VITE_API_URL || getDefaultAPIUrl();

// Log para debug
console.log('🔧 Admin Panel - Configuração da API:', API_URL);

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para tratar respostas e erros de forma centralizada
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Você pode adicionar uma lógica de notificação de erro aqui (ex: usando react-toastify)
    console.error('API Error:', error.response?.data?.error || error.message);
    return Promise.reject(error);
  }
);

// --- Settings ---
export const getSettings = () => apiClient.get('/settings');
export const updateSettings = (settingsData) => apiClient.put('/settings', settingsData);

// --- Categories ---
export const getCategories = () => apiClient.get('/categories');
export const createCategory = (data) => apiClient.post('/categories', data);
export const updateCategory = (id, data) => apiClient.put(`/categories/${id}`, data);
export const deleteCategory = (id) => apiClient.delete(`/categories/${id}`);

// --- Dishes ---
export const getDishes = () => apiClient.get('/dishes');
export const createDish = (dishData) => apiClient.post('/dishes', dishData);
export const updateDish = (id, dishData) => apiClient.put(`/dishes/${id}`, dishData);
export const deleteDish = (id) => apiClient.delete(`/dishes/${id}`);

// --- Orders ---
export const getOrders = (filters = {}) => apiClient.get('/orders', { params: filters });
export const updateOrderStatus = (id, status) => apiClient.put(`/orders/${id}/status`, { status });

// --- Analytics ---
export const getAnalytics = () => apiClient.get('/analytics');

// --- Ads ---
export const getAds = () => apiClient.get('/ads');
export const createAd = (adData) => apiClient.post('/ads', adData);
export const updateAd = (id, adData) => apiClient.put(`/ads/${id}`, adData);
export const deleteAd = (id) => apiClient.delete(`/ads/${id}`);

// --- Ratings ---
export const getRatings = () => apiClient.get('/ratings');
export const getRatingsSummary = () => apiClient.get('/ratings/summary');

// --- Uploads ---
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// --- Database Management ---
export const getDatabaseStatus = () => apiClient.get('/database/status');
export const testDatabaseConnection = (config) => apiClient.post('/database/test', config);
export const setupDatabase = (config) => apiClient.post('/database/setup', config);

export const exportDatabase = async () => {
  try {
    // Usamos o axios puro para ter mais controle sobre a resposta
    const response = await axios.get(`${API_URL}/database/export`, {
      responseType: 'blob', // Importante para receber o arquivo
    });

    // Cria um link temporário para forçar o download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    const today = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `backup-${today}.sql`);

    document.body.appendChild(link);
    link.click();

    // Limpa o link e o objeto URL
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Erro ao exportar banco de dados:', error);
    // Tenta ler o erro do blob, caso o backend tenha enviado um JSON de erro
    if (error.response && error.response.data) {
      try {
        const errorText = await error.response.data.text();
        const errorJson = JSON.parse(errorText);
        return Promise.reject(errorJson);
      } catch (e) {
        return Promise.reject({ message: 'Ocorreu um erro desconhecido durante o download.' });
      }
    }
    return Promise.reject(error);
  }
};

export const importDatabase = (formData) => {
  return apiClient.post('/database/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export default apiClient;
