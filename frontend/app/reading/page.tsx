'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/app/lib/api';
import { getToken, clearTokens } from '@/app/lib/auth';

interface Book {
  id: number;
  title: string;
  author: string;
  status: string;
  rating: number | null;
  notes: string;
}

export default function ReadingPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('want');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const data = await api.get('/books/', token);
      if (Array.isArray(data)) setBooks(data);
    } catch {
      setError('Erro ao carregar a lista de livros.');
    }
  };

  const addBook = async () => {
    if (!title.trim() || !author.trim()) return;
    setLoading(true);
    setError('');

    try {
      const token = getToken();
      await api.post('/books/', { title, author, status }, token!);
      setTitle('');
      setAuthor('');
      setStatus('want');
      await fetchBooks();
    } catch {
      setError('Erro ao adicionar livro.');
    } finally {
      setLoading(false);
    }
  };

  const deleteBook = async (id: number) => {
    try {
      const token = getToken();
      await api.delete(`/books/${id}/`, token!);
      await fetchBooks();
    } catch {
      setError('Erro ao eliminar livro.');
    }
  };

  const statusLabel = (s: string) => {
    if (s === 'want') return 'Quero Ler';
    if (s === 'reading') return 'A Ler';
    return 'Lido';
  };

  const statusColor = (s: string) => {
    if (s === 'want') return 'text-yellow-400';
    if (s === 'reading') return 'text-blue-400';
    return 'text-green-400';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm mb-2 block">
              ← Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Leituras</h1>
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

        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-4">Novo Livro</h2>
          <input
            type="text"
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-gray-700 text-white p-3 rounded mb-3 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="Autor"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full bg-gray-700 text-white p-3 rounded mb-3 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-gray-700 text-white p-3 rounded mb-4 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="want">Quero Ler</option>
            <option value="reading">A Ler</option>
            <option value="done">Lido</option>
          </select>
          <button
            onClick={addBook}
            disabled={loading || !title.trim() || !author.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded font-bold transition-colors"
          >
            {loading ? 'A adicionar...' : 'Adicionar'}
          </button>
        </div>

        <div className="space-y-3">
          {books.length === 0 && (
            <p className="text-gray-400 text-center py-4">Nenhum livro ainda. Adiciona o primeiro!</p>
          )}
          {books.map((book) => (
            <div key={book.id} className="bg-gray-800 p-4 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-semibold">{book.title}</p>
                <p className="text-gray-400 text-sm">{book.author}</p>
                <p className={`text-sm ${statusColor(book.status)}`}>{statusLabel(book.status)}</p>
              </div>
              <button
                onClick={() => deleteBook(book.id)}
                className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}