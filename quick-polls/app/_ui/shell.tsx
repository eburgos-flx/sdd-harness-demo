import type { ReactNode } from 'react';
import Link from 'next/link';
import { Waveform } from '@phosphor-icons/react/dist/ssr';

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-[100dvh] w-full">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10">
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 text-zinc-950"
        >
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-zinc-950 text-white transition-transform duration-300 group-hover:-rotate-6">
            <Waveform weight="bold" size={18} />
          </span>
          <span className="text-sm font-medium tracking-tight">Kettle Polls</span>
        </Link>
        <Link
          href="/"
          className="rounded-full border border-zinc-200/60 bg-white/80 px-4 py-2 text-xs font-medium tracking-tight text-zinc-700 backdrop-blur transition hover:border-zinc-300 hover:text-zinc-950"
        >
          New poll
        </Link>
      </header>
      <main className="relative z-0 mx-auto w-full max-w-7xl px-6 pb-24 md:px-10">
        {children}
      </main>
    </div>
  );
}
