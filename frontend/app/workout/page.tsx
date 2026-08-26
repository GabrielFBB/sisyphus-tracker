'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/app/lib/api';
import { getToken, clearTokens } from '@/app/lib/auth';

type Modality = 'strength' | 'martial' | 'cardio' | 'other';
type Method = '' | 'ppl' | 'upper_lower' | 'full_body' | 'abc' | 'other';

interface Exercise {
  id: number;
  workout: number;
  name: string;
  sets: number;
  reps: number;
  weight: number | null;
}

interface Workout {
  id: number;
  name: string;
  date: string;
  modality: Modality;
  method: Method;
  notes: string;
  exercises: Exercise[];
}

const today = () => new Date().toISOString().split('T')[0];

const GOAL_KEY = 'sisyphus_weekly_goal';

function startOfWeek(): string {
  const d = new Date(today() + 'T12:00:00');
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d.toISOString().split('T')[0];
}

function daysAgo(iso: string): string {
  if (!iso) return '';
  const diff = Math.floor(
    (new Date(today() + 'T12:00:00').getTime() - new Date(iso + 'T12:00:00').getTime()) / 86400000
  );
  if (diff === 0) return 'hoje';
  if (diff === 1) return 'ontem';
  if (diff < 0) return 'agendado';
  return `há ${diff} dias`;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const MODALITIES: { key: Modality; label: string; color: string }[] = [
  { key: 'strength', label: 'Musculação', color: '#EF9F27' },
  { key: 'martial', label: 'Artes marciais', color: '#D85A30' },
  { key: 'cardio', label: 'Cardio', color: '#378ADD' },
  { key: 'other', label: 'Outro', color: '#888780' },
];

const METHODS: { key: Method; label: string }[] = [
  { key: '', label: 'Sem método' },
  { key: 'ppl', label: 'Push Pull Legs' },
  { key: 'upper_lower', label: 'Upper Lower' },
  { key: 'full_body', label: 'Full Body' },
  { key: 'abc', label: 'ABC' },
  { key: 'other', label: 'Outro' },
];

export default function WorkoutPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  const [weeklyGoal, setWeeklyGoal] = useState(4);
  const [editingGoal, setEditingGoal] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState(today());
  const [modality, setModality] = useState<Modality>('strength');
  const [method, setMethod] = useState<Method>('');
  const [notes, setNotes] = useState('');

  const [exerciseFor, setExerciseFor] = useState<number | null>(null);
  const [exName, setExName] = useState('');
  const [exSets, setExSets] = useState('3');
  const [exReps, setExReps] = useState('10');
  const [exWeight, setExWeight] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setAuthorized(true);
    const saved = localStorage.getItem(GOAL_KEY);
    if (saved) setWeeklyGoal(parseInt(saved) || 4);
    fetchWorkouts();
  }, [router]);

  const saveGoal = (n: number) => {
    const clamped = Math.max(1, Math.min(14, n));
    setWeeklyGoal(clamped);
    localStorage.setItem(GOAL_KEY, String(clamped));
  };

  const fetchWorkouts = async () => {
    try {
      const data = await api.get('/workouts/');
      if (Array.isArray(data)) setWorkouts(data as Workout[]);
    } catch {
      setError('Erro ao carregar os treinos.');
    }
  };

  const addWorkout = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/workouts/', {
        name: name.trim(),
        date,
        modality,
        method,
        notes: notes.trim(),
      });
      setName('');
      setNotes('');
      setDate(today());
      setFormOpen(false);
      await fetchWorkouts();
    } catch {
      setError('Erro ao registar o treino.');
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkout = async (id: number) => {
    try {
      await api.delete(`/workouts/${id}/`);
      await fetchWorkouts();
    } catch {
      setError('Erro ao remover o treino.');
    }
  };

  const addExercise = async (workoutId: number) => {
    if (!exName.trim()) return;
    const sets = parseInt(exSets) || 1;
    const reps = parseInt(exReps) || 1;
    const weight = exWeight.trim() === '' ? null : parseFloat(exWeight.replace(',', '.'));
    if (weight !== null && isNaN(weight)) {
      setError('A carga tem de ser um número.');
      return;
    }
    setError('');
    try {
      await api.post('/exercises/', { workout: workoutId, name: exName.trim(), sets, reps, weight });
      setExName('');
      setExWeight('');
      await fetchWorkouts();
    } catch {
      setError('Erro ao adicionar o exercício.');
    }
  };

  const deleteExercise = async (id: number) => {
    try {
      await api.delete(`/exercises/${id}/`);
      await fetchWorkouts();
    } catch {
      setError('Erro ao remover o exercício.');
    }
  };

  if (!authorized) return <div className="min-h-screen bg-[#0b0d10]" />;

  const sorted = [...workouts].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const weekStart = startOfWeek();
  const thisWeek = workouts.filter((w) => w.date >= weekStart && w.date <= today()).length;
  const thisMonth = workouts.filter((w) => w.date?.startsWith(today().slice(0, 7))).length;
  const thisYear = workouts.filter((w) => w.date?.startsWith(today().slice(0, 4))).length;
  const lastDate = sorted[0]?.date;

  const goalMet = thisWeek >= weeklyGoal;
  const beyondGoal = thisWeek > weeklyGoal;
  const weekPercent = Math.min(100, Math.round((thisWeek / weeklyGoal) * 100));

  const weekColor = beyondGoal ? '#97C459' : goalMet ? '#639922' : '#EF9F27';

  const modalityOf = (m: Modality) => MODALITIES.find((x) => x.key === m) || MODALITIES[3];
  const methodLabel = (m: Method) => METHODS.find((x) => x.key === m)?.label || '';
  const fmt = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');

  const inputClass =
    'w-full bg-[#0b0d10] border border-[#26303f] text-[#e8e8e6] px-3 py-2.5 rounded-md text-sm outline-none focus:border-[#EF9F27] transition-colors';

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#e8e8e6]">
      <header className="border-b border-[#1c1f26] sticky top-0 bg-[#0b0d10]/90 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto px-8 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-xs text-[#7d7d78] hover:text-[#e8e8e6] transition-colors">
            ← Dashboard
          </Link>
          <button
            onClick={() => { clearTokens(); router.push('/login'); }}
            className="text-xs text-[#7d7d78] hover:text-[#e8e8e6] transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-10 space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-white">Treinos</h1>
            <p className="text-sm text-[#7d7d78] mt-1.5">
              {workouts.length === 0 ? 'Sem treinos ainda' : `Último treino ${daysAgo(lastDate)}`}
            </p>
          </div>
          <button
            onClick={() => setFormOpen(!formOpen)}
            className="text-xs text-[#7d7d78] hover:text-[#e8e8e6] border border-[#232830] hover:border-[#3a4150] px-4 py-2 rounded-md transition-colors shrink-0"
          >
            {formOpen ? 'Cancelar' : 'Novo treino'}
          </button>
        </div>

        <div
          className="border border-[#26303f] bg-[#141821] p-6"
          style={{ borderLeft: `3px solid ${weekColor}`, borderRadius: '0 12px 12px 0' }}
        >
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-5xl leading-none font-medium tabular-nums" style={{ color: weekColor }}>
                {thisWeek}
              </span>
              <span className="text-base text-[#8b8b86]">
                de {weeklyGoal} esta semana
              </span>
            </div>

            {editingGoal ? (
              <div className="flex items-center gap-2">
                <button onClick={() => saveGoal(weeklyGoal - 1)} className="text-sm text-[#7d7d78] hover:text-white border border-[#26303f] w-8 h-8 rounded-md transition-colors">
                  −
                </button>
                <span className="font-mono text-sm text-white w-6 text-center">{weeklyGoal}</span>
                <button onClick={() => saveGoal(weeklyGoal + 1)} className="text-sm text-[#7d7d78] hover:text-white border border-[#26303f] w-8 h-8 rounded-md transition-colors">
                  +
                </button>
                <button onClick={() => setEditingGoal(false)} className="text-xs text-[#7d7d78] hover:text-white px-3 transition-colors">
                  Feito
                </button>
              </div>
            ) : (
              <button onClick={() => setEditingGoal(true)} className="text-xs text-[#5f5f5b] hover:text-white transition-colors">
                Alterar meta
              </button>
            )}
          </div>

          <div className="h-2.5 bg-[#0b0d10] rounded-full overflow-hidden mt-5">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${weekPercent}%`, background: weekColor }}
            />
          </div>

          <div className="flex items-center justify-between gap-4 mt-5 flex-wrap">
            <p className="text-sm" style={{ color: beyondGoal ? '#97C459' : goalMet ? '#97C459' : '#8b8b86' }}>
              {beyondGoal
                ? `Foste além da meta em ${thisWeek - weeklyGoal} ${thisWeek - weeklyGoal === 1 ? 'treino' : 'treinos'}.`
                : goalMet
                ? 'Meta da semana cumprida.'
                : `Faltam ${weeklyGoal - thisWeek} ${weeklyGoal - thisWeek === 1 ? 'treino' : 'treinos'}.`}
            </p>
            <div className="flex items-baseline gap-6">
              <div>
                <span className="font-mono text-lg font-medium text-[#b8b8b3] tabular-nums">{thisMonth}</span>
                <span className="text-xs text-[#5f5f5b] ml-2">este mês</span>
              </div>
              <div>
                <span className="font-mono text-lg font-medium text-[#b8b8b3] tabular-nums">{thisYear}</span>
                <span className="text-xs text-[#5f5f5b] ml-2">este ano</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="border border-[#7a2c2c] bg-[#7a2c2c]/10 text-[#f09595] p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {formOpen && (
          <div className="border border-[#26303f] bg-[#141821] rounded-xl p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#7d7d78] block mb-1.5">Nome</label>
                <input type="text" placeholder="Peito e tríceps" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-xs text-[#7d7d78] block mb-1.5">Data</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#7d7d78] block mb-1.5">Modalidade</label>
                <select value={modality} onChange={(e) => setModality(e.target.value as Modality)} className={inputClass}>
                  {MODALITIES.map((m) => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#7d7d78] block mb-1.5">Método</label>
                <select value={method} onChange={(e) => setMethod(e.target.value as Method)} className={inputClass}>
                  {METHODS.map((m) => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-[#7d7d78] block mb-1.5">Notas</label>
              <input type="text" placeholder="Opcional" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
            </div>

            <button
              onClick={addWorkout}
              disabled={loading || !name.trim()}
              className="w-full bg-[#EF9F27] hover:bg-[#FAC775] disabled:opacity-40 text-[#412402] py-2.5 rounded-md font-medium text-sm transition-colors"
            >
              {loading ? 'A registar' : 'Registar treino'}
            </button>
          </div>
        )}

        <div className="space-y-3">
          {workouts.length === 0 && !formOpen && (
            <div className="border border-dashed border-[#1c1f26] rounded-xl py-16 text-center">
              <p className="text-sm text-[#7d7d78]">Regista o primeiro treino.</p>
            </div>
          )}

          {sorted.map((workout) => {
            const exercises = workout.exercises || [];
            const mod = modalityOf(workout.modality);
            const mLabel = methodLabel(workout.method);

            return (
              <div
                key={workout.id}
                className="border border-[#26303f] bg-[#141821] p-6 space-y-4"
                style={{ borderLeft: `3px solid ${mod.color}`, borderRadius: '0 12px 12px 0' }}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-base font-medium text-white">{workout.name}</h2>
                      <span
                        className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                        style={{ background: `${mod.color}20`, color: mod.color }}
                      >
                        {mod.label}
                      </span>
                      {mLabel && workout.method && (
                        <span className="text-[11px] text-[#7d7d78] border border-[#26303f] px-2 py-0.5 rounded-full">
                          {mLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#8b8b86] mt-1.5">
                      {formatDate(workout.date)}
                      <span className="text-[#5f5f5b]"> · {daysAgo(workout.date)}</span>
                    </p>
                    {workout.notes && (
                      <p className="text-sm text-[#b8b8b3] mt-2.5 leading-relaxed">{workout.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteWorkout(workout.id)}
                    className="text-xs text-[#5f5f5b] hover:text-[#f09595] transition-colors shrink-0"
                  >
                    Remover
                  </button>
                </div>

                {exercises.length > 0 && (
                  <div className="space-y-2.5 border-t border-[#26303f] pt-4">
                    {exercises.map((ex) => (
                      <div key={ex.id} className="flex items-center justify-between gap-4">
                        <span className="text-sm text-[#c8c8c4] truncate">{ex.name}</span>
                        <div className="flex items-center gap-4 shrink-0">
                          <span className="font-mono text-sm text-[#8b8b86] tabular-nums">
                            {ex.sets}×{ex.reps}
                            {ex.weight !== null && ex.weight !== undefined && (
                              <span className="text-[#EF9F27]"> · {fmt(ex.weight)} kg</span>
                            )}
                          </span>
                          <button
                            onClick={() => deleteExercise(ex.id)}
                            className="text-sm text-[#3a4657] hover:text-[#f09595] transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {exerciseFor === workout.id ? (
                  <div className="border-t border-[#26303f] pt-4 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="col-span-2 md:col-span-1">
                        <label className="text-xs text-[#7d7d78] block mb-1.5">Exercício</label>
                        <input type="text" placeholder="Supino" value={exName} onChange={(e) => setExName(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className="text-xs text-[#7d7d78] block mb-1.5">Séries</label>
                        <input type="text" inputMode="numeric" value={exSets} onChange={(e) => setExSets(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className="text-xs text-[#7d7d78] block mb-1.5">Reps</label>
                        <input type="text" inputMode="numeric" value={exReps} onChange={(e) => setExReps(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className="text-xs text-[#7d7d78] block mb-1.5">Carga kg</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="opcional"
                          value={exWeight}
                          onChange={(e) => setExWeight(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addExercise(workout.id)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => addExercise(workout.id)}
                        disabled={!exName.trim()}
                        className="bg-[#EF9F27] hover:bg-[#FAC775] disabled:opacity-40 text-[#412402] text-xs px-5 py-2 rounded-md font-medium transition-colors"
                      >
                        Adicionar
                      </button>
                      <button
                        onClick={() => { setExerciseFor(null); setExName(''); setExWeight(''); }}
                        className="text-xs text-[#7d7d78] hover:text-white px-4 py-2 transition-colors"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setExerciseFor(workout.id)}
                    className="w-full border border-[#2a3441] hover:border-[#EF9F27]/50 text-[#8b8b86] hover:text-[#FAC775] py-2.5 rounded-md text-sm font-medium transition-colors"
                  >
                    Adicionar exercício
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}