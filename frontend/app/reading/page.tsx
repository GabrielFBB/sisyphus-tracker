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
  const chunks = text.split(/[\n!;/]+/).map((c) => c.trim()).filter((c) => c.length > 1);

  return chunks.map((chunk) => {
    const cleaned = chunk.replace(/^[\s\-–—•*]+/, '').trim();

    const dashMatch = cleaned.split(/\s[-–—]\s|[-–—]/);
    if (dashMatch.length > 1 && dashMatch[1].trim()) {
      return { title: dashMatch[0].trim(), author: dashMatch.slice(1).join(' ').trim() };
    }

    const byMatch = cleaned.match(/^(.+?)\s+d[eao]\s+([A-ZÀ-Ú][\wÀ-ú.'-]*(?:\s+[A-ZÀ-Ú][\wÀ-ú.'-]*)*)$/);
    if (byMatch) return { title: byMatch[1].trim(), author: byMatch[2].trim() };

    return { title: cleaned, author: 'Desconhecido' };
  }).filter((b) => b.title.length > 1);
}

export default function ReadingPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [activeTab, setActiveTab] = useState<Status>('reading');

  const [formOpen, setFormOpen] = useState(false);
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
      setFormOpen(false);
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
      setBulkResult(skipped > 0 ? `${added} adicionados, ${skipped} já existiam.` : `${added} livros adicionados.`);
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

  if (!authorized) return <div className="min-h-screen bg-[#0b0d10]" />;

  const countOf = (s: Status) => books.filter((b) => b.status === s).length;
  const filtered = books.filter((b) => b.status === activeTab);

  const tabs: { key: Status; label: string }[] = [
    { key: 'reading', label: 'A ler' },
    { key: 'want', label: 'Por ler' },
    { key: 'done', label: 'Lidos' },
  ];

  const accentOf = (s: Status) => (s === 'done' ? '#7F77DD' : s === 'reading' ? '#EF9F27' : '#2a3441');
  const ratingColor = (r: number) => {
    if (r >= 9) return 'text-[#97C459] border-[#639922]/40 bg-[#639922]/10';
    if (r >= 7) return 'text-[#AFA9EC] border-[#7F77DD]/40 bg-[#7F77DD]/10';
    if (r >= 5) return 'text-[#EF9F27] border-[#EF9F27]/40 bg-[#EF9F27]/10';
    return 'text-[#f09595] border-[#a32d2d]/40 bg-[#a32d2d]/10';
  };
  const fmtRating = (r: number) => String(r).replace('.', ',');

  const inputClass =
    'w-full bg-[#0b0d10] border border-[#26303f] text-[#e8e8e6] px-3 py-2.5 rounded-md text-sm outline-none focus:border-[#7F77DD] transition-colors';

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

      <main className="max-w-4xl mx-auto px-8 py-10 space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-white">Biblioteca</h1>
            <p className="text-sm text-[#7d7d78] mt-1.5">
              {books.length === 0 ? 'Sem livros ainda' : `${countOf('done')} lidos de ${books.length} livros`}
            </p>
          </div>
          <button
            onClick={() => setFormOpen(!formOpen)}
            className="text-xs text-[#7d7d78] hover:text-[#e8e8e6] border border-[#232830] hover:border-[#3a4150] px-4 py-2 rounded-md transition-colors shrink-0"
          >
            {formOpen ? 'Cancelar' : 'Adicionar'}
          </button>
        </div>

        {error && (
          <div className="border border-[#7a2c2c] bg-[#7a2c2c]/10 text-[#f09595] p-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        {bulkResult && (
          <div className="border border-[#639922]/50 bg-[#639922]/10 text-[#97C459] p-3 rounded-lg text-sm">
            {bulkResult}
          </div>
        )}

        {formOpen && (
          <div className="border border-[#26303f] bg-[#141821] rounded-xl p-6 space-y-4">
            <div className="flex gap-2 border-b border-[#26303f] pb-4">
              <button
                onClick={() => setMode('single')}
                className={`text-xs px-4 py-2 rounded-md transition-colors ${
                  mode === 'single' ? 'bg-[#7F77DD] text-white font-medium' : 'text-[#7d7d78] hover:text-white'
                }`}
              >
                Individual
              </button>
              <button
                onClick={() => setMode('bulk')}
                className={`text-xs px-4 py-2 rounded-md transition-colors ${
                  mode === 'bulk' ? 'bg-[#7F77DD] text-white font-medium' : 'text-[#7d7d78] hover:text-white'
                }`}
              >
                Em lote
              </button>
            </div>

            {mode === 'single' ? (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#7d7d78] block mb-1.5">Título</label>
                    <input type="text" placeholder="O Mito de Sísifo" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs text-[#7d7d78] block mb-1.5">Autor</label>
                    <input type="text" placeholder="Albert Camus" value={author} onChange={(e) => setAuthor(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="text-xs text-[#7d7d78] block mb-1.5">Estado</label>
                    <select value={initialStatus} onChange={(e) => setInitialStatus(e.target.value as Status)} className={inputClass}>
                      <option value="want">Por ler</option>
                      <option value="reading">A ler</option>
                      <option value="done">Lido</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2.5 text-sm text-[#b8b8b3] cursor-pointer py-2.5">
                    <input type="checkbox" checked={initialOwned} onChange={(e) => setInitialOwned(e.target.checked)} className="w-4 h-4 accent-[#7F77DD]" />
                    Já tenho o livro
                  </label>
                </div>
                <button
                  onClick={addSingle}
                  disabled={loading || !title.trim() || !author.trim()}
                  className="w-full bg-[#7F77DD] hover:bg-[#AFA9EC] disabled:opacity-40 text-white py-2.5 rounded-md font-medium text-sm transition-colors"
                >
                  {loading ? 'A adicionar' : 'Adicionar livro'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[#7d7d78] block mb-1.5">
                    Um livro por linha. Autor detetado por hífen ou pela palavra &ldquo;de&rdquo;.
                  </label>
                  <textarea
                    rows={5}
                    placeholder={'Crime e Castigo - Dostoiévski\nSer e tempo de Heidegger'}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    className={inputClass}
                  />
                </div>

                {bulkText.trim() && (
                  <div className="border border-[#26303f] bg-[#0b0d10] rounded-md p-4 max-h-44 overflow-y-auto">
                    <p className="text-xs text-[#5f5f5b] mb-3">{parseBulk(bulkText).length} livros detetados</p>
                    <div className="space-y-1.5">
                      {parseBulk(bulkText).map((b, i) => (
                        <p key={i} className="text-sm">
                          <span className="text-[#c8c8c4]">{b.title}</span>
                          <span className="text-[#5f5f5b]"> — {b.author}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-[#7d7d78] block mb-1.5">Adicionar todos como</label>
                  <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as Status)} className={inputClass}>
                    <option value="want">Por ler</option>
                    <option value="done">Já lidos</option>
                  </select>
                </div>
                <button
                  onClick={addBulk}
                  disabled={loading || !bulkText.trim()}
                  className="w-full bg-[#7F77DD] hover:bg-[#AFA9EC] disabled:opacity-40 text-white py-2.5 rounded-md font-medium text-sm transition-colors"
                >
                  {loading ? 'A processar' : 'Adicionar lista'}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-1 border-b border-[#1c1f26]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.key
                  ? 'border-[#7F77DD] text-white'
                  : 'border-transparent text-[#7d7d78] hover:text-[#b8b8b3]'
              }`}
            >
              {tab.label}
              <span className="font-mono text-xs text-[#5f5f5b] ml-2">{countOf(tab.key)}</span>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="border border-dashed border-[#1c1f26] rounded-xl py-16 text-center">
              <p className="text-sm text-[#7d7d78]">Nenhum livro nesta categoria.</p>
            </div>
          )}

          {filtered.map((book) => (
            <div
              key={book.id}
              className="border border-[#26303f] bg-[#141821] p-5"
              style={{ borderLeft: `3px solid ${accentOf(book.status)}`, borderRadius: '0 12px 12px 0' }}
            >
              {editingId === book.id ? (
                <div className="space-y-3">
                  <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Título" className={inputClass} />
                  <input type="text" value={editAuthor} onChange={(e) => setEditAuthor(e.target.value)} placeholder="Autor" className={inputClass} />
                  <div>
                    <label className="text-xs text-[#7d7d78] block mb-1.5">Nota de 0 a 10</label>
                    <input type="text" inputMode="decimal" value={editRating} onChange={(e) => setEditRating(e.target.value)} placeholder="8,5" className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs text-[#7d7d78] block mb-1.5">Notas</label>
                    <textarea rows={4} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="O que achaste?" className={inputClass} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(book)} className="bg-[#7F77DD] hover:bg-[#AFA9EC] text-white text-xs px-5 py-2 rounded-md font-medium transition-colors">
                      Guardar
                    </button>
                    <button onClick={() => { setEditingId(null); setError(''); }} className="text-xs text-[#7d7d78] hover:text-white px-4 py-2 transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-base font-medium text-white">{book.title}</h2>
                        {book.rating !== null && (
                          <span className={`font-mono text-xs font-medium px-2 py-0.5 rounded border ${ratingColor(book.rating)}`}>
                            {fmtRating(book.rating)}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${book.author === 'Desconhecido' ? 'text-[#EF9F27]/70' : 'text-[#8b8b86]'}`}>
                        {book.author}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <select
                        value={book.status}
                        onChange={(e) => updateBook(book, { status: e.target.value as Status })}
                        className="bg-[#0b0d10] border border-[#26303f] text-xs text-[#b8b8b3] rounded px-2 py-1.5 outline-none focus:border-[#7F77DD]"
                      >
                        <option value="want">Por ler</option>
                        <option value="reading">A ler</option>
                        <option value="done">Lido</option>
                      </select>
                      <button onClick={() => startEdit(book)} className="text-xs text-[#7d7d78] hover:text-white transition-colors">
                        Editar
                      </button>
                      <button onClick={() => deleteBook(book.id)} className="text-xs text-[#5f5f5b] hover:text-[#f09595] transition-colors">
                        Remover
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center gap-2.5 text-sm text-[#b8b8b3] cursor-pointer w-fit">
                    <input type="checkbox" checked={book.owned} onChange={(e) => updateBook(book, { owned: e.target.checked })} className="w-4 h-4 accent-[#7F77DD]" />
                    Já tenho
                  </label>

                  {book.notes && (
                    <p className="text-sm text-[#b8b8b3] leading-relaxed border-l-2 border-[#26303f] pl-4 whitespace-pre-wrap">
                      {book.notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}