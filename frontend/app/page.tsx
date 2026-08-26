'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '@/app/lib/auth';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (getToken()) router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#e8e8e6] flex flex-col">
      <header className="border-b border-[#1c1f26]">
        <div className="max-w-4xl mx-auto px-8 h-16 flex items-center">
          <span className="text-xl font-medium tracking-tight text-white">SisyphusTracker</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="max-w-lg w-full">
          <h1 className="text-4xl font-medium tracking-tight text-white leading-tight">
            Hábitos, treinos e leituras num só sítio.
          </h1>

          <p className="text-[#8b8b86] mt-5 leading-relaxed">
            O nome vem do mito de Sísifo. O valor está no esforço repetido, dia após dia.
            Cada módulo existe para tornar essa repetição visível.
          </p>

          <div className="flex gap-3 mt-10">
            <Link
              href="/register"
              className="bg-[#639922] hover:bg-[#97C459] text-[#173404] px-6 py-3 rounded-md font-medium text-sm transition-colors"
            >
              Criar conta
            </Link>
            <Link
              href="/login"
              className="border border-[#26303f] hover:border-[#3a4657] text-[#b8b8b3] hover:text-white px-6 py-3 rounded-md font-medium text-sm transition-colors"
            >
              Entrar
            </Link>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mt-14">
            <div className="border-l-[3px] border-[#639922] bg-[#141821] px-4 py-4">
              <p className="text-sm font-medium text-white">Hábitos</p>
              <p className="text-xs text-[#8b8b86] mt-1.5 leading-relaxed">Metas diárias, sequências e timer</p>
            </div>
            <div className="border-l-[3px] border-[#7F77DD] bg-[#141821] px-4 py-4">
              <p className="text-sm font-medium text-white">Leituras</p>
              <p className="text-xs text-[#8b8b86] mt-1.5 leading-relaxed">Biblioteca, notas e avaliações</p>
            </div>
            <div className="border-l-[3px] border-[#EF9F27] bg-[#141821] px-4 py-4">
              <p className="text-sm font-medium text-white">Treinos</p>
              <p className="text-xs text-[#8b8b86] mt-1.5 leading-relaxed">Sessões, cargas e meta semanal</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#1c1f26]">
        <div className="max-w-4xl mx-auto px-8 py-5">
          <p className="text-xs text-[#5f5f5b]">Gabriel Borges</p>
        </div>
      </footer>
    </div>
  );
}
