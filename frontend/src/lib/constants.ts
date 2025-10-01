// API and WebSocket URL constants
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// WebSocket base URL derived from API_BASE_URL
export const WS_BASE_URL = API_BASE_URL.replace('http', 'ws');

// API endpoint paths (relative to API_BASE_URL)
export const API_ENDPOINTS = {
  AUTH_BASE: '/auth',
  WS_LOGS: '/ws/logs',
  WS_HA: '/ws/ha',
  WS_CONTAINERS_MIGRATE: '/ws/containers/migrate',
} as const;

// Authentication provider endpoints
export const AUTH_ENDPOINTS = {
  GOOGLE: '/auth/google',
  GITHUB: '/auth/github',
  DISCORD: '/auth/discord',
} as const;

// Full WebSocket URLs (combining WS_BASE_URL with paths)
export const WS_URLS = {
  LOGS: `${WS_BASE_URL}${API_ENDPOINTS.WS_LOGS}`,
  HA: `${WS_BASE_URL}${API_ENDPOINTS.WS_HA}`,
  CONTAINERS_MIGRATE: `${WS_BASE_URL}${API_ENDPOINTS.WS_CONTAINERS_MIGRATE}`,
} as const;

// Full authentication URLs (combining API_BASE_URL with auth paths)
export const AUTH_URLS = {
  GOOGLE: `${API_BASE_URL}${AUTH_ENDPOINTS.GOOGLE}`,
  GITHUB: `${API_BASE_URL}${AUTH_ENDPOINTS.GITHUB}`,
  DISCORD: `${API_BASE_URL}${AUTH_ENDPOINTS.DISCORD}`,
} as const;