import { BASE_URL } from '../config';

/**
 * Resolves a full image URL from a given path.
 * If the path is relative (e.g. starts with /), it prepends the baseUrl.
 * If the path is absolute (http/https), it returns it as is.
 * If path is null/undefined, returns the fallback placeholder.
 * @param path - The image path from the API
 * @param baseUrl - Optional base URL override (e.g., from dynamic serverIp)
 */
export const resolveImageUrl = (path: string | null | undefined, baseUrl?: string): string => {
    const base = baseUrl || BASE_URL;
    if (!path) return 'https://via.placeholder.com/300';

    // Se o path já for absoluto (tem http/https)
    if (path.startsWith('http')) {
        // CORREÇÃO CRÍTICA: Se o banco retornar localhost/127.0.0.1, substituímos pelo IP correto
        if (path.includes('localhost') || path.includes('127.0.0.1')) {
            return path.replace('localhost', base.replace(/^http:\/\//, '').replace(/:\d+$/, '').split('/')[0])
                .replace('127.0.0.1', base.replace(/^http:\/\//, '').replace(/:\d+$/, '').split('/')[0])
                .replace(/http:\/\/[^:]+(:\d+)?/, base); // Fallback mais agressivo: troca toda a origem
        }
        return path;
    }

    if (path.startsWith('/')) return `${base}${path}`;
    return `${base}/${path}`; // Handle paths without leading slash
};
