'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/app/lib/api';
import { getToken, clearTokens } from '@/app/lib/auth';
import { getQuoteOfTheDay } from '@/app/lib/quotes';
import { getFigureOfTheDay } from '@/app/lib/figures';

interface HabitLog {
  date: string;
  value: number;
  completed: boolean;
}

interface Habit {
  id: number;
  name: string;
  logs: HabitLog[];
}

interface Book {
  id: number;
  title: string;
  author: string;
  status: string;
}

interface Workout {
  id: number;
  name: string;
  date: string;
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

function daysAgo(iso: string): string {
  const diff = Math.floor(
    (new Date(today() + 'T12:00:00').getTime() - new Date(iso + 'T12:00:00').getTime()) / 86400000
  );
  if (diff === 0) return 'hoje';
  if (diff === 1) return 'ontem';
  return `há ${diff} dias`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [quote, setQuote] = useState({ text: '', author: '' });
  const [figure, setFigure] = useState({ name: '', initials: '', years: '', story: '' });
  const [habits, setHabits] = useState<Habit[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setAuthorized(true);
    setQuote(getQuoteOfTheDay());
    setFigure(getFigureOfTheDay());
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const [h, b, w] = await Promise.all([
        api.get('/habits/').catch(() => []),
        api.get('/books/').catch(() => []),
        api.get('/workouts/').catch(() => []),
      ]);
      if (Array.isArray(h)) setHabits(h as Habit[]);
      if (Array.isArray(b)) setBooks(b as Book[]);
      if (Array.isArray(w)) setWorkouts(w as Workout[]);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  };

  if (!authorized) return <div className="min-h-screen bg-[#0b0d10]" />;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0d10] flex items-center justify-center">
        <p className="text-sm text-[#5f5f5b] animate-pulse">A carregar</p>
      </div>
    );
  }

  const isDone = (h: Habit) => h.logs?.some((l) => l.date === today() && l.completed) ?? false;
  const doneToday = habits.filter(isDone);
  const pendingToday = habits.filter((h) => !isDone(h));
  const bestStreak = habits.reduce((max, h) => Math.max(max, calcStreak(h.logs || [])), 0);
  const habitProgress = habits.length > 0 ? Math.round((doneToday.length / habits.length) * 100) : 0;

  const reading = books.filter((b) => b.status === 'reading');
  const wantToRead = books.filter((b) => b.status === 'want').length;
  const readCount = books.filter((b) => b.status === 'done').length;

  const sortedWorkouts = [...workouts].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const workoutsThisMonth = workouts.filter((w) => w.date?.startsWith(today().slice(0, 7))).length;

  const rockX = 14 + (habitProgress / 100) * 292;
  const rockY = 48 - (habitProgress / 100) * 34;

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#e8e8e6]">
      <header className="border-b border-[#1c1f26]">
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
          <span className="text-xl font-medium tracking-tight text-white">SisyphusTracker</span>
          <button
            onClick={() => { clearTokens(); router.push('/login'); }}
            className="text-xs text-[#7d7d78] hover:text-[#e8e8e6] transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-medium tracking-tight text-white">Painel</h1>
          <p className="text-sm text-[#7d7d78] mt-1.5">
            {habits.length === 0
              ? 'Começa por criar um hábito.'
              : `${doneToday.length} de ${habits.length} hábitos concluídos hoje.`}
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.7fr_1fr] gap-4">
          <div className="grid gap-3 content-start">
            <Link
              href="/habits"
              className="group border border-[#26303f] bg-[#141821] hover:border-[#3a4657] p-6 transition-colors"
              style={{ borderLeft: '3px solid #639922', borderRadius: '0 12px 12px 0' }}
            >
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-medium text-white">Hábitos</h2>
                <span className="font-mono text-3xl leading-none font-medium text-[#97C459] tabular-nums">
                  {habitProgress}%
                </span>
              </div>

              <svg viewBox="0 0 320 60" className="w-full mt-3" aria-hidden="true">
                <line x1="14" y1="48" x2="306" y2="14" stroke="#26303f" strokeWidth="2" strokeLinecap="round" />
                <line
                  x1="14"
                  y1="48"
                  x2={rockX}
                  y2={rockY}
                  stroke="#639922"
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{ transition: 'all 500ms' }}
                />
                <circle cx="306" cy="8" r="2" fill="#3a4657" />
                <g
                  style={{
                    transform: `translate(${rockX}px, ${rockY - 7}px)`,
                    transition: 'transform 500ms',
                  }}
                >
                  <path d="M 0 -6.5 L 3.5 -5.5 L 6 -2 L 6 3 L 2.5 6 L -2 6.5 L -5.5 3.5 L -6.5 0 L -5 -4 L -2 -6.5 Z" fill="#7d7d78" />
                  <path d="M 0 -6.5 L 3.5 -5.5 L 2.5 -2 L -1 -3 Z" fill="#918f8a" />
                  <path d="M -5 -4 L -2 -6.5 L -1 -3 L -4 -0.5 Z" fill="#a3a19b" />
                  <path d="M -6.5 0 L -4 -0.5 L -3 3 L -5.5 3.5 Z" fill="#67665f" />
                  <path d="M 2.5 -2 L 6 3 L 2.5 6 L 0.5 2.5 Z" fill="#67665f" />
                  <path d="M -1 -3 L 2.5 -2 L 0.5 2.5 L -3 3 Z" fill="#8a8883" />
                  <path d="M -3 3 L 0.5 2.5 L 2.5 6 L -2 6.5 Z" fill="#74736d" />
                </g>
              </svg>

              <div className="mt-3 space-y-2.5">
                {habits.length === 0 && <p className="text-xs text-[#5f5f5b]">Nenhum hábito criado.</p>}
                {pendingToday.map((h) => (
                  <div key={h.id} className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3a4657] shrink-0" />
                    <span className="text-base text-[#d8d8d4] truncate">{h.name}</span>
                  </div>
                ))}
                {doneToday.map((h) => (
                  <div key={h.id} className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#639922] shrink-0" />
                    <span className="text-base text-[#7f7f7b] line-through truncate">{h.name}</span>
                  </div>
                ))}
              </div>
            </Link>

            <Link
              href="/reading"
              className="group border border-[#26303f] bg-[#141821] hover:border-[#3a4657] p-6 transition-colors"
              style={{ borderLeft: '3px solid #7F77DD', borderRadius: '0 12px 12px 0' }}
            >
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-medium text-white">Leituras</h2>
                <div className="flex items-baseline gap-5">
                  <div className="text-right">
                    <span className="font-mono text-3xl leading-none font-medium text-[#AFA9EC] tabular-nums">
                      {readCount}
                    </span>
                    <p className="text-[11px] text-[#5f5f5b] mt-1.5">lidos</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xl leading-none font-medium text-[#7d7d78] tabular-nums">
                      {wantToRead}
                    </span>
                    <p className="text-[11px] text-[#5f5f5b] mt-1.5">por ler</p>
                  </div>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {reading.length === 0 && <p className="text-xs text-[#5f5f5b]">Nenhum livro em curso.</p>}
                {reading.slice(0, 3).map((b) => (
                  <div key={b.id} className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7F77DD] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-base text-[#d8d8d4] truncate">{b.title}</p>
                      <p className="text-sm text-[#9b9b96] truncate">{b.author}</p>
                    </div>
                  </div>
                ))}
                {reading.length > 3 && (
                  <p className="text-xs text-[#5f5f5b] pl-4.5">e mais {reading.length - 3} a ler</p>
                )}
              </div>
            </Link>

            <Link
              href="/workout"
              className="group border border-[#26303f] bg-[#141821] hover:border-[#3a4657] p-6 transition-colors"
              style={{ borderLeft: '3px solid #EF9F27', borderRadius: '0 12px 12px 0' }}
            >
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-medium text-white">Treinos</h2>
                <div className="flex items-baseline gap-5">
                  <div className="text-right">
                    <span className="font-mono text-3xl leading-none font-medium text-[#EF9F27] tabular-nums">
                      {workoutsThisMonth}
                    </span>
                    <p className="text-[11px] text-[#5f5f5b] mt-1.5">este mês</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xl leading-none font-medium text-[#7d7d78] tabular-nums">
                      {workouts.length}
                    </span>
                    <p className="text-[11px] text-[#5f5f5b] mt-1.5">no total</p>
                  </div>
                </div>
              </div>
              <div className="mt-5 space-y-2.5">
                {sortedWorkouts.length === 0 && (
                  <p className="text-xs text-[#5f5f5b]">Nenhum treino registado.</p>
                )}
                {sortedWorkouts.slice(0, 3).map((w) => (
                  <div key={w.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#EF9F27] shrink-0" />
                      <span className="text-base text-[#d8d8d4] truncate">{w.name}</span>
                    </div>
                    <span className="text-sm text-[#9b9b96] shrink-0">{daysAgo(w.date)}</span>
                  </div>
                ))}
              </div>
            </Link>
          </div>

          <div className="grid gap-3 content-start">
            {bestStreak > 0 && (
              <div className="border border-[#26303f] bg-[#141821] rounded-xl p-6 text-center">
                <p className="font-mono text-5xl leading-none font-medium text-[#EF9F27] tabular-nums">
                  {bestStreak}
                </p>
                <p className="text-xs text-[#7d7d78] mt-3">
                  {bestStreak === 1 ? 'dia de sequência' : 'dias de sequência'}
                </p>
              </div>
            )}

            <div className="border-l-[3px] border-[#639922] bg-[#141821] px-6 py-5">
              <p className="text-[#c8c8c4] leading-relaxed italic text-sm">&ldquo;{quote.text}&rdquo;</p>
              <p className="text-[11px] text-[#8b8b86] mt-3 not-italic">{quote.author}</p>
            </div>

            <div className="border border-[#26303f] bg-[#141821] rounded-xl p-6">
              <p className="text-[10px] text-[#5f5f5b] tracking-[0.1em] mb-4">FIGURA DO DIA</p>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#639922]/15 border border-[#639922]/40 flex items-center justify-center text-xs font-medium text-[#97C459] shrink-0">
                  {figure.initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{figure.name}</p>
                  <p className="text-[11px] text-[#5f5f5b]">{figure.years}</p>
                </div>
              </div>
              <p className="text-base text-[#d8d8d4] leading-relaxed">{figure.story}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}