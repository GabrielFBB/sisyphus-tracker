'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/app/lib/api';
import { getToken, clearTokens } from '@/app/lib/auth';

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight_kg: number;
}

interface Workout {
  id: number;
  name: string;
  date: string;
  notes?: string;
  exercises?: Exercise[];
}

export default function WorkoutPage() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const [exercises, setExercises] = useState<Exercise[]>([
    { name: '', sets: 3, reps: 10, weight_kg: 0 },
  ]);

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
      // APENAS 1 ARGUMENTO (endpoint)
      const data = await api.get('/workouts/');
      if (Array.isArray(data)) setWorkouts(data as Workout[]);
    } catch {
      setError('Erro ao carregar a lista de treinos.');
    }
  };

  const addExerciseField = () => {
    setExercises((prev) => [...prev, { name: '', sets: 3, reps: 10, weight_kg: 0 }]);
  };

  const removeExerciseField = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string | number) => {
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex))
    );
  };

  const addWorkout = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError('');

    const validExercises = exercises.filter((ex) => ex.name.trim() !== '');

    try {
      // APENAS 2 ARGUMENTOS (endpoint, body)
      await api.post('/workouts/', {
        name,
        date,
        notes,
        exercises: validExercises,
      });

      setName('');
      setNotes('');
      setExercises([{ name: '', sets: 3, reps: 10, weight_kg: 0 }]);
      await fetchWorkouts();
    } catch {
      setError('Erro ao registar treino.');
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkout = async (id: number) => {
    try {
      // APENAS 1 ARGUMENTO (endpoint)
      await api.delete(`/workouts/${id}/`);
      await fetchWorkouts();
    } catch {
      setError('Erro ao eliminar treino.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-3xl mx-auto">
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

        <div className="bg-gray-800 p-6 rounded-lg mb-8 space-y-4">
          <h2 className="text-lg font-semibold mb-2">Registar Novo Treino</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Nome do Treino</label>
              <input
                type="text"
                placeholder="Ex: Full Body, Peito & Tríceps..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-700 text-white p-3 rounded outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-gray-700 text-white p-3 rounded outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-gray-300">Exercícios & Cargas</label>
              <button
                type="button"
                onClick={addExerciseField}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                + Adicionar Exercício
              </button>
            </div>

            <div className="space-y-3">
              {exercises.map((ex, idx) => (
                <div key={idx} className="flex flex-wrap items-center gap-2 bg-gray-750 p-3 rounded border border-gray-700">
                  <input
                    type="text"
                    placeholder="Exercício (ex: Supino Reto)"
                    value={ex.name}
                    onChange={(e) => updateExercise(idx, 'name', e.target.value)}
                    className="flex-1 min-w-[150px] bg-gray-700 text-white p-2 rounded text-sm outline-none"
                  />
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <span>Séries:</span>
                    <input
                      type="number"
                      value={ex.sets}
                      onChange={(e) => updateExercise(idx, 'sets', Number(e.target.value))}
                      className="w-14 bg-gray-700 text-white p-2 rounded text-sm text-center outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <span>Reps:</span>
                    <input
                      type="number"
                      value={ex.reps}
                      onChange={(e) => updateExercise(idx, 'reps', Number(e.target.value))}
                      className="w-14 bg-gray-700 text-white p-2 rounded text-sm text-center outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <span>Carga (kg):</span>
                    <input
                      type="number"
                      value={ex.weight_kg}
                      onChange={(e) => updateExercise(idx, 'weight_kg', Number(e.target.value))}
                      className="w-16 bg-gray-700 text-white p-2 rounded text-sm text-center outline-none"
                    />
                  </div>
                  {exercises.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExerciseField(idx)}
                      className="text-red-400 hover:text-red-300 text-xs px-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Notas (Opcional)</label>
            <input
              type="text"
              placeholder="Ex: RPE 8, boa progressão no supino..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-gray-700 text-white p-3 rounded outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={addWorkout}
            disabled={loading || !name.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded font-bold transition-colors"
          >
            {loading ? 'A guardar...' : 'Guardar Treino'}
          </button>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-4">Histórico</h2>
          {workouts.length === 0 && (
            <p className="text-gray-400 text-center py-4">Nenhum treino registado ainda.</p>
          )}
          {workouts.map((workout) => (
            <div key={workout.id} className="bg-gray-800 p-5 rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{workout.name}</h3>
                  <p className="text-gray-400 text-xs">{workout.date}</p>
                </div>
                <button
                  onClick={() => deleteWorkout(workout.id)}
                  className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                >
                  Eliminar
                </button>
              </div>

              {workout.notes && (
                <p className="text-sm text-gray-300 italic bg-gray-750 p-2 rounded border-l-2 border-indigo-500">
                  {workout.notes}
                </p>
              )}

              {workout.exercises && workout.exercises.length > 0 && (
                <div className="space-y-1 pt-1">
                  <p className="text-xs font-semibold text-gray-400">Exercícios:</p>
                  <div className="grid gap-1">
                    {workout.exercises.map((ex, i) => (
                      <div key={i} className="flex justify-between text-sm bg-gray-700/50 p-2 rounded">
                        <span className="font-medium">{ex.name}</span>
                        <span className="text-indigo-300 font-mono text-xs">
                          {ex.sets}x{ex.reps} — {ex.weight_kg} kg
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}