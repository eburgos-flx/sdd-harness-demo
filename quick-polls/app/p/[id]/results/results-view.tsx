'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ChartBar, ArrowUpRight } from '@phosphor-icons/react';
import Badge from '@/app/_ui/badge';

const BarChart = dynamic(() => import('./bar-chart'), { ssr: false });

export interface PublicPoll {
  id: string;
  question: string;
  options: string[];
  votes: number[];
  status: 'open' | 'closed';
  createdAt: string;
}

const POLL_INTERVAL_MS = 3000;
const spring = { type: 'spring' as const, stiffness: 120, damping: 22 };

export default function ResultsView({
  pollId,
  initial,
}: {
  pollId: string;
  initial: PublicPoll;
}) {
  const [poll, setPoll] = useState<PublicPoll>(initial);

  useEffect(() => {
    if (poll.status !== 'open') return;
    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/polls/${pollId}`, { cache: 'no-store' });
        if (!res.ok) return;
        const next = (await res.json()) as PublicPoll;
        if (!cancelled) setPoll(next);
      } catch {
        // ignore transient errors
      }
    }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [pollId, poll.status]);

  const { data, total, leaderIndex } = useMemo(() => {
    const total = poll.votes.reduce((sum, n) => sum + n, 0);
    const maxVotes = poll.votes.reduce((m, n) => (n > m ? n : m), 0);
    const leaderIndex = total > 0 ? poll.votes.indexOf(maxVotes) : -1;
    const data = poll.options.map((label, i) => ({
      name: label,
      votes: poll.votes[i],
      pct: total === 0 ? 0 : Math.round((poll.votes[i] / total) * 100),
    }));
    return { data, total, leaderIndex };
  }, [poll]);

  const isOpen = poll.status === 'open';

  return (
    <section className="grid gap-6 pt-6 md:pt-14">
      <div className="grid gap-6 md:grid-cols-[1.6fr_1fr]">
        <header className="rounded-[2.5rem] border border-zinc-200/60 bg-white p-8 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.08)] md:p-10">
          <div className="flex items-center gap-3">
            {isOpen ? <Badge tone="live">Live</Badge> : <Badge tone="danger">Closed</Badge>}
            <span className="text-xs text-zinc-500">
              Creada {new Date(poll.createdAt).toLocaleString()}
            </span>
          </div>
          <h1 className="mt-5 text-3xl font-medium leading-[1.05] tracking-tighter text-zinc-950 md:text-5xl">
            {poll.question}
          </h1>
          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-mono text-6xl tracking-tighter text-zinc-950 md:text-7xl">
              {total}
            </span>
            <span className="text-sm text-zinc-500">
              voto{total === 1 ? '' : 's'} registrados
            </span>
          </div>
        </header>

        <div className="grid gap-4 rounded-[2.5rem] border border-zinc-200/60 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.08)] md:p-8">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
            <Trophy size={14} weight="fill" />
            Al frente
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={leaderIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={spring}
            >
              {leaderIndex >= 0 ? (
                <>
                  <p className="text-3xl font-medium leading-tight tracking-tight text-zinc-950">
                    {poll.options[leaderIndex]}
                  </p>
                  <p className="mt-2 font-mono text-sm text-zinc-500">
                    {poll.votes[leaderIndex]} votos ·{' '}
                    {data[leaderIndex]?.pct}%
                  </p>
                </>
              ) : (
                <p className="text-sm text-zinc-500">Todavía sin votos.</p>
              )}
            </motion.div>
          </AnimatePresence>
          <Link
            href={`/p/${pollId}`}
            className="mt-2 inline-flex items-center gap-1.5 self-start rounded-full border border-zinc-200/70 bg-white px-3 py-1.5 text-xs font-medium tracking-tight text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950"
          >
            Ir a votar
            <ArrowUpRight size={12} weight="bold" />
          </Link>
        </div>
      </div>

      <div className="rounded-[2.5rem] border border-zinc-200/60 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.08)] md:p-10">
        <div className="mb-5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
          <ChartBar size={14} weight="fill" />
          Distribución
        </div>
        <BarChart data={data} />
      </div>

      <ul className="divide-y divide-zinc-200/70 rounded-[2.5rem] border border-zinc-200/60 bg-white px-6 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.08)] md:px-10">
        {data.map((d, i) => (
          <motion.li
            key={d.name}
            layout
            className="flex items-center gap-4 py-4"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-zinc-200 bg-zinc-50 font-mono text-[11px] text-zinc-500">
              {String.fromCharCode(65 + i)}
            </span>
            <span className="min-w-0 flex-1 truncate text-base tracking-tight text-zinc-950">
              {d.name}
            </span>
            <div className="relative hidden h-1.5 w-40 overflow-hidden rounded-full bg-zinc-100 md:block">
              <motion.span
                layout
                initial={false}
                animate={{ width: `${d.pct}%` }}
                transition={spring}
                className={`absolute inset-y-0 left-0 rounded-full ${
                  i === leaderIndex ? 'bg-zinc-950' : 'bg-blue-500'
                }`}
              />
            </div>
            <span className="min-w-[3rem] text-right font-mono text-sm text-zinc-950">
              {d.pct}%
            </span>
            <span className="min-w-[2.5rem] text-right font-mono text-xs text-zinc-500">
              {d.votes}
            </span>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
