'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/app/lib/api';
import { getToken, clearTokens } from '@/app/lib/auth';

interface Habit {
  id: number;
  name: string;
  completed_today?: boolean;
}

interface Book {
  id: number;
  title: string;
  author: string;
  current_page: number;
  total_pages: number;
}

interface Workout {
  id: number;
  name: string;
  date: string;
  notes: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [habitsRes, booksRes, workoutsRes] = await Promise.allSettled([
        api.get('/habits/'),
        api.get('/reading/'),
        api.get('/workouts/'),
      ]);

      if (habitsRes.status === 'fulfilled' && Array.isArray(habitsRes.value)) {
        setHabits(habitsRes.value);
      }
      if (booksRes.status === 'fulfilled' && Array.isArray(booksRes.value)) {
        setBooks(booksRes.value);
      }
      if (workoutsRes.status === 'fulfilled' && Array.isArray(workoutsRes.value)) {
        setWorkouts(workoutsRes.value);
      }
    } catch {
      // O api.ts trata o 401 e redireciona se necessário
    } finally {
      setLoading(false);
    }
  };

  const completedHabitsCount = habits.filter((h) => h.completed_today).length;
  const latestWorkout = workouts[0];
  const activeBook = books[0];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">SisyphusTracker</h1>
            <p className="text-gray-400 text-sm mt-1">Visão geral da tua rotina</p>
          </div>
          <button
            onClick={() => {
              clearTokens();
              router.push('/login');
            }}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Sair
          </button>
        </div>

        {loading ? (
          <p className="text-gray-400 text-center py-12">A carregar os teus dados...</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Card Hábitos */}
            <div className="bg-gray-800 p-6 rounded-lg flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Hábitos</h2>
                  <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded">Hoje</span>
                </div>
                <p className="text-3xl font-bold text-emerald-400 mb-1">
                  {completedHabitsCount} / {habits.length}
                </p>
                <p className="text-gray-400 text-sm">concluídos hoje</p>
              </div>
              <Link
                href="/habits"
                className="mt-6 text-sm text-indigo-400 hover:text-indigo-300 font-medium inline-block"
              >
                Gerir hábitos →
              </Link>
            </div>

            {/* Card Treinos */}
            <div className="bg-gray-800 p-6 rounded-lg flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Último Treino</h2>
                  <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded">Treino</span>
                </div>
                {latestWorkout ? (
                  <div>
                    <p className="text-lg font-bold">{latestWorkout.name}</p>
                    <p className="text-gray-400 text-sm">{latestWorkout.date}</p>
                    {latestWorkout.notes && (
                      <p className="text-gray-400 text-xs mt-2 line-clamp-2">{latestWorkout.notes}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Nenhum treino registado.</p>
                )}
              </div>
              <Link
                href="/workout"
                className="mt-6 text-sm text-indigo-400 hover:text-indigo-300 font-medium inline-block"
              >
                Registar treino →
              </Link>
            </div>

            {/* Card Leituras */}
            <div className="bg-gray-800 p-6 rounded-lg flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Leitura Atual</h2>
                  <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded">Livro</span>
                </div>
                {activeBook ? (
                  <div>
                    <p className="text-lg font-bold truncate">{activeBook.title}</p>
                    <p className="text-gray-400 text-sm">{activeBook.author}</p>
                    {activeBook.total_pages > 0 && (
                      <p className="text-indigo-400 text-xs mt-2 font-semibold">
                        Pág. {activeBook.current_page} de {activeBook.total_pages} (
                        {Math.round((activeBook.current_page / activeBook.total_pages) * 100)}%)
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Nenhum livro em leitura.</p>
                )}
              </div>
              <Link
                href="/reading"
                className="mt-6 text-sm text-indigo-400 hover:text-indigo-300 font-medium inline-block"
              >
                Atualizar leituras →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}