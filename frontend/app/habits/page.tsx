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

export default function HabitsPage() {
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const data = await api.get('/habits/');
      if (Array.isArray(data)) setHabits(data);
    } catch {
      setError('Erro ao carregar a lista de hábitos.');
    }
  };

  const addHabit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError('');

    try {
      await api.post('/habits/', { name });
      setName('');
      await fetchHabits();
    } catch {
      setError('Erro ao adicionar hábito.');
    } finally {
      setLoading(false);
    }
  };

  const toggleHabit = async (habit: Habit) => {
    try {
      // Alterna o estado local para resposta instantânea
      const updatedStatus = !habit.completed_today;
      setHabits((prev) =>
        prev.map((h) => (h.id === habit.id ? { ...h, completed_today: updatedStatus } : h))
      );
      
      await api.put(`/habits/${habit.id}/`, {
        name: habit.name,
        completed_today: updatedStatus,
      });
    } catch {
      setError('Erro ao atualizar hábito.');
      await fetchHabits(); // Reverte em caso de erro
    }
  };

  const deleteHabit = async (id: number) => {
    try {
      await api.delete(`/habits/${id}/`);
      await fetchHabits();
    } catch {
      setError('Erro ao eliminar hábito.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm mb-2 block">
              ← Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Hábitos</h1>
          </div>
          <button
            onClick={() => {
              clearTokens();
              router.push('/login');
            }}
            className="text-sm text-gray-400 hover:text-white"
          >
            Sair
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-4">Novo Hábito</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Ex: Beber água, Ler 10 págs..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addHabit()}
              className="flex-1 bg-gray-700 text-white p-3 rounded outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={addHabit}
              disabled={loading || !name.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded font-bold transition-colors"
            >
              {loading ? 'A adicionar...' : 'Adicionar'}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {habits.length === 0 && (
            <p className="text-gray-400 text-center py-4">Nenhum hábito criado. Define o primeiro!</p>
          )}
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="bg-gray-800 p-4 rounded-lg flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleHabit(habit)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-between justify-center transition-colors ${
                    habit.completed_today
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-gray-500 hover:border-emerald-400'
                  }`}
                >
                  {habit.completed_today && '✓'}
                </button>
                <span className={habit.completed_today ? 'line-through text-gray-400' : 'font-medium'}>
                  {habit.name}
                </span>
              </div>
              <button
                onClick={() => deleteHabit(habit.id)}
                className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}