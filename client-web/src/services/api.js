
import axios from 'axios';
import { API_URL } from '../config';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Lógica centralizada de tratamento de erro
    return Promise.reject(error);
  }
);

export const getMenu = () => apiClient.get('/menu');
export const postOrder = (order) => apiClient.post('/orders', order);
export const cancelOrder = (orderId) => apiClient.post(`/orders/${orderId}/cancel`);
export const callWaiter = (tableNumber) => apiClient.post('/call-waiter', { table_number: tableNumber });
export const getAds = () => apiClient.get('/ads');
export const sendChatMessage = (message) => apiClient.post('/chat', { message });

// Função para buscar as configurações
export const getSettings = () => apiClient.get('/settings');

// --- Ratings ---
export const submitRating = (ratingData) => apiClient.post('/ratings', ratingData);

export default apiClient;
