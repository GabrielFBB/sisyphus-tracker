const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api = {
  async post(endpoint: string, data: object, token?: string) {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async get(endpoint: string, token?: string) {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });
    return res.json();
  },

  async delete(endpoint: string, token?: string) {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    return res.status;
  },
};