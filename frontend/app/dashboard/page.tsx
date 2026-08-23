'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { clearTokens, isAuthenticated } from '@/src/lib/auth';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    clearTokens();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">SisyphusTracker</h1>
            <p className="text-gray-400 mt-1">Empurra a pedra todos os dias</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white"
          >
            Sair
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/workout"
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">Workout</h2>
            <p className="text-gray-400 text-sm">Regista os teus treinos</p>
          </Link>

          <Link
            href="/reading"
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">Reading</h2>
            <p className="text-gray-400 text-sm">Lista de livros</p>
          </Link>

          <Link
            href="/habits"
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">Habits</h2>
            <p className="text-gray-400 text-sm">Hábitos diários</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
