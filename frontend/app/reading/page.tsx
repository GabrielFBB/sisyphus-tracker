'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/app/lib/api';
import { getToken, clearTokens } from '@/app/lib/auth';

type Status = 'want' | 'reading' | 'done';

interface Book {
  id: number;
  title: string;
  author: string;
  status: Status;
  owned: boolean;
  notes: string;
}

export default function ReadingPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [activeTab, setActiveTab] = useState<Status>('reading');
  const [mode, setMode] = useState<'single' | 'bulk'>('single');

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [initialStatus, setInitialStatus] = useState<Status>('reading');
  const [initialOwned, setInitialOwned] = useState(false);

  const [bulkText, setBulkText] = useState('');
  const [bulkStatus, setBulkStatus] = useState<Status>('want');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setAuthorized(true);
    fetchBooks();
  }, [router]);

  const fetchBooks = async () => {
    try {
      const data = await api.get('/books/');
      if (Array.isArray(data)) setBooks(data as Book[]);
    } catch {
      setError('Erro ao carregar a lista de livros.');
    }
  };

  const addSingle = async () => {
    if (!title.trim() || !author.trim()) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/books/', {
        title: title.trim(),
        author: author.trim(),
        status: initialStatus,
        owned: initialOwned,
      });
      setTitle('');
      setAuthor('');
      setInitialOwned(false);
      await fetchBooks();
    } catch {
      setError('Erro ao adicionar livro.');
    } finally {
      setLoading(false);
    }
  };

  const addBulk = async () => {
    if (!bulkText.trim()) return;
    setLoading(true);
    setError('');
    const lines = bulkText.split('\n').filter((l) => l.trim() !== '');
    try {
      for (const line of lines) {
        const parts = line.split(/[-–—]/);
        const bookTitle = (parts[0] || line).trim();
        const bookAuthor = parts[1]?.trim() || 'Desconhecido';
        await api.post('/books/', {
          title: bookTitle,
          author: bookAuthor,
          status: bulkStatus,
          owned: bulkStatus === 'done',
        });
      }
      setBulkText('');
      await fetchBooks();
    } catch {
      setError('Erro ao processar a lista.');
    } finally {
      setLoading(false);
    }
  };

  const updateBook = async (book: Book, changes: Partial<Book>) => {
    try {
      await api.put(`/books/${book.id}/`, {
        title: book.title,
        author: book.author,
        status: book.status,
        owned: book.owned,
        notes: book.notes || '',
        ...changes,
      });
      await fetchBooks();
    } catch {
      setError('Erro ao atualizar o livro.');
    }
  };

  const deleteBook = async (id: number) => {
    try {
      await api.delete(`/books/${id}/`);
      await fetchBooks();
    } catch {
      setError('Erro ao remover o livro.');
    }
  };

  if (!authorized) return <div className="min-h-screen bg-gray-950" />;

  const countOf = (s: Status) => books.filter((b) => b.status === s).length;
  const filtered = books.filter((b) => b.status === activeTab);

  const tabs: { key: Status; label: string }[] = [
    { key: 'reading', label: 'A Ler' },
    { key: 'want', label: 'Por Ler' },
    { key: 'done', label: 'Lidos' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="text-gray-400 hover:text-white text-xs mb-2 block transition-colors">
              ← Voltar ao Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight">Biblioteca &amp; Leituras</h1>
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
                Em Lote
              </button>
            </div>
          </div>

          {mode === 'single' ? (
            <div className="space-y-4 pt-2">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Título</label>
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

              <div className="grid md:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Estado</label>
                  <select
                    value={initialStatus}
                    onChange={(e) => setInitialStatus(e.target.value as Status)}
                    className="w-full bg-gray-950 border border-gray-800 text-white p-3 rounded-lg text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="want">Por Ler</option>
                    <option value="reading">A Ler</option>
                    <option value="done">Lido</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer p-3">
                  <input
                    type="checkbox"
                    checked={initialOwned}
                    onChange={(e) => setInitialOwned(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500"
                  />
                  Já tenho o livro
                </label>
              </div>

              <button
                onClick={addSingle}
                disabled={loading || !title.trim() || !author.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3 rounded-lg font-bold text-sm transition-colors"
              >
                {loading ? 'A registar...' : 'Adicionar Livro'}
              </button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Um livro por linha, no formato <code className="text-emerald-400">Título - Autor</code>
                </label>
                <textarea
                  rows={4}
                  placeholder={'Crime e Castigo - Dostoiévski\nA Metamorfose - Kafka'}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 text-white p-3 rounded-lg text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Adicionar todos como:</label>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value as Status)}
                  className="w-full bg-gray-950 border border-gray-800 text-white p-3 rounded-lg text-sm outline-none focus:border-emerald-500"
                >
                  <option value="want">Por Ler</option>
                  <option value="done">Já Lidos</option>
                </select>
              </div>
              <button
                onClick={addBulk}
                disabled={loading || !bulkText.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3 rounded-lg font-bold text-sm transition-colors"
              >
                {loading ? 'A processar...' : 'Adicionar Lista'}
              </button>
            </div>
          )}
        </div>

        <div className="flex border-b border-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${activeTab === tab.key ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
            >
              {tab.label} ({countOf(tab.key)})
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.length === 0 && (
            <p className="text-gray-500 text-center py-12 text-sm">Nenhum livro nesta categoria.</p>
          )}
          {filtered.map((book) => (
            <div key={book.id} className="bg-gray-900 border border-gray-800 p-5 rounded-xl shadow-md">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <h3 className="font-bold text-base text-white truncate">{book.title}</h3>
                  <p className="text-xs text-gray-400">{book.author}</p>
                  <label className="flex items-center gap-2 text-xs text-gray-300 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={book.owned}
                      onChange={(e) => updateBook(book, { owned: e.target.checked })}
                      className="w-4 h-4 accent-emerald-500"
                    />
                    Já tenho
                  </label>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <select
                    value={book.status}
                    onChange={(e) => updateBook(book, { status: e.target.value as Status })}
                    className="bg-gray-950 border border-gray-800 text-xs text-gray-300 rounded px-2 py-1 outline-none"
                  >
                    <option value="want">Por Ler</option>
                    <option value="reading">A Ler</option>
                    <option value="done">Lido</option>
                  </select>
                  <button
                    onClick={() => deleteBook(book.id)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}