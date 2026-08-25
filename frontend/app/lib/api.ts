import { getToken, getRefresh, setTokens, clearTokens } from './auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sisyphus-tracker.onrender.com';

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  let token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(url, { ...options, headers });

  // Se o token expirou (401), tenta renovar usando getRefresh()
  if (response.status === 401 && getRefresh()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getToken()}`;
      response = await fetch(url, { ...options, headers });
    } else {
      clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Sessão expirada');
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw errorData;
  }

  if (response.status === 204) return null;
  return response.json();
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = getRefresh();
    if (!refreshToken) return false;

    const res = await fetch(`${BASE_URL}/api/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (res.ok) {
      const data = await res.json();
      setTokens(data.access, refreshToken);
      return true;
    }
  } catch {
    // Falha silenciosa na renovação
  }
  return false;
}

export const api = {
  get: (endpoint: string) => request(endpoint, { method: 'GET' }),
  post: (endpoint: string, body: any) =>
    request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint: string, body: any) =>
    request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint: string) => request(endpoint, { method: 'DELETE' }),
};