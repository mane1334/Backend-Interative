// Utilitários para lidar com URLs de imagens e placeholders

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
// Usa apenas a origem (protocolo+host+porta) da API para montar URLs absolutas de imagens
let API_ORIGIN = '';
try {
  API_ORIGIN = new URL(API_URL, window.location.origin).origin;
} catch (_) {
  API_ORIGIN = '';
}

export const PLACEHOLDER_IMG = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// Retorna uma URL absoluta válida para a imagem
export function resolveImageUrl(path) {
  if (!path) return '';
  try {
    // Se já for absoluta, retorna como está
    const url = new URL(path);
    return url.toString();
  } catch (_) {
    // Se for relativa, prefixa com a origem da API (sem sufixos de caminho)
    if (!API_ORIGIN) return path; // fallback seguro
    if (path.startsWith('/')) {
      return `${API_ORIGIN}${path}`;
    }
    return `${API_ORIGIN}/${path}`;
  }
}
