'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/app/lib/api';
import { getToken, clearTokens } from '@/app/lib/auth';

interface Exercise {
  id: number;
  name: string;
  sets: number;
  reps: number;
  weight: number | null;
}

interface Workout {
  id: number;
  name: string;
  date: string;
  notes: string;
  exercises: Exercise[];
}

export default function WorkoutPage() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const data = await api.get('/workouts/', token);
      if (Array.isArray(data)) setWorkouts(data);
    } catch {
      setError('Erro ao carregar o histórico de treinos.');
    }
  };

  const addWorkout = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError('');

    try {
      const token = getToken();
      await api.post('/workouts/', { name, date, notes }, token!);
      setName('');
      setNotes('');
      await fetchWorkouts();
    } catch {
      setError('Erro ao registar treino.');
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkout = async (id: number) => {
    try {
      const token = getToken();
      await api.delete(`/workouts/${id}/`, token!);
      await fetchWorkouts();
    } catch {
      setError('Erro ao eliminar treino.');
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
            <h1 className="text-3xl font-bold">Treinos</h1>
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
          <h2 className="text-lg font-semibold mb-4">Novo Treino</h2>
          <input
            type="text"
            placeholder="Nome do treino (ex: Supino / Full Body)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-700 text-white p-3 rounded mb-3 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-gray-700 text-white p-3 rounded mb-3 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="Notas (ex: 4x8 bench press 80kg, RPE 8)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-gray-700 text-white p-3 rounded mb-4 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={addWorkout}
            disabled={loading || !name.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded font-bold transition-colors"
          >
            {loading ? 'A adicionar...' : 'Adicionar'}
          </button>
        </div>

        <div className="space-y-3">
          {workouts.length === 0 && (
            <p className="text-gray-400 text-center py-4">Nenhum treino ainda. Regista o primeiro!</p>
          )}
          {workouts.map((workout) => (
            <div key={workout.id} className="bg-gray-800 p-4 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-semibold">{workout.name}</p>
                <p className="text-gray-400 text-sm">{workout.date}</p>
                {workout.notes && <p className="text-gray-400 text-sm">{workout.notes}</p>}
              </div>
              <button
                onClick={() => deleteWorkout(workout.id)}
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