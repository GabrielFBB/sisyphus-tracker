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
  status: string;
}

export default function ReadingPage() {
  const router = useRouter();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState<number>(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    fetchReadings();
  }, [router]);

  const fetchReadings = async () => {
    try {
      const data = await api.get('/readings/');
      if (Array.isArray(data)) setReadings(data as Reading[]);
    } catch {
      setError('Erro ao carregar lista de leituras.');
    }
  };

  const addReading = async () => {
    if (!title.trim() || !author.trim()) return;
    setLoading(true);
    setError('');

    try {
      await api.post('/readings/', {
        title,
        author,
        current_page: 0,
        total_pages: Number(totalPages) || 100,
        status: 'reading',
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

  const updateProgress = async (id: number, newPage: number, total: number) => {
    const clampedPage = Math.max(0, Math.min(newPage, total));
    try {
      await api.patch(`/readings/${id}/`, {
        current_page: clampedPage,
        status: clampedPage >= total ? 'completed' : 'reading',
      });
      await fetchReadings();
    } catch {
      setError('Erro ao atualizar progresso da leitura.');
    }
  };

  const deleteReading = async (id: number) => {
    try {
      await api.delete(`/readings/${id}/`);
      await fetchReadings();
    } catch {
      setError('Erro ao remover livro.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="text-gray-400 hover:text-white text-xs mb-2 block transition-colors">
              ← Voltar ao Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight">Leituras & Obras</h1>
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

        {/* Formulário de Registo */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl space-y-4 shadow-lg">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400">Adicionar Novo Livro</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Título da Obra</label>
              <input
                type="text"
                placeholder="Ex: A Odisseia"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 text-white p-3 rounded-lg text-sm outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Autor</label>
              <input
                type="text"
                placeholder="Ex: Homero"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 text-white p-3 rounded-lg text-sm outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Número Total de Páginas</label>
            <input
              type="number"
              value={totalPages}
              onChange={(e) => setTotalPages(Number(e.target.value))}
              className="w-full bg-gray-950 border border-gray-800 text-white p-3 rounded-lg text-sm outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={addReading}
            disabled={loading || !title.trim() || !author.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-emerald-600/20"
          >
            {loading ? 'A registar...' : 'Adicionar à Lista de Leituras'}
          </button>
        </div>

        {/* Lista de Livros */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight">Obras em Acompanhamento</h2>
          {readings.length === 0 && (
            <p className="text-gray-500 text-center py-8 text-sm">Nenhum livro registado de momento.</p>
          )}

          {readings.map((reading) => {
            const percent = Math.min(100, Math.round((reading.current_page / reading.total_pages) * 100)) || 0;

            return (
              <div key={reading.id} className="bg-gray-900 border border-gray-800 p-5 rounded-xl space-y-4 shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-base text-white">{reading.title}</h3>
                    <p className="text-xs text-gray-400">{reading.author}</p>
                  </div>
                  <button
                    onClick={() => deleteReading(reading.id)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Remover
                  </button>
                </div>

                {/* Barra de Progresso */}
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

                {/* Controlo Rápido de Páginas */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-800/60 text-xs">
                  <span className="text-gray-400">Atualizar página atual:</span>
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}