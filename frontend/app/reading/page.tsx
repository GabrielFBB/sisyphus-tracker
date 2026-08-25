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
  total_pages: number;
  current_page: number;
  status: 'reading' | 'completed' | 'want_to_read';
}

export default function ReadingPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [currentPage, setCurrentPage] = useState('');
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
      const data = await api.get('/reading/');
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
      await api.post('/reading/', {
        title,
        author,
        total_pages: Number(totalPages) || 0,
        current_page: Number(currentPage) || 0,
        status: 'reading',
      });
      setTitle('');
      setAuthor('');
      setTotalPages('');
      setCurrentPage('');
      await fetchBooks();
    } catch {
      setError('Erro ao adicionar livro.');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (book: Book, newPage: number) => {
    const validPage = Math.max(0, Math.min(newPage, book.total_pages || newPage));
    const isCompleted = book.total_pages > 0 && validPage >= book.total_pages;

    try {
      setBooks((prev) =>
        prev.map((b) =>
          b.id === book.id
            ? {
                ...b,
                current_page: validPage,
                status: isCompleted ? 'completed' : b.status,
              }
            : b
        )
      );

      await api.put(`/reading/${book.id}/`, {
        title: book.title,
        author: book.author,
        total_pages: book.total_pages,
        current_page: validPage,
        status: isCompleted ? 'completed' : book.status,
      });
    } catch {
      setError('Erro ao atualizar progresso.');
      await fetchBooks();
    }
  };

  const deleteBook = async (id: number) => {
    try {
      await api.delete(`/reading/${id}/`);
      await fetchBooks();
    } catch {
      setError('Erro ao eliminar livro.');
    }
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
            placeholder="Título do livro"
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
          <div className="grid grid-cols-2 gap-3 mb-4">
            <input
              type="number"
              placeholder="Total de páginas"
              value={totalPages}
              onChange={(e) => setTotalPages(e.target.value)}
              className="bg-gray-700 text-white p-3 rounded outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="number"
              placeholder="Página atual"
              value={currentPage}
              onChange={(e) => setCurrentPage(e.target.value)}
              className="bg-gray-700 text-white p-3 rounded outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={addBook}
            disabled={loading || !title.trim() || !author.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded font-bold transition-colors"
          >
            {loading ? 'A adicionar...' : 'Adicionar'}
          </button>
        </div>

        <div className="space-y-4">
          {books.length === 0 && (
            <p className="text-gray-400 text-center py-4">Nenhum livro registado ainda.</p>
          )}
          {books.map((book) => {
            const percentage =
              book.total_pages > 0
                ? Math.min(100, Math.round((book.current_page / book.total_pages) * 100))
                : 0;

            return (
              <div key={book.id} className="bg-gray-800 p-5 rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{book.title}</h3>
                    <p className="text-gray-400 text-sm">{book.author}</p>
                  </div>
                  <button
                    onClick={() => deleteBook(book.id)}
                    className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                  >
                    Eliminar
                  </button>
                </div>

                {book.total_pages > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Progresso</span>
                      <span>{percentage}% ({book.current_page} / {book.total_pages} págs)</span>
                    </div>
                    <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-gray-400">Atualizar página:</span>
                  <input
                    type="number"
                    defaultValue={book.current_page}
                    onBlur={(e) => updateProgress(book, Number(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        updateProgress(book, Number((e.target as HTMLInputElement).value));
                      }
                    }}
                    className="w-20 bg-gray-700 text-white text-sm p-1 px-2 rounded outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}