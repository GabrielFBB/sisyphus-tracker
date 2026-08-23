'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/app/lib/api';
import { setTokens } from '@/app/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await api.post('/register/', { username, password });
      if (data.access) {
        setTokens(data.access, data.refresh);
        router.push('/dashboard');
        return;
      }
      setError(data.username?.[0] || 'Erro ao criar conta');
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
        <p className="text-gray-400 mb-6">Cria a tua conta</p>

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
          onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
          className="w-full bg-gray-700 text-white p-3 rounded mb-6 outline-none"
        />
        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-3 rounded font-bold"
        >
          {loading ? 'A criar conta...' : 'Registar'}
        </button>
        <p className="text-gray-400 text-sm mt-4 text-center">
          Já tens conta?{' '}
          <Link href="/login" className="text-indigo-400 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}