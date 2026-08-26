'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/app/lib/api';
import { getToken, clearTokens } from '@/app/lib/auth';

interface Reading {
  id: number;
  title: string;
  author: string;
  current_page: number;
  total_pages: number;
  status: 'unread' | 'reading' | 'completed';
}

export default function ReadingPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [activeTab, setActiveTab] = useState<'reading' | 'unread' | 'completed'>('reading');
  const [mode, setMode] = useState<'single' | 'bulk'>('single');

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState<number>(100);
  const [initialStatus, setInitialStatus] = useState<'unread' | 'reading' | 'completed'>('reading');

  const [bulkText, setBulkText] = useState('');
  const [bulkStatus, setBulkStatus] = useState<'unread' | 'completed'>('unread');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
    } else {
      setAuthorized(true);
      fetchReadings();
    }
  }, [router]);

  const fetchReadings = async () => {
    try {
      const data = await api.get('/readings/');
      if (Array.isArray(data)) setReadings(data as Reading[]);
    } catch {
      setError('Erro ao carregar lista de leituras.');
    }
  };

  const addSingleReading = async () => {
    if (!title.trim() || !author.trim()) return;
    setLoading(true);
    setError('');

    const total = Number(totalPages) || 100;
    const current = initialStatus === 'completed' ? total : initialStatus === 'reading' ? 1 : 0;

    try {
      await api.post('/readings/', {
        title,
        author,
        current_page: current,
        total_pages: total,
        status: initialStatus,
      });

      setTitle('');
      setAuthor('');
      setTotalPages(100);
      await fetchReadings();
    } catch {
      setError('Erro ao adicionar livro.');
    } finally {
      setLoading(false);
    }
  };

  const addBulkReadings = async () => {
    if (!bulkText.trim()) return;
    setLoading(true);
    setError('');

    const lines = bulkText.split('\n').filter((l) => l.trim() !== '');

    try {
      for (const line of lines) {
        const parts = line.split(/[-–—]/);
        const bookTitle = parts[0]?.trim() || line.trim();
        const bookAuthor = parts[1]?.trim() ? parts[1].trim() : 'Desconhecido';

        await api.post('/readings/', {
          title: bookTitle,
          author: bookAuthor,
          current_page: bulkStatus === 'completed' ? 200 : 0,
          total_pages: 200,
          status: bulkStatus,
        });
      }

      setBulkText('');
      await fetchReadings();
    } catch {
      setError('Erro ao processar adição em lote.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, newStatus: 'unread' | 'reading' | 'completed', total: number) => {
    const current = newStatus === 'completed' ? total : newStatus === 'reading' ? 1 : 0;
    const target = readings.find(r => r.id === id);
    if (!target) return;

    try {
      // @ts-ignore
      await api.put(`/readings/${id}/`, {
        title: target.title,
        author: target.author,
        total_pages: target.total_pages,
        status: newStatus,
        current_page: current,
      });
      await fetchReadings();
    } catch {
      setError('Erro ao atualizar estado do livro.');
    }
  };

  const updateProgress = async (id: number, newPage: number, total: number) => {
    const clampedPage = Math.max(0, Math.min(newPage, total));
    const newStatus = clampedPage >= total ? 'completed' : clampedPage > 0 ? 'reading' : 'unread';
    const target = readings.find(r => r.id === id);
    if (!target) return;

    try {
      // @ts-ignore
      await api.put(`/readings/${id}/`, {
        title: target.title,
        author: target.author,
        total_pages: target.total_pages,
        current_page: clampedPage,
        status: newStatus,
      });
      await fetchReadings();
    } catch {
      setError('Erro ao atualizar progresso.');
    }
  };

  const deleteReading = async (id: number) => {
    try {
      // @ts-ignore
      await api.delete(`/readings/${id}/`);
      await fetchReadings();
    } catch {
      setError('Erro ao remover livro.');
    }
  };

  if (!authorized) {
    return <div className="min-h-screen bg-gray-950" />;
  }

  const filteredReadings = readings.filter((r) => r.status === activeTab);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="text-gray-400 hover:text-white text-xs mb-2 block transition-colors">
              ← Voltar ao Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight">Biblioteca & Leituras</h1>
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

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400">Adicionar Livros</h2>
            <div className="flex gap-2 bg-gray-950 p-1 rounded-lg border border-gray-800 text-xs">
              <button
                onClick={() => setMode('single')}
                className={`px-3 py-1 rounded transition-colors ${mode === 'single' ? 'bg-emerald-600 text-white font-semibold' : 'text-gray-400 hover:text-white'}`}
              >
                Individual
              </button>
              <button
                onClick={() => setMode('bulk')}
                className={`px-3 py-1 rounded transition-colors ${mode === 'bulk' ? 'bg-emerald-600 text-white font-semibold' : 'text-gray-400 hover:text-white'}`}
              >
                Em Lote (Lista)
              </button>
            </div>
          </div>

          {mode === 'single' ? (
            <div className="space-y-4 pt-2">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Título da Obra</label>
                  <input
                    type="text"
                    placeholder="Ex: O Mito de Sísifo"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 text-white p-3 rounded-lg text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Autor</label>
                  <input
                    type="text"
                    placeholder="Ex: Albert Camus"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 text-white p-3 rounded-lg text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Nº Total de Páginas</label>
                  <input
                    type="number"
                    value={totalPages}
                    onChange={(e) => setTotalPages(Number(e.target.value))}
                    className="w-full bg-gray-950 border border-gray-800 text-white p-3 rounded-lg text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Estado Inicial</label>
                  <select
                    value={initialStatus}
                    onChange={(e) => setInitialStatus(e.target.value as 'unread' | 'reading' | 'completed')}
                    className="w-full bg-gray-950 border border-gray-800 text-white p-3 rounded-lg text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="unread">Por Ler (Wishlist)</option>
                    <option value="reading">A Ler Atualmente</option>
                    <option value="completed">Já Lido</option>
                  </select>
                </div>
              </div>

              <button
                onClick={addSingleReading}
                disabled={loading || !title.trim() || !author.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-emerald-600/20"
              >
                {loading ? 'A registar...' : 'Adicionar Livro'}
              </button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Cole a sua lista (um livro por linha, ex: <code className="text-emerald-400">Título - Autor</code>)
                </label>
                <textarea
                  rows={4}
                  placeholder={'Crime e Castigo - Fiódor Dostoiévski\nA Metamorfose - Franz Kafka'}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 text-white p-3 rounded-lg text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Adicionar todos para:</label>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value as 'unread' | 'completed')}
                  className="w-full bg-gray-950 border border-gray-800 text-white p-3 rounded-lg text-sm outline-none focus:border-emerald-500"
                >
                  <option value="unread">Por Ler (Wishlist)</option>
                  <option value="completed">Já Lidos</option>
                </select>
              </div>

              <button
                onClick={addBulkReadings}
                disabled={loading || !bulkText.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-emerald-600/20"
              >
                {loading ? 'A processar lista...' : 'Adicionar Lista em Lote'}
              </button>
            </div>
          )}
        </div>

        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('reading')}
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'reading' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
          >
            A Ler ({readings.filter((r) => r.status === 'reading').length})
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'unread' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
          >
            Por Ler / Wishlist ({readings.filter((r) => r.status === 'unread').length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'completed' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
          >
            Lidos ({readings.filter((r) => r.status === 'completed').length})
          </button>
        </div>

        <div className="space-y-4">
          {filteredReadings.length === 0 && (
            <p className="text-gray-500 text-center py-12 text-sm">Nenhum livro nesta categoria.</p>
          )}

          {filteredReadings.map((reading) => {
            const percent = reading.status === 'completed' ? 100 : Math.min(100, Math.round((reading.current_page / reading.total_pages) * 100)) || 0;

            return (
              <div key={reading.id} className="bg-gray-900 border border-gray-800 p-5 rounded-xl space-y-4 shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-base text-white">{reading.title}</h3>
                    <p className="text-xs text-gray-400">{reading.author}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={reading.status}
                      onChange={(e) => updateStatus(reading.id, e.target.value as 'unread' | 'reading' | 'completed', reading.total_pages)}
                      className="bg-gray-950 border border-gray-800 text-xs text-gray-300 rounded px-2 py-1 outline-none"
                    >
                      <option value="unread">Por Ler</option>
                      <option value="reading">A Ler</option>
                      <option value="completed">Lido</option>
                    </select>
                    <button
                      onClick={() => deleteReading(reading.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                </div>

                {reading.status !== 'unread' && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono text-gray-400">
                      <span>Progresso: {reading.current_page} / {reading.total_pages} pág.</span>
                      <span className="text-emerald-400 font-bold">{percent}%</span>
                    </div>
                    <div className="w-full bg-gray-950 h-2 rounded-full overflow-hidden border border-gray-800">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )}

                {reading.status === 'reading' && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-800/60 text-xs">
                    <span className="text-gray-400">Atualizar páginas:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateProgress(reading.id, reading.current_page - 10, reading.total_pages)}
                        className="bg-gray-800 hover:bg-gray-700 px-2.5 py-1 rounded text-gray-300 transition-colors"
                      >
                        -10
                      </button>
                      <button
                        onClick={() => updateProgress(reading.id, reading.current_page - 1, reading.total_pages)}
                        className="bg-gray-800 hover:bg-gray-700 px-2.5 py-1 rounded text-gray-300 transition-colors"
                      >
                        -1
                      </button>
                      <span className="font-mono font-bold px-2 text-white">{reading.current_page}</span>
                      <button
                        onClick={() => updateProgress(reading.id, reading.current_page + 1, reading.total_pages)}
                        className="bg-gray-800 hover:bg-gray-700 px-2.5 py-1 rounded text-gray-300 transition-colors"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => updateProgress(reading.id, reading.current_page + 10, reading.total_pages)}
                        className="bg-gray-800 hover:bg-gray-700 px-2.5 py-1 rounded text-gray-300 transition-colors"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}