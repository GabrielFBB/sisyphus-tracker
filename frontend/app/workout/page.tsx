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

interface Session {
  id: number;
  workout: number;
  date: string;
}

interface Workout {
  id: number;
  name: string;
  modality: Modality;
  method: Method;
  notes: string;
  exercises: Exercise[];
  sessions: Session[];
}

const today = () => new Date().toISOString().split('T')[0];

const GOAL_KEY = 'sisyphus_weekly_goal';

function startOfWeek(): string {
  const d = new Date(today() + 'T12:00:00');
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().split('T')[0];
}

function daysAgo(iso: string): string {
  if (!iso) return '';
  const diff = Math.floor(
    (new Date(today() + 'T12:00:00').getTime() - new Date(iso + 'T12:00:00').getTime()) / 86400000
  );
  if (diff === 0) return 'hoje';
  if (diff === 1) return 'ontem';
  return `há ${diff} dias`;
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
  const [modality, setModality] = useState<Modality>('strength');
  const [method, setMethod] = useState<Method>('');
  const [notes, setNotes] = useState('');

  const [expanded, setExpanded] = useState<number | null>(null);
  const [dateFor, setDateFor] = useState<number | null>(null);
  const [customDate, setCustomDate] = useState(today());

  const [exName, setExName] = useState('');
  const [exSets, setExSets] = useState('3');
  const [exReps, setExReps] = useState('10');
  const [exWeight, setExWeight] = useState('');

  const [editingEx, setEditingEx] = useState<number | null>(null);
  const [editSets, setEditSets] = useState('');
  const [editReps, setEditReps] = useState('');
  const [editWeight, setEditWeight] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

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

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(t);
  }, [toast]);

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
        modality,
        method,
        notes: notes.trim(),
      });
      setName('');
      setNotes('');
      setFormOpen(false);
      await fetchWorkouts();
    } catch {
      setError('Erro ao criar o treino.');
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

  const markSession = async (workout: Workout, date: string) => {
    if (date > today()) {
      setError('Não podes registar um treino numa data futura.');
      return;
    }
    const existing = workout.sessions?.find((s) => s.date === date);
    setError('');
    try {
      if (existing) {
        await api.delete(`/sessions/${existing.id}/`);
        setToast('Registo removido');
      } else {
        await api.post('/sessions/', { workout: workout.id, date });
        setToast(date === today() ? 'Treino registado hoje' : `Registado em ${date}`);
      }
      setDateFor(null);
      setCustomDate(today());
      await fetchWorkouts();
    } catch {
      setError('Erro ao registar o treino.');
    }
  };

  const addExercise = async (workoutId: number) => {
    if (!exName.trim()) return;
    const weight = exWeight.trim() === '' ? null : parseFloat(exWeight.replace(',', '.'));
    if (weight !== null && isNaN(weight)) {
      setError('A carga tem de ser um número.');
      return;
    }
    setError('');
    try {
      await api.post('/exercises/', {
        workout: workoutId,
        name: exName.trim(),
        sets: parseInt(exSets) || 1,
        reps: parseInt(exReps) || 1,
        weight,
      });
      setExName('');
      setExWeight('');
      await fetchWorkouts();
    } catch {
      setError('Erro ao adicionar o exercício.');
    }
  };

  const startEditEx = (ex: Exercise) => {
    setEditingEx(ex.id);
    setEditSets(String(ex.sets));
    setEditReps(String(ex.reps));
    setEditWeight(ex.weight !== null ? String(ex.weight) : '');
  };

  const saveEditEx = async (ex: Exercise) => {
    const newWeight = editWeight.trim() === '' ? null : parseFloat(editWeight.replace(',', '.'));
    const newReps = parseInt(editReps) || ex.reps;
    if (newWeight !== null && isNaN(newWeight)) {
      setError('A carga tem de ser um número.');
      return;
    }
    setError('');
    try {
      await api.put(`/exercises/${ex.id}/`, {
        workout: ex.workout,
        name: ex.name,
        sets: parseInt(editSets) || ex.sets,
        reps: newReps,
        weight: newWeight,
      });

      const oldW = ex.weight ?? 0;
      const newW = newWeight ?? 0;
      if (newW > oldW && oldW > 0) {
        setToast(`Progrediste ${String(Math.round((newW - oldW) * 10) / 10).replace('.', ',')} kg em ${ex.name}`);
      } else if (newReps > ex.reps) {
        setToast(`Progrediste ${newReps - ex.reps} reps em ${ex.name}`);
      }

      setEditingEx(null);
      await fetchWorkouts();
    } catch {
      setError('Erro ao atualizar o exercício.');
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

  const allSessions = workouts.flatMap((w) => w.sessions || []);
  const weekStart = startOfWeek();
  const thisWeek = allSessions.filter((s) => s.date >= weekStart && s.date <= today()).length;
  const thisMonth = allSessions.filter((s) => s.date.startsWith(today().slice(0, 7))).length;
  const thisYear = allSessions.filter((s) => s.date.startsWith(today().slice(0, 4))).length;
  const lastSession = [...allSessions].sort((a, b) => b.date.localeCompare(a.date))[0];

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

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 border border-[#639922]/50 bg-[#141821] text-[#97C459] px-5 py-3 rounded-lg text-sm shadow-lg">
          {toast}
        </div>
      )}

      <main className="max-w-4xl mx-auto px-8 py-10 space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-white">Treinos</h1>
            <p className="text-sm text-[#7d7d78] mt-1.5">
              {lastSession ? `Último treino ${daysAgo(lastSession.date)}` : 'Sem treinos registados'}
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
              <span className="text-base text-[#8b8b86]">de {weeklyGoal} esta semana</span>
            </div>

            {editingGoal ? (
              <div className="flex items-center gap-2">
                <button onClick={() => saveGoal(weeklyGoal - 1)} className="text-sm text-[#7d7d78] hover:text-white border border-[#26303f] w-8 h-8 rounded-md transition-colors">−</button>
                <span className="font-mono text-sm text-white w-6 text-center">{weeklyGoal}</span>
                <button onClick={() => saveGoal(weeklyGoal + 1)} className="text-sm text-[#7d7d78] hover:text-white border border-[#26303f] w-8 h-8 rounded-md transition-colors">+</button>
                <button onClick={() => setEditingGoal(false)} className="text-xs text-[#7d7d78] hover:text-white px-3 transition-colors">Feito</button>
              </div>
            ) : (
              <button onClick={() => setEditingGoal(true)} className="text-xs text-[#5f5f5b] hover:text-white transition-colors">
                Alterar meta
              </button>
            )}
          </div>

          <div className="h-2.5 bg-[#0b0d10] rounded-full overflow-hidden mt-5">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${weekPercent}%`, background: weekColor }} />
          </div>

          <div className="flex items-center justify-between gap-4 mt-5 flex-wrap">
            <p className="text-sm" style={{ color: goalMet ? '#97C459' : '#8b8b86' }}>
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
          <div className="border border-[#7a2c2c] bg-[#7a2c2c]/10 text-[#f09595] p-3 rounded-lg text-sm">{error}</div>
        )}

        {formOpen && (
          <div className="border border-[#26303f] bg-[#141821] rounded-xl p-6 space-y-4">
            <div>
              <label className="text-xs text-[#7d7d78] block mb-1.5">Nome</label>
              <input type="text" placeholder="Peito, ombro e tríceps" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#7d7d78] block mb-1.5">Modalidade</label>
                <select value={modality} onChange={(e) => setModality(e.target.value as Modality)} className={inputClass}>
                  {MODALITIES.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#7d7d78] block mb-1.5">Método</label>
                <select value={method} onChange={(e) => setMethod(e.target.value as Method)} className={inputClass}>
                  {METHODS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
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
              {loading ? 'A criar' : 'Criar treino'}
            </button>
          </div>
        )}

        <div className="space-y-3">
          {workouts.length === 0 && !formOpen && (
            <div className="border border-dashed border-[#1c1f26] rounded-xl py-16 text-center">
              <p className="text-sm text-[#7d7d78]">Cria os teus treinos uma vez. Depois é só marcar quando os fizeres.</p>
            </div>
          )}

          {workouts.map((workout) => {
            const exercises = workout.exercises || [];
            const sessions = workout.sessions || [];
            const mod = modalityOf(workout.modality);
            const mLabel = methodLabel(workout.method);
            const doneToday = sessions.some((s) => s.date === today());
            const last = [...sessions].sort((a, b) => b.date.localeCompare(a.date))[0];
            const isOpen = expanded === workout.id;

            return (
              <div
                key={workout.id}
                className="border border-[#26303f] bg-[#141821] p-6 space-y-4"
                style={{ borderLeft: `3px solid ${doneToday ? '#639922' : mod.color}`, borderRadius: '0 12px 12px 0' }}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-base font-medium text-white">{workout.name}</h2>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${mod.color}20`, color: mod.color }}>
                        {mod.label}
                      </span>
                      {mLabel && workout.method && (
                        <span className="text-[11px] text-[#7d7d78] border border-[#26303f] px-2 py-0.5 rounded-full">{mLabel}</span>
                      )}
                    </div>
                    <p className="text-sm text-[#8b8b86] mt-1.5">
                      {sessions.length} {sessions.length === 1 ? 'sessão' : 'sessões'}
                      {last && <span className="text-[#5f5f5b]"> · última {daysAgo(last.date)}</span>}
                    </p>
                    {workout.notes && <p className="text-sm text-[#b8b8b3] mt-2.5 leading-relaxed">{workout.notes}</p>}
                  </div>
                  <button onClick={() => deleteWorkout(workout.id)} className="text-xs text-[#5f5f5b] hover:text-[#f09595] transition-colors shrink-0">
                    Remover
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => markSession(workout, today())}
                    className={`flex-1 py-3 rounded-md text-sm font-medium transition-colors ${
                      doneToday
                        ? 'bg-[#639922] text-[#173404] hover:bg-[#97C459]'
                        : 'border border-[#2a3441] text-[#8b8b86] hover:border-[#EF9F27]/50 hover:text-white'
                    }`}
                  >
                    {doneToday ? 'Feito hoje' : 'Marcar feito hoje'}
                  </button>
                  <button
                    onClick={() => { setDateFor(dateFor === workout.id ? null : workout.id); setCustomDate(today()); }}
                    className="text-xs text-[#5f5f5b] hover:text-white border border-[#2a3441] px-4 rounded-md transition-colors"
                  >
                    Outra data
                  </button>
                </div>

                {dateFor === workout.id && (
                  <div className="flex gap-2 items-center">
                    <input
                      type="date"
                      value={customDate}
                      max={today()}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className={inputClass}
                    />
                    <button
                      onClick={() => markSession(workout, customDate)}
                      className="bg-[#EF9F27] hover:bg-[#FAC775] text-[#412402] text-xs px-5 py-2.5 rounded-md font-medium transition-colors shrink-0"
                    >
                      Registar
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setExpanded(isOpen ? null : workout.id)}
                  className="text-xs text-[#5f5f5b] hover:text-white transition-colors"
                >
                  {isOpen ? 'Fechar exercícios' : `Exercícios (${exercises.length})`}
                </button>

                {isOpen && (
                  <div className="space-y-3 border-t border-[#26303f] pt-4">
                    {exercises.map((ex) => (
                      <div key={ex.id}>
                        {editingEx === ex.id ? (
                          <div className="space-y-2">
                            <p className="text-sm text-white">{ex.name}</p>
                            <div className="flex gap-2 items-center flex-wrap">
                              <input type="text" inputMode="numeric" value={editSets} onChange={(e) => setEditSets(e.target.value)} placeholder="séries" className="w-20 bg-[#0b0d10] border border-[#26303f] text-[#e8e8e6] px-2 py-1.5 rounded text-sm outline-none focus:border-[#EF9F27]" />
                              <input type="text" inputMode="numeric" value={editReps} onChange={(e) => setEditReps(e.target.value)} placeholder="reps" className="w-20 bg-[#0b0d10] border border-[#26303f] text-[#e8e8e6] px-2 py-1.5 rounded text-sm outline-none focus:border-[#EF9F27]" />
                              <input type="text" inputMode="decimal" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} placeholder="kg" className="w-24 bg-[#0b0d10] border border-[#26303f] text-[#e8e8e6] px-2 py-1.5 rounded text-sm outline-none focus:border-[#EF9F27]" />
                              <button onClick={() => saveEditEx(ex)} className="bg-[#EF9F27] hover:bg-[#FAC775] text-[#412402] text-xs px-4 py-2 rounded font-medium transition-colors">
                                Guardar
                              </button>
                              <button onClick={() => setEditingEx(null)} className="text-xs text-[#5f5f5b] hover:text-white px-2 transition-colors">
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-sm text-[#c8c8c4] truncate">{ex.name}</span>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="font-mono text-sm text-[#8b8b86] tabular-nums">
                                {ex.sets}×{ex.reps}
                                {ex.weight !== null && ex.weight !== undefined && (
                                  <span className="text-[#EF9F27]"> · {fmt(ex.weight)} kg</span>
                                )}
                              </span>
                              <button onClick={() => startEditEx(ex)} className="text-xs text-[#5f5f5b] hover:text-white transition-colors">
                                Progredi
                              </button>
                              <button onClick={() => deleteExercise(ex.id)} className="text-sm text-[#3a4657] hover:text-[#f09595] transition-colors">
                                ×
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                      <input type="text" placeholder="Supino" value={exName} onChange={(e) => setExName(e.target.value)} className="col-span-2 md:col-span-1 bg-[#0b0d10] border border-[#26303f] text-[#e8e8e6] px-2 py-2 rounded text-sm outline-none focus:border-[#EF9F27]" />
                      <input type="text" inputMode="numeric" placeholder="séries" value={exSets} onChange={(e) => setExSets(e.target.value)} className="bg-[#0b0d10] border border-[#26303f] text-[#e8e8e6] px-2 py-2 rounded text-sm outline-none focus:border-[#EF9F27]" />
                      <input type="text" inputMode="numeric" placeholder="reps" value={exReps} onChange={(e) => setExReps(e.target.value)} className="bg-[#0b0d10] border border-[#26303f] text-[#e8e8e6] px-2 py-2 rounded text-sm outline-none focus:border-[#EF9F27]" />
                      <input type="text" inputMode="decimal" placeholder="kg" value={exWeight} onChange={(e) => setExWeight(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addExercise(workout.id)} className="bg-[#0b0d10] border border-[#26303f] text-[#e8e8e6] px-2 py-2 rounded text-sm outline-none focus:border-[#EF9F27]" />
                    </div>
                    <button
                      onClick={() => addExercise(workout.id)}
                      disabled={!exName.trim()}
                      className="text-xs text-[#8b8b86] hover:text-white border border-[#2a3441] hover:border-[#EF9F27]/50 px-4 py-2 rounded-md transition-colors disabled:opacity-40"
                    >
                      Adicionar exercício
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}