'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/src/lib/api';
import { setTokens } from '@/src/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    const data = await api.post('/register/', { username, password });
    if (data.access) {
      setTokens(data.access, data.refresh);
      router.push('/dashboard');
    } else {
      setError(data.username?.[0] || 'Erro ao criar conta');
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
          className="w-full bg-gray-700 text-white p-3 rounded mb-6 outline-none"
        />
        <button
          onClick={handleRegister}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded font-bold"
        >
          Registar
        </button>
        <p className="text-gray-400 mt-4 text-center">
          Já tens conta?{' '}
          <a href="/login" className="text-indigo-400 hover:underline">Entrar</a>
        </p>
      </div>
    </div>
  );
}