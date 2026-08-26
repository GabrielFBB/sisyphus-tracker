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
  rating: number | null;
  notes: string;
}

interface ParsedBook {
  title: string;
  author: string;
}

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

function parseBulk(text: string): ParsedBook[] {
  const chunks = text
    .split(/[\n!;/]+/)
    .map((c) => c.trim())
    .filter((c) => c.length > 1);

  return chunks.map((chunk) => {
    const cleaned = chunk.replace(/^[\s\-–—•*]+/, '').trim();

    const dashMatch = cleaned.split(/\s[-–—]\s|[-–—]/);
    if (dashMatch.length > 1 && dashMatch[1].trim()) {
      return {
        title: dashMatch[0].trim(),
        author: dashMatch.slice(1).join(' ').trim(),
      };
    }

    const byMatch = cleaned.match(/^(.+?)\s+d[eao]\s+([A-ZÀ-Ú][\wÀ-ú.'-]*(?:\s+[A-ZÀ-Ú][\wÀ-ú.'-]*)*)$/);
    if (byMatch) {
      return { title: byMatch[1].trim(), author: byMatch[2].trim() };
    }

    return { title: cleaned, author: 'Desconhecido' };
  }).filter((b) => b.title.length > 1);
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
  const [bulkResult, setBulkResult] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editRating, setEditRating] = useState('');
  const [editNotes, setEditNotes] = useState('');

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
    if (books.some((b) => normalize(b.title) === normalize(title))) {
      setError(`"${title.trim()}" já está na tua lista.`);
      return;
    }
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
    setBulkResult('');

    const parsed = parseBulk(bulkText);
    const existing = new Set(books.map((b) => normalize(b.title)));
    const seen = new Set<string>();

    let added = 0;
    let skipped = 0;

    try {
      for (const book of parsed) {
        const key = normalize(book.title);
        if (existing.has(key) || seen.has(key)) {
          skipped++;
          continue;
        }
        seen.add(key);
        await api.post('/books/', {
          title: book.title,
          author: book.author,
          status: bulkStatus,
          owned: bulkStatus === 'done',
        });
        added++;
      }
      setBulkText('');
      setBulkResult(
        skipped > 0
          ? `${added} adicionados, ${skipped} já existiam.`
          : `${added} livros adicionados.`
      );
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
        rating: book.rating,
        notes: book.notes || '',
        ...changes,
      });
      await fetchBooks();
    } catch {
      setError('Erro ao atualizar o livro.');
    }
  };

  const startEdit = (book: Book) => {
    setEditingId(book.id);
    setEditTitle(book.title);
    setEditAuthor(book.author);
    setEditRating(book.rating !== null ? String(book.rating) : '');
    setEditNotes(book.notes || '');
  };

  const saveEdit = async (book: Book) => {
    if (!editTitle.trim()) return;
    const parsedRating = editRating.trim() === '' ? null : parseFloat(editRating.replace(',', '.'));
    if (parsedRating !== null && (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 10)) {
      setError('A nota tem de ser um número entre 0 e 10.');
      return;
    }
    setError('');
    await updateBook(book, {
      title: editTitle.trim(),
      author: editAuthor.trim() || 'Desconhecido',
      rating: parsedRating,
      notes: editNotes.trim(),
    });
    setEditingId(null);
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

  const ratingColor = (r: number) => {
    if (r >= 9) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (r >= 7) return 'text-sky-400 border-sky-500/40 bg-sky-500/10';
    if (r >= 5) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-red-400 border-red-500/40 bg-red-500/10';
  };

  const fmt = (r: number) => String(r).replace('.', ',');

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
        {bulkResult && (
          <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-3 rounded-lg text-sm">
            {bulkResult}
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
                  Cola a tua lista. Separa livros com nova linha, <code className="text-emerald-400">!</code>, <code className="text-emerald-400">;</code> ou <code className="text-emerald-400">/</code>. O autor é detetado por <code className="text-emerald-400">-</code> ou pela palavra <code className="text-emerald-400">de</code>.
                </label>
                <textarea
                  rows={5}
                  placeholder={'Crime e Castigo - Dostoiévski\nSer e tempo de Heidegger! O processo de Kafka!'}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 text-white p-3 rounded-lg text-sm outline-none focus:border-emerald-500"
                />
              </div>

              {bulkText.trim() && (
                <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <p className="text-xs text-gray-500 mb-2">Pré-visualização ({parseBulk(bulkText).length} livros):</p>
                  <ul className="space-y-1">
                    {parseBulk(bulkText).map((b, i) => (
                      <li key={i} className="text-xs text-gray-300">
                        <span className="text-white">{b.title}</span>
                        <span className="text-gray-500"> — {b.author}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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
              {editingId === book.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Título"
                    className="w-full bg-gray-950 border border-gray-800 text-white p-2 rounded text-sm outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    value={editAuthor}
                    onChange={(e) => setEditAuthor(e.target.value)}
                    placeholder="Autor"
                    className="w-full bg-gray-950 border border-gray-800 text-white p-2 rounded text-sm outline-none focus:border-emerald-500"
                  />
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Nota (0 a 10, aceita decimais)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={editRating}
                      onChange={(e) => setEditRating(e.target.value)}
                      placeholder="Ex: 8,5"
                      className="w-full bg-gray-950 border border-gray-800 text-white p-2 rounded text-sm outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Notas</label>
                    <textarea
                      rows={4}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="O que achaste do livro?"
                      className="w-full bg-gray-950 border border-gray-800 text-white p-2 rounded text-sm outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(book)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 rounded font-semibold"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => { setEditingId(null); setError(''); }}
                      className="text-xs text-gray-400 hover:text-white px-4 py-2"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-white">{book.title}</h3>
                        {book.rating !== null && (
                          <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ${ratingColor(book.rating)}`}>
                            {fmt(book.rating)}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${book.author === 'Desconhecido' ? 'text-amber-500/70' : 'text-gray-400'}`}>
                        {book.author}
                      </p>
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
                        onClick={() => startEdit(book)}
                        className="text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteBook(book.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  </div>

                  {book.notes && (
                    <p className="text-xs text-gray-400 leading-relaxed border-l-2 border-gray-800 pl-3 whitespace-pre-wrap">
                      {book.notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}