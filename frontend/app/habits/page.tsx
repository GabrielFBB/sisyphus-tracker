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

const TIMER_KEY = 'sisyphus_timers';

function readTimers(): Record<number, number> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(TIMER_KEY) || '{}');
  } catch {
    return {};
  }
}

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function HabitsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [habitType, setHabitType] = useState<HabitType>('binary');
  const [target, setTarget] = useState('1');
  const [unit, setUnit] = useState('');

  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [timers, setTimers] = useState<Record<number, number>>({});
  const [now, setNow] = useState(Date.now());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setAuthorized(true);
    setTimers(readTimers());
    fetchHabits();
  }, [router]);

  useEffect(() => {
    if (Object.keys(timers).length === 0) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timers]);

  const saveTimers = (next: Record<number, number>) => {
    setTimers(next);
    localStorage.setItem(TIMER_KEY, JSON.stringify(next));
  };

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
      setFormOpen(false);
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
      const next = { ...timers };
      delete next[id];
      saveTimers(next);
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
        await api.post('/habitlogs/', { habit: habit.id, date: today(), value });
      }
      setInputs((prev) => ({ ...prev, [habit.id]: '' }));
      await fetchHabits();
    } catch {
      setError('Erro ao registar o progresso.');
    }
  };

  const stopTimer = async (habit: Habit, currentValue: number) => {
    const startedAt = timers[habit.id];
    if (!startedAt) return;
    const minutes = (Date.now() - startedAt) / 60000;
    const next = { ...timers };
    delete next[habit.id];
    saveTimers(next);
    if (minutes >= 0.1) {
      await logToday(habit, currentValue + Math.round(minutes * 10) / 10);
    }
  };

  if (!authorized) return <div className="min-h-screen bg-[#0b0d10]" />;

  const fmt = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');

  const doneTodayCount = habits.filter((h) =>
    h.logs?.some((l) => l.date === today() && l.completed)
  ).length;

  const dayPercent = habits.length > 0 ? Math.round((doneTodayCount / habits.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#e8e8e6]">
      <header className="border-b border-[#1c1f26] sticky top-0 bg-[#0b0d10]/90 backdrop-blur z-10">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
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

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium tracking-tight">Hábitos</h1>
            <p className="text-sm text-[#7d7d78] mt-1">
              {habits.length === 0
                ? 'Sem hábitos ainda'
                : `${doneTodayCount} de ${habits.length} concluídos hoje`}
            </p>
          </div>
          <button
            onClick={() => setFormOpen(!formOpen)}
            className="text-xs text-[#7d7d78] hover:text-[#e8e8e6] border border-[#232830] hover:border-[#3a4150] px-4 py-2 rounded-md transition-colors shrink-0"
          >
            {formOpen ? 'Cancelar' : 'Novo hábito'}
          </button>
        </div>

        {habits.length > 0 && (
          <div className="border border-[#26303f] bg-[#141821] rounded-xl px-6 pt-5 pb-2">
            <div className="flex items-baseline justify-between">
              <p className="text-sm text-[#8b8b86]">Progresso do dia</p>
              <span className={`font-mono text-3xl leading-none font-medium tabular-nums ${dayPercent === 100 ? 'text-[#97C459]' : 'text-[#e8e8e6]'}`}>
                {dayPercent}%
              </span>
            </div>
            <svg viewBox="0 0 640 92" className="w-full mt-1" aria-hidden="true">
              <line x1="28" y1="72" x2="606" y2="34" stroke="#26303f" strokeWidth="2" strokeLinecap="round" />
              <line
                x1="28"
                y1="72"
                x2={28 + (dayPercent / 100) * 578}
                y2={72 - (dayPercent / 100) * 38}
                stroke="#639922"
                strokeWidth="2"
                strokeLinecap="round"
                style={{ transition: 'x2 700ms cubic-bezier(0.4, 0, 0.2, 1), y2 700ms cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
              <circle cx="606" cy="22" r="2.5" fill="#3a4657" />
              <g
                style={{
                  transform: `translate(${28 + (dayPercent / 100) * 578}px, ${72 - (dayPercent / 100) * 38 - 15}px) rotate(${(dayPercent / 100) * 540}deg)`,
                  transition: 'transform 700ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <path d="M 0 -13 L 7 -10.5 L 12 -4 L 12 6 L 5 12 L -4 13 L -11 7 L -13 0 L -9 -8 L -4 -13 Z" fill="#7d7d78" />
                <path d="M 0 -13 L 7 -10.5 L 5 -3 L -2 -6 Z" fill="#918f8a" />
                <path d="M -9 -8 L -4 -13 L -2 -6 L -8 -1 Z" fill="#a3a19b" />
                <path d="M -13 0 L -8 -1 L -6 6 L -11 7 Z" fill="#67665f" />
                <path d="M 5 -3 L 12 6 L 5 12 L 1 5 Z" fill="#67665f" />
                <path d="M -2 -6 L 5 -3 L 1 5 L -6 6 Z" fill="#8a8883" />
                <path d="M -6 6 L 1 5 L 5 12 L -4 13 Z" fill="#74736d" />
              </g>
            </svg>
          </div>
        )}

        {error && (
          <div className="border border-[#7a2c2c] bg-[#7a2c2c]/10 text-[#f09595] p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {formOpen && (
          <div className="border border-[#26303f] bg-[#141821] rounded-xl p-5 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#7d7d78] block mb-1.5">Nome</label>
                <input
                  type="text"
                  placeholder="Beber água"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0b0d10] border border-[#26303f] text-[#e8e8e6] px-3 py-2.5 rounded-md text-sm outline-none focus:border-[#639922] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-[#7d7d78] block mb-1.5">Tipo</label>
                <select
                  value={habitType}
                  onChange={(e) => {
                    const t = e.target.value as HabitType;
                    setHabitType(t);
                    if (t === 'binary') { setTarget('1'); setUnit(''); }
                    if (t === 'duration') { setTarget('60'); setUnit('min'); }
                    if (t === 'quantity') { setTarget(''); setUnit(''); }
                  }}
                  className="w-full bg-[#0b0d10] border border-[#26303f] text-[#e8e8e6] px-3 py-2.5 rounded-md text-sm outline-none focus:border-[#639922] transition-colors"
                >
                  <option value="binary">Sim ou não</option>
                  <option value="quantity">Quantidade</option>
                  <option value="duration">Duração</option>
                </select>
              </div>
            </div>

            {habitType !== 'binary' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#7d7d78] block mb-1.5">Meta diária</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder={habitType === 'duration' ? '60' : '5'}
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full bg-[#0b0d10] border border-[#26303f] text-[#e8e8e6] px-3 py-2.5 rounded-md text-sm outline-none focus:border-[#639922] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#7d7d78] block mb-1.5">Unidade</label>
                  <input
                    type="text"
                    placeholder={habitType === 'duration' ? 'min' : 'L'}
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-[#0b0d10] border border-[#26303f] text-[#e8e8e6] px-3 py-2.5 rounded-md text-sm outline-none focus:border-[#639922] transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-[#7d7d78] block mb-1.5">Descrição</label>
              <input
                type="text"
                placeholder="Opcional"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#0b0d10] border border-[#26303f] text-[#e8e8e6] px-3 py-2.5 rounded-md text-sm outline-none focus:border-[#639922] transition-colors"
              />
            </div>

            <button
              onClick={addHabit}
              disabled={loading || !name.trim()}
              className="w-full bg-[#639922] hover:bg-[#97C459] disabled:opacity-40 text-[#173404] py-2.5 rounded-md font-medium text-sm transition-colors"
            >
              {loading ? 'A criar' : 'Criar hábito'}
            </button>
          </div>
        )}

        <div className="space-y-3">
          {habits.length === 0 && !formOpen && (
            <div className="border border-dashed border-[#1c1f26] rounded-xl py-16 text-center">
              <p className="text-sm text-[#7d7d78]">Cria o primeiro hábito e começa a empurrar a pedra.</p>
            </div>
          )}

          {habits.map((habit) => {
            const logs = habit.logs || [];
            const target = habit.target && habit.target > 0 ? habit.target : 1;
            const isBinary = habit.habit_type === 'binary' || !habit.habit_type;
            const isDuration = habit.habit_type === 'duration';
            const streak = calcStreak(logs);
            const todayLog = logs.find((l) => l.date === today());
            const value = todayLog?.value ?? 0;
            const percent = Math.min(100, Math.round((value / target) * 100));
            const doneToday = todayLog?.completed ?? false;
            const doneDates = new Set(logs.filter((l) => l.completed).map((l) => l.date));
            const startedAt = timers[habit.id];
            const elapsed = startedAt ? Math.floor((now - startedAt) / 1000) : 0;

            const accent = doneToday ? '#639922' : value > 0 ? '#EF9F27' : '#2a3441';
            const numberColor = doneToday ? 'text-[#639922]' : value > 0 ? 'text-[#EF9F27]' : 'text-[#7d7d78]';
            const barColor = doneToday ? 'bg-[#639922]' : 'bg-[#EF9F27]';

            return (
              <div
                key={habit.id}
                className="border border-[#26303f] bg-[#141821] p-5 space-y-5 transition-colors"
                style={{ borderLeft: `3px solid ${accent}`, borderRadius: '0 12px 12px 0' }}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-medium text-white">{habit.name}</h2>
                      {streak > 0 && (
                        <span className="font-mono text-[11px] font-medium text-[#412402] bg-[#EF9F27] px-2 py-0.5 rounded-full">
                          {streak} {streak === 1 ? 'dia' : 'dias'}
                        </span>
                      )}
                    </div>
                    {habit.description && (
                      <p className="text-xs text-[#8b8b86] mt-1.5">{habit.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="text-xs text-[#5f5f5b] hover:text-[#f09595] transition-colors shrink-0"
                  >
                    Remover
                  </button>
                </div>

                {isBinary ? (
                  <button
                    onClick={() => logToday(habit, doneToday ? 0 : 1)}
                    className={`w-full py-3 rounded-md text-sm font-medium transition-colors ${
                      doneToday
                        ? 'bg-[#639922] text-[#173404] hover:bg-[#97C459]'
                        : 'border border-[#2a3441] text-[#8b8b86] hover:border-[#639922]/50 hover:text-white'
                    }`}
                  >
                    {doneToday ? 'Concluído hoje' : 'Marcar como feito'}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-baseline gap-3">
                      <span className={`font-mono text-[44px] leading-none font-medium tabular-nums ${numberColor}`}>
                        {percent}%
                      </span>
                      <span className="text-sm text-[#b8b8b3]">
                        {fmt(value)} de {fmt(target)} {habit.unit}
                      </span>
                    </div>

                    <div className="h-3 bg-[#0b0d10] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    {isDuration && (
                      startedAt ? (
                        <div className="flex items-center gap-3 border border-[#639922]/40 bg-[#639922]/5 rounded-lg px-4 py-3">
                          <span className="w-2 h-2 rounded-full bg-[#639922] shrink-0 animate-pulse" />
                          <span className="font-mono text-2xl font-medium text-[#97C459] tabular-nums">
                            {formatElapsed(elapsed)}
                          </span>
                          <div className="flex gap-2 ml-auto">
                            <button
                              onClick={() => stopTimer(habit, value)}
                              className="text-xs text-[#173404] bg-[#639922] hover:bg-[#97C459] px-4 py-2 rounded-full font-medium transition-colors"
                            >
                              Parar
                            </button>
                            <button
                              onClick={() => {
                                const next = { ...timers };
                                delete next[habit.id];
                                saveTimers(next);
                              }}
                              className="text-xs text-[#5f5f5b] hover:text-white px-2 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => saveTimers({ ...timers, [habit.id]: Date.now() })}
                          className="w-full border border-[#2a3441] hover:border-[#639922]/50 text-[#8b8b86] hover:text-[#97C459] py-2.5 rounded-md text-sm font-medium transition-colors"
                        >
                          Iniciar timer
                        </button>
                      )
                    )}

                    <div className="flex items-center gap-2">
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
                        className="flex-1 bg-[#0b0d10] border border-[#26303f] text-[#e8e8e6] px-3 py-2 rounded-md text-sm outline-none focus:border-[#639922] transition-colors"
                      />
                      <button
                        onClick={() => {
                          const add = parseFloat((inputs[habit.id] ?? '').replace(',', '.'));
                          if (!isNaN(add)) logToday(habit, value + add);
                        }}
                        className="text-xs text-[#173404] bg-[#639922] hover:bg-[#97C459] px-4 py-2 rounded-md font-medium transition-colors"
                      >
                        Somar
                      </button>
                      {value > 0 && (
                        <button
                          onClick={() => logToday(habit, 0)}
                          className="text-xs text-[#5f5f5b] hover:text-white px-2 transition-colors"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-1">
                  <div className="flex gap-[3px] flex-wrap">
                    {lastDays(30).map((d) => (
                      <div
                        key={d}
                        title={d}
                        className={`w-[11px] h-[11px] rounded-sm ${
                          doneDates.has(d) ? 'bg-[#639922]' : 'bg-[#0b0d10]'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-[#5f5f5b] tracking-wider mt-2">ÚLTIMOS 30 DIAS</p>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}