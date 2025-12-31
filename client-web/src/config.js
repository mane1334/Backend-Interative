// Vite exposes env via import.meta.env. Use try/catch to stay compatible in non-Vite contexts.
let VITE_API = null;
let VITE_BASE = null;
try {
  VITE_API = import.meta.env && import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : null;
  VITE_BASE = import.meta.env && import.meta.env.VITE_BASE_URL ? import.meta.env.VITE_BASE_URL : null;
} catch (_) {}

// Função para detectar automaticamente o IP da máquina
const getDefaultBase = () => {
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Se estiver em localhost, tenta detectar o IP real da máquina
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Em desenvolvimento, usa o hostname atual mas com porta do backend
      return `${protocol}//${hostname}:3000`;
    }
    
    // Se não for localhost, usa o hostname atual
    return `${protocol}//${hostname}:3000`;
  }
  
  return 'http://localhost:3000';
};

const DEFAULT_BASE = getDefaultBase();
const BASE_URL = VITE_BASE || DEFAULT_BASE;
const API_URL = VITE_API || `${BASE_URL}/api`;

// Log para debug
console.log('🔧 Configuração da API:', { BASE_URL, API_URL });

export { API_URL, BASE_URL };


