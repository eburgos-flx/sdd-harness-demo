'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, PaperPlaneRight } from '@phosphor-icons/react';

const spring = { type: 'spring' as const, stiffness: 240, damping: 22 };
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};
const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: spring },
};

export default function VoteForm({
  pollId,
  options,
}: {
  pollId: string;
  options: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selected === null) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ optionIndex: selected }),
      });
      if (res.status === 204) {
        router.push(`/p/${pollId}/results`);
        router.refresh();
        return;
      }
      if (res.status === 409) setError('Ya votaste desde este navegador.');
      else if (res.status === 410) setError('La encuesta ya está cerrada.');
      else setError('No se pudo registrar el voto.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <motion.ul
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-2"
      >
        {options.map((opt, i) => {
          const isSelected = selected === i;
          return (
            <motion.li key={i} variants={rowVariants} layout>
              <label
                className={`group relative flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3.5 transition ${
                  isSelected
                    ? 'border-zinc-950 bg-zinc-950 text-white'
                    : 'border-zinc-200/80 bg-white text-zinc-950 hover:border-zinc-400'
                }`}
              >
                <input
                  type="radio"
                  name="option"
                  value={i}
                  checked={isSelected}
                  onChange={() => setSelected(i)}
                  className="sr-only"
                  required
                />
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border font-mono text-[11px] transition ${
                    isSelected
                      ? 'border-white/20 bg-white/10 text-white'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-500'
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1 text-base tracking-tight">{opt}</span>
                <motion.span
                  animate={{
                    scale: isSelected ? 1 : 0,
                    opacity: isSelected ? 1 : 0,
                  }}
                  transition={spring}
                  className="grid h-6 w-6 place-items-center rounded-full bg-white text-zinc-950"
                >
                  <Check size={14} weight="bold" />
                </motion.span>
              </label>
            </motion.li>
          );
        })}
      </motion.ul>

      <AnimatePresence>
        {error ? (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-red-200/70 bg-red-50/60 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="submit"
        disabled={submitting || selected === null}
        whileHover={selected !== null ? { y: -1 } : {}}
        whileTap={selected !== null ? { scale: 0.98, y: 0 } : {}}
        transition={spring}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-6 py-4 text-base font-medium tracking-tight text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? 'Enviando…' : 'Registrar voto'}
        <PaperPlaneRight size={16} weight="bold" />
      </motion.button>
    </form>
  );
}
