// Limpa colchetes, espaços, barras finais e /api duplicado
const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const API_URL = rawUrl
  .replace(/[\[\]]/g, '')
  .trim()
  .replace(/\/$/, '')
  .replace(/\/api$/, '');

export const api = {
  async post(endpoint: string, data: object, token?: string) {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    const res = await fetch(`${API_URL}/api${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Erro na requisição: ${res.status}`);
    }

    return res.json();
  },

  async get(endpoint: string, token?: string) {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    const res = await fetch(`${API_URL}/api${path}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      throw new Error(`Erro na requisição: ${res.status}`);
    }

    return res.json();
  },

  async delete(endpoint: string, token?: string) {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    const res = await fetch(`${API_URL}/api${path}`, {
      method: 'DELETE',
      headers,
    });

    if (!res.ok) {
      throw new Error(`Erro na requisição: ${res.status}`);
    }

    return res.status;
  },
};