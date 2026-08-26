'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/app/lib/api';
import { getToken, clearTokens } from '@/app/lib/auth';

interface ExerciseItem {
  name: string;
  sets: number;
  reps: number;
  weight: number;
  notes?: string;
}

interface Workout {
  id: number;
  name: string;
  date: string;
  exercises: ExerciseItem[];
}

export default function WorkoutPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [exercises, setExercises] = useState<ExerciseItem[]>([
    { name: '', sets: 3, reps: 10, weight: 0, notes: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
    } else {
      setAuthorized(true);
      fetchWorkouts();
    }
  }, [router]);

  const fetchWorkouts = async () => {
    try {
      const data = await api.get('/workouts/');
      if (Array.isArray(data)) setWorkouts(data as Workout[]);
    } catch {
      setError('Erro ao carregar treinos.');
    }
  };

  const addExerciseField = () => {
    setExercises([...exercises, { name: '', sets: 3, reps: 10, weight: 0, notes: '' }]);
  };

  const updateExercise = (index: number, field: keyof ExerciseItem, value: string | number) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const removeExerciseField = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    try {
      await api.post('/workouts/', {
        name,
        date,
        exercises,
      });

      setName('');
      setExercises([{ name: '', sets: 3, reps: 10, weight: 0, notes: '' }]);
      await fetchWorkouts();
    } catch {
      setError('Erro ao guardar o treino.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/workouts/${id}/`);
      await fetchWorkouts();
    } catch {
      setError('Erro ao apagar treino.');
    }
  };

  if (!authorized) {
    return <div className="min-h-screen bg-gray-950" />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="text-gray-400 hover:text-white text-xs mb-2 block transition-colors">
              ← Voltar ao Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight">Treinos & Cargas</h1>
          </div>
          <button
            onClick={() => {
              clearTokens();
              router.push('/login');
            }}
            className="text-xs text-gray-400 hover:text-white bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-md"
          >
            Sair
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Formulário de Novo Treino */}
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 p-6 rounded-xl space-y-6 shadow-lg">
          <h2 className="text-sm font-bold uppercase tracking-wider text-purple-400">Registar Novo Treino</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Nome do Treino</label>
              <input
                type="text"
                placeholder="Ex: Full Body, Peito & Tríceps..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-gray-950 border border-gray-800 text-white p-3 rounded-lg text-sm outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 text-white p-3 rounded-lg text-sm outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Exercícios & Cargas</span>
              <button
                type="button"
                onClick={addExerciseField}
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
              >
                + Adicionar Exercício
              </button>
            </div>

            {exercises.map((ex, index) => (
              <div key={index} className="bg-gray-950 border border-gray-800/80 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    placeholder="Exercício (ex: Supino Reto)"
                    value={ex.name}
                    onChange={(e) => updateExercise(index, 'name', e.target.value)}
                    required
                    className="w-full bg-gray-900 border border-gray-800 text-white p-2.5 rounded text-sm outline-none focus:border-purple-500"
                  />
                  {exercises.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExerciseField(index)}
                      className="text-xs text-red-400 hover:text-red-300 px-2"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Séries</label>
                    <input
                      type="number"
                      value={ex.sets}
                      onChange={(e) => updateExercise(index, 'sets', Number(e.target.value))}
                      className="w-full bg-gray-900 border border-gray-800 text-white p-2 rounded text-sm outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Reps</label>
                    <input
                      type="number"
                      value={ex.reps}
                      onChange={(e) => updateExercise(index, 'reps', Number(e.target.value))}
                      className="w-full bg-gray-900 border border-gray-800 text-white p-2 rounded text-sm outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Carga (kg)</label>
                    <input
                      type="number"
                      value={ex.weight}
                      onChange={(e) => updateExercise(index, 'weight', Number(e.target.value))}
                      className="w-full bg-gray-900 border border-gray-800 text-white p-2 rounded text-sm outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Notas (Opcional, ex: RPE 8, boa progressão...)"
                  value={ex.notes || ''}
                  onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-gray-300 p-2 rounded text-xs outline-none focus:border-purple-500"
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white py-3 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-purple-600/20"
          >
            {loading ? 'A guardar...' : 'Guardar Treino'}
          </button>
        </form>

        {/* Histórico */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight">Histórico de Treinos</h2>
          {workouts.length === 0 && (
            <p className="text-gray-500 text-center py-8 text-sm">Nenhum treino registado ainda.</p>
          )}

          {workouts.map((w) => (
            <div key={w.id} className="bg-gray-900 border border-gray-800 p-5 rounded-xl space-y-3 shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-base text-white">{w.name}</h3>
                  <p className="text-xs text-gray-400">{w.date}</p>
                </div>
                <button
                  onClick={() => handleDelete(w.id)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Apagar
                </button>
              </div>

              <div className="border-t border-gray-800/80 pt-3 space-y-2">
                {w.exercises?.map((ex, idx) => (
                  <div key={idx} className="flex justify-between text-xs bg-gray-950 p-2.5 rounded border border-gray-800/50">
                    <span className="font-semibold text-gray-200">{ex.name}</span>
                    <span className="font-mono text-gray-400">
                      {ex.sets}x{ex.reps} — {ex.weight}kg {ex.notes && <span className="text-purple-400">({ex.notes})</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
