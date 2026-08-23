'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { api } from '@/src/lib/api';
import { setTokens } from '@/src/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const data = await api.post('/token/', { username, password });

      if (data.access) {
        setTokens(data.access, data.refresh);
        router.push('/dashboard');
        return;
      }

      setError(data.detail || 'Credenciais inválidas');
    } catch {
      setError('Erro ao ligar ao servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-2">SisyphusTracker</h1>
        <p className="text-gray-400 mb-6">Entra na tua conta</p>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-gray-700 text-white p-3 rounded mb-3 outline-none"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          className="w-full bg-gray-700 text-white p-3 rounded mb-6 outline-none"
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-3 rounded font-bold"
        >
          {loading ? 'A entrar...' : 'Entrar'}
        </button>

        <p className="text-gray-400 text-sm mt-4 text-center">
          Ainda não tens conta?{' '}
          <Link href="/register" className="text-indigo-400 hover:underline">
            Registar
          </Link>
        </p>
      </div>
    </div>
  );
}
