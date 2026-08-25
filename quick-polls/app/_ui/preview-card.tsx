'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatCircleDots } from '@phosphor-icons/react';

interface Sample {
  question: string;
  options: string[];
  votes: number[];
}

const SAMPLES: Sample[] = [
  {
    question: 'Café o mate para la sync de las 10?',
    options: ['Café', 'Mate', 'Té'],
    votes: [14, 22, 5],
  },
  {
    question: 'Deploy hoy o mañana?',
    options: ['Hoy 18:00', 'Mañana 09:00'],
    votes: [7, 11],
  },
  {
    question: 'Sushi, pizza o empanadas?',
    options: ['Sushi', 'Pizza', 'Empanadas', 'Ensalada'],
    votes: [12, 8, 17, 3],
  },
];

const spring = { type: 'spring' as const, stiffness: 90, damping: 18 };

export default function PreviewCard() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((prev) => (prev + 1) % SAMPLES.length);
    }, 4200);
    return () => clearInterval(t);
  }, []);

  const sample = SAMPLES[index];
  const total = useMemo(
    () => sample.votes.reduce((sum, n) => sum + n, 0),
    [sample],
  );

  return (
    <div className="relative isolate w-full">
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-blue-100/60 via-transparent to-transparent blur-2xl" />

      <div className="rounded-[2.5rem] border border-zinc-200/60 bg-white/95 p-6 shadow-[0_30px_60px_-25px_rgba(15,23,42,0.14)] backdrop-blur md:p-8">
        <div className="mb-5 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
            <ChatCircleDots size={14} weight="fill" />
            Live preview
          </div>
          <div className="flex items-center gap-1.5">
            {SAMPLES.map((_, i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === index ? 'w-6 bg-zinc-950' : 'w-1.5 bg-zinc-200'
                }`}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={sample.question}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={spring}
            className="grid gap-5"
          >
            <p className="text-2xl font-medium leading-tight tracking-tight text-zinc-950 md:text-3xl">
              {sample.question}
            </p>

            <ul className="grid gap-2">
              {sample.options.map((opt, i) => {
                const pct = total === 0 ? 0 : Math.round((sample.votes[i] / total) * 100);
                return (
                  <motion.li
                    key={opt}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...spring, delay: i * 0.06 }}
                    className="relative overflow-hidden rounded-2xl border border-zinc-200/70 bg-zinc-50/70 p-3"
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ ...spring, delay: 0.15 + i * 0.06 }}
                      className="absolute inset-y-0 left-0 bg-blue-50"
                    />
                    <div className="relative flex items-center justify-between text-sm">
                      <span className="font-medium text-zinc-950">{opt}</span>
                      <span className="font-mono text-xs text-zinc-500">
                        {pct}%
                      </span>
                    </div>
                  </motion.li>
                );
              })}
            </ul>

            <div className="flex items-center justify-between border-t border-zinc-100 pt-3 text-xs text-zinc-500">
              <span>
                <span className="font-mono text-zinc-950">{total}</span> votos
              </span>
              <span>actualizado hace 2s</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
