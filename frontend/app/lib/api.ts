// Garante que a URL base não termina com barra e remove eventuais colchetes/espaços indesejados
const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const API_URL = rawUrl.replace(/[\[\]]/g, '').replace(/\/$/, '');

export const api = {
  async post(endpoint: string, data: object, token?: string) {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Garante que o endpoint começa com barra
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