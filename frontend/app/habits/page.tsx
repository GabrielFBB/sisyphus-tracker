'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/app/lib/api';
import { getToken, clearTokens } from '@/app/lib/auth';

type HabitType = 'binary' | 'quantity' | 'duration';

interface HabitLog {
  id: number;
  habit: number;
  date: string;
  value: number;
  completed: boolean;
}

interface Habit {
  id: number;
  name: string;
  description: string;
  habit_type: HabitType;
  target: number | null;
  unit: string;
  logs: HabitLog[];
}

const today = () => new Date().toISOString().split('T')[0];

const shiftDate = (iso: string, days: number) => {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

function calcStreak(logs: HabitLog[]): number {
  const done = new Set(logs.filter((l) => l.completed).map((l) => l.date));
  let streak = 0;
  let cursor = today();

  if (!done.has(cursor)) {
    cursor = shiftDate(cursor, -1);
    if (!done.has(cursor)) return 0;
  }

  while (done.has(cursor)) {
    streak++;
    cursor = shiftDate(cursor, -1);
  }
  return streak;
}

function lastDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) days.push(shiftDate(today(), -i));
  return days;
}

export default function HabitsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [habitType, setHabitType] = useState<HabitType>('binary');
  const [target, setTarget] = useState('1');
  const [unit, setUnit] = useState('');

  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setAuthorized(true);
    fetchHabits();
  }, [router]);

  const fetchHabits = async () => {
    try {
      const data = await api.get('/habits/');
      if (Array.isArray(data)) setHabits(data as Habit[]);
    } catch {
      setError('Erro ao carregar os hábitos.');
    }
  };

  const addHabit = async () => {
    if (!name.trim()) return;
    const parsedTarget = parseFloat(target.replace(',', '.'));
    if (habitType !== 'binary' && (isNaN(parsedTarget) || parsedTarget <= 0)) {
      setError('A meta tem de ser um número maior que zero.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/habits/', {
        name: name.trim(),
        description: description.trim(),
        habit_type: habitType,
        target: habitType === 'binary' ? 1 : parsedTarget,
        unit: habitType === 'binary' ? '' : unit.trim(),
      });
      setName('');
      setDescription('');
      setTarget('1');
      setUnit('');
      setHabitType('binary');
      await fetchHabits();
    } catch {
      setError('Erro ao criar o hábito.');
    } finally {
      setLoading(false);
    }
  };

  const deleteHabit = async (id: number) => {
    try {
      await api.delete(`/habits/${id}/`);
      await fetchHabits();
    } catch {
      setError('Erro ao remover o hábito.');
    }
  };

  const logToday = async (habit: Habit, value: number) => {
    const existing = habit.logs?.find((l) => l.date === today());
    try {
      if (existing) {
        if (value <= 0) {
          await api.delete(`/habitlogs/${existing.id}/`);
        } else {
          await api.put(`/habitlogs/${existing.id}/`, {
            habit: habit.id,
            date: today(),
            value,
          });
        }
      } else if (value > 0) {
        await api.post('/habitlogs/', {
          habit: habit.id,
          date: today(),
          value,
        });
      }
      setInputs((prev) => ({ ...prev, [habit.id]: '' }));
      await fetchHabits();
    } catch {
      setError('Erro ao registar o progresso.');
    }
  };

  if (!authorized) return <div className="min-h-screen bg-gray-950" />;

  const typeLabel = (t: HabitType) => {
    if (t === 'quantity') return 'Quantidade';
    if (t === 'duration') return 'Duração';
    return 'Sim/Não';
  };

  const fmt = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="text-gray-400 hover:text-white text-xs mb-2 block transition-colors">
              ← Voltar ao Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight">Hábitos Diários</h1>
          </div>
          <button
            onClick={() => { clearTokens(); router.push('/login'); }}
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

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl space-y-4 shadow-lg">
          <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400 border-b border-gray-800 pb-3">
            Novo Hábito
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Nome</label>
              <input
                type="text"
                placeholder="Ex: Beber água"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 text-white p-3 rounded-lg text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Tipo</label>
              <select
                value={habitType}
                onChange={(e) => {
                  const t = e.target.value as HabitType;
                  setHabitType(t);
                  if (t === 'binary') { setTarget('1'); setUnit(''); }
                  if (t === 'duration') { setTarget('60'); setUnit('min'); }
                  if (t === 'quantity') { setTarget(''); setUnit(''); }
                }}
                className="w-full bg-gray-950 border border-gray-800 text-white p-3 rounded-lg text-sm outline-none focus:border-indigo-500"
              >
                <option value="binary">Sim/Não — fiz ou não fiz</option>
                <option value="quantity">Quantidade — litros, páginas...</option>
                <option value="duration">Duração — minutos</option>
              </select>
            </div>
          </div>

          {habitType !== 'binary' && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Meta diária</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={habitType === 'duration' ? 'Ex: 60' : 'Ex: 5'}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 text-white p-3 rounded-lg text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Unidade</label>
                <input
                  type="text"
                  placeholder={habitType === 'duration' ? 'min' : 'Ex: L, páginas'}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 text-white p-3 rounded-lg text-sm outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 block mb-1">Descrição (opcional)</label>
            <input
              type="text"
              placeholder="Porque é que este hábito importa?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 text-white p-3 rounded-lg text-sm outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={addHabit}
            disabled={loading || !name.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-lg font-bold text-sm transition-colors"
          >
            {loading ? 'A criar...' : 'Criar Hábito'}
          </button>
        </div>

        <div className="space-y-4">
          {habits.length === 0 && (
            <p className="text-gray-500 text-center py-12 text-sm">
              Ainda não tens hábitos. Cria o primeiro e começa a empurrar a pedra.
            </p>
          )}

          {habits.map((habit) => {
            const logs = habit.logs || [];
            const target = habit.target && habit.target > 0 ? habit.target : 1;
            const isBinary = habit.habit_type === 'binary' || !habit.habit_type;
            const streak = calcStreak(logs);
            const todayLog = logs.find((l) => l.date === today());
            const value = todayLog?.value ?? 0;
            const percent = Math.min(100, Math.round((value / target) * 100));
            const doneToday = todayLog?.completed ?? false;
            const doneDates = new Set(logs.filter((l) => l.completed).map((l) => l.date));

            return (
              <div key={habit.id} className="bg-gray-900 border border-gray-800 p-5 rounded-xl space-y-4 shadow-md">
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-white">{habit.name}</h3>
                      {streak > 0 && (
                        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded border border-orange-500/40 bg-orange-500/10 text-orange-400">
                          {streak} {streak === 1 ? 'dia' : 'dias'}
                        </span>
                      )}
                      <span className="text-[10px] uppercase tracking-wider text-gray-500 border border-gray-800 px-1.5 py-0.5 rounded">
                        {typeLabel(isBinary ? 'binary' : habit.habit_type)}
                      </span>
                    </div>
                    {habit.description && (
                      <p className="text-xs text-gray-400 mt-1">{habit.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors shrink-0"
                  >
                    Remover
                  </button>
                </div>

                {isBinary ? (
                  <button
                    onClick={() => logToday(habit, doneToday ? 0 : 1)}
                    className={`w-full py-3 rounded-lg text-sm font-bold transition-colors border ${
                      doneToday
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                        : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-indigo-500 hover:text-white'
                    }`}
                  >
                    {doneToday ? '✓ Feito hoje' : 'Marcar como feito hoje'}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono text-gray-400">
                      <span>
                        Hoje: {fmt(value)} / {fmt(target)} {habit.unit}
                      </span>
                      <span className={doneToday ? 'text-emerald-400 font-bold' : 'text-gray-500'}>
                        {percent}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-950 h-2 rounded-full overflow-hidden border border-gray-800">
                      <div
                        className={`h-full transition-all duration-300 ${doneToday ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder={`Somar ${habit.unit || 'valor'}`}
                        value={inputs[habit.id] ?? ''}
                        onChange={(e) => setInputs((p) => ({ ...p, [habit.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter') return;
                          const add = parseFloat((inputs[habit.id] ?? '').replace(',', '.'));
                          if (!isNaN(add)) logToday(habit, value + add);
                        }}
                        className="flex-1 bg-gray-950 border border-gray-800 text-white p-2 rounded text-sm outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={() => {
                          const add = parseFloat((inputs[habit.id] ?? '').replace(',', '.'));
                          if (!isNaN(add)) logToday(habit, value + add);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded font-semibold"
                      >
                        Somar
                      </button>
                      {value > 0 && (
                        <button
                          onClick={() => logToday(habit, 0)}
                          className="text-xs text-gray-500 hover:text-white px-2"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1.5">Últimos 30 dias</p>
                  <div className="flex gap-1 flex-wrap">
                    {lastDays(30).map((d) => (
                      <div
                        key={d}
                        title={d}
                        className={`w-3 h-3 rounded-sm ${
                          doneDates.has(d) ? 'bg-emerald-500' : 'bg-gray-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}