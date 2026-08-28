'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/app/lib/api';
import { setTokens } from '@/app/lib/auth';

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
        router.replace('/dashboard');
        return;
      }
      setError('Utilizador ou palavra-passe incorretos.');
    } catch {
      setError('Não foi possível ligar ao servidor. Tenta outra vez.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-[#0b0d10] border border-[#26303f] text-[#e8e8e6] px-3 py-3 rounded-md text-sm outline-none focus:border-[#639922] transition-colors';

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#e8e8e6] flex flex-col">
      <header className="border-b border-[#1c1f26]">
        <div className="max-w-4xl mx-auto px-8 h-16 flex items-center">
          <Link href="/" className="text-xl font-medium tracking-tight text-white">
            SisyphusTracker
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-medium tracking-tight text-white">Entrar</h1>
          <p className="text-sm text-[#7d7d78] mt-1.5">Continua de onde ficaste.</p>

          {error && (
            <div className="border border-[#7a2c2c] bg-[#7a2c2c]/10 text-[#f09595] p-3 rounded-lg text-sm mt-6">
              {error}
            </div>
          )}

          <div className="mt-8 space-y-4">
            <div>
              <label className="text-xs text-[#7d7d78] block mb-1.5">Utilizador</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className={inputClass}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="text-xs text-[#7d7d78] block mb-1.5">Palavra-passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className={inputClass}
                autoComplete="current-password"
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading || !username.trim() || !password}
              className="w-full bg-[#639922] hover:bg-[#97C459] disabled:opacity-40 text-[#173404] py-3 rounded-md font-medium text-sm transition-colors"
            >
              {loading ? 'A entrar' : 'Entrar'}
            </button>
          </div>

          <p className="text-sm text-[#7d7d78] mt-8 text-center">
            Ainda não tens conta?{' '}
            <Link href="/register" className="text-[#97C459] hover:text-[#639922] transition-colors">
              Criar conta
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
