'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/app/lib/api';
import { getToken, clearTokens } from '@/app/lib/auth';

interface Habit {
  id: number;
  name: string;
  description: string;
}

export default function HabitsPage() {
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    const token = getToken();
    const data = await api.get('/habits/', token!);
    if (Array.isArray(data)) setHabits(data);
  };

  const addHabit = async () => {
    if (!name) return;
    setLoading(true);
    const token = getToken();
    await api.post('/habits/', { name, description }, token!);
    setName('');
    setDescription('');
    fetchHabits();
    setLoading(false);
  };

  const deleteHabit = async (id: number) => {
    const token = getToken();
    await api.delete(`/habits/${id}/`, token!);
    fetchHabits();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm mb-2 block">← Dashboard</Link>
            <h1 className="text-3xl font-bold">Habits</h1>
          </div>
          <button onClick={() => { clearTokens(); router.push('/login'); }} className="text-sm text-gray-400 hover:text-white">Sair</button>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-4">Novo Hábito</h2>
          <input
            type="text"
            placeholder="Nome do hábito"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-700 text-white p-3 rounded mb-3 outline-none"
          />
          <input
            type="text"
            placeholder="Descrição (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-gray-700 text-white p-3 rounded mb-4 outline-none"
          />
          <button
            onClick={addHabit}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded font-bold"
          >
            {loading ? 'A adicionar...' : 'Adicionar'}
          </button>
        </div>

        <div className="space-y-3">
          {habits.length === 0 && <p className="text-gray-400 text-center">Nenhum hábito ainda. Cria o primeiro!</p>}
          {habits.map((habit) => (
            <div key={habit.id} className="bg-gray-800 p-4 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-semibold">{habit.name}</p>
                {habit.description && <p className="text-gray-400 text-sm">{habit.description}</p>}
              </div>
              <button
                onClick={() => deleteHabit(habit.id)}
                className="text-red-400 hover:text-red-300 text-sm"
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