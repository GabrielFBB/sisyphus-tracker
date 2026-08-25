'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-zinc-950 text-white font-sans">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          SisyphusTracker
        </h1>
        <p className="text-zinc-400 text-lg">
          Acompanha os teus hábitos, treinos e leituras num único lugar.
        </p>
        
        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/login"
            className="rounded-lg bg-white px-6 py-3 font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-zinc-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-zinc-900"
          >
            Criar Conta
          </Link>
        </div>
      </div>
    </main>
  );
}