// Utilities for handling image URLs and placeholders in client-web

import { BASE_URL } from '../config';
// Use only the origin (protocol+host+port) of the backend to build absolute image URLs
let API_ORIGIN = '';
try {
  API_ORIGIN = new URL(BASE_URL, window.location.origin).origin;
} catch (_) {
  API_ORIGIN = '';
}

export const PLACEHOLDER_IMG = 'https://via.placeholder.com/96?text=%20';

// Returns a valid absolute URL for the image
export function resolveImageUrl(path) {
  if (!path) return '';
  try {
    // If it's already absolute, return as-is
    const url = new URL(path);
    return url.toString();
  } catch (_) {
    // If it's relative, prefix with the API origin (no path suffixes)
    if (!API_ORIGIN) return path; // safe fallback
    if (path.startsWith('/')) {
      return `${API_ORIGIN}${path}`;
    }
    return `${API_ORIGIN}/${path}`;
  }
}

