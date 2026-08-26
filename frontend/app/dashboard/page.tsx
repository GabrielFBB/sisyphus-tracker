'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/app/lib/api';
import { getToken, clearTokens } from '@/app/lib/auth';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    habitsCount: 0,
    readingsCount: 0,
    workoutsCount: 0,
  });

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      const [habits, readings, workouts] = await Promise.all([
        api.get('/habits/').catch(() => []),
        api.get('/readings/').catch(() => []),
        api.get('/workouts/').catch(() => []),
      ]);

      setStats({
        habitsCount: Array.isArray(habits) ? habits.length : 0,
        readingsCount: Array.isArray(readings) ? readings.length : 0,
        workoutsCount: Array.isArray(workouts) ? workouts.length : 0,
      });
    } catch {
      // Falha silenciosa
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearTokens();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="animate-pulse text-indigo-400 font-medium">A carregar o seu santuário...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              SisyphusTracker
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-white transition-colors bg-gray-800 px-3 py-1.5 rounded-md border border-gray-700"
          >
            Terminar Sessão
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Painel de Controlo</h1>
            <p className="text-gray-400 text-sm mt-1">Registe os seus passos diários rumo à consistência.</p>
          </div>
          <div className="text-xs text-indigo-300 bg-indigo-950/60 border border-indigo-800/50 px-3 py-2 rounded-lg">
            "É preciso imaginar Sísifo feliz." — Albert Camus
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/habits" className="group bg-gray-900 border border-gray-800 hover:border-indigo-500/50 p-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover:scale-110 transition-transform">
                  ⚡
                </span>
                <span className="text-2xl font-bold font-mono text-gray-200">{stats.habitsCount}</span>
              </div>
              <h2 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">Hábitos Diários</h2>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Controlo de rotinas e micro-ações diárias para criar consistência mecânica.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">
              Gerir hábitos →
            </div>
          </Link>

          <Link href="/reading" className="group bg-gray-900 border border-gray-800 hover:border-emerald-500/50 p-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:scale-110 transition-transform">
                  📚
                </span>
                <span className="text-2xl font-bold font-mono text-gray-200">{stats.readingsCount}</span>
              </div>
              <h2 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">Leituras & Livros</h2>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Acompanhamento de páginas, obras literárias e progresso de leitura.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
              Ver leituras →
            </div>
          </Link>

          <Link href="/workout" className="group bg-gray-900 border border-gray-800 hover:border-purple-500/50 p-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg group-hover:scale-110 transition-transform">
                  🏋️
                </span>
                <span className="text-2xl font-bold font-mono text-gray-200">{stats.workoutsCount}</span>
              </div>
              <h2 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">Treinos & Cargas</h2>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Registo de sessões físicas, séries, repetições e progressão de carga.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-semibold text-purple-400 group-hover:translate-x-1 transition-transform">
              Registar treino →
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
