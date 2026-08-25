'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ArrowRight } from '@phosphor-icons/react';

interface Row {
  key: string;
  value: string;
}

let seq = 0;
const nextKey = () => `opt-${++seq}`;

const spring = { type: 'spring' as const, stiffness: 240, damping: 22 };

export default function CreatePollForm() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<Row[]>([
    { key: nextKey(), value: '' },
    { key: nextKey(), value: '' },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateOption(key: string, value: string) {
    setOptions((prev) => prev.map((o) => (o.key === key ? { ...o, value } : o)));
  }
  function addOption() {
    if (options.length >= 5) return;
    setOptions((prev) => [...prev, { key: nextKey(), value: '' }]);
  }
  function removeOption(key: string) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((o) => o.key !== key));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          options: options.map((o) => o.value.trim()),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data.error === 'invalid_payload'
            ? 'Revisá la pregunta y las opciones (2–5, sin duplicados).'
            : 'No se pudo crear la encuesta.',
        );
        return;
      }
      const data = (await res.json()) as { adminUrl: string };
      router.push(data.adminUrl);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[2.5rem] border border-zinc-200/60 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.08)] md:p-10"
    >
      <div className="grid gap-2">
        <label
          htmlFor="q"
          className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500"
        >
          Pregunta
        </label>
        <input
          id="q"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={200}
          required
          placeholder="¿Café o mate para la reunión de las 10?"
          className="rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-lg tracking-tight text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950"
        />
      </div>

      <div className="mt-8 grid gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
            Opciones
          </span>
          <span className="font-mono text-xs text-zinc-500">
            {options.length}/5
          </span>
        </div>

        <ul className="grid gap-2">
          <AnimatePresence initial={false}>
            {options.map((opt, i) => (
              <motion.li
                key={opt.key}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={spring}
                className="flex items-center gap-2"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-zinc-200 bg-zinc-50 font-mono text-xs text-zinc-500">
                  {String.fromCharCode(65 + i)}
                </span>
                <input
                  value={opt.value}
                  onChange={(e) => updateOption(opt.key, e.target.value)}
                  maxLength={120}
                  required
                  placeholder={`Opción ${i + 1}`}
                  className="min-w-0 flex-1 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base tracking-tight text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950"
                />
                <button
                  type="button"
                  onClick={() => removeOption(opt.key)}
                  disabled={options.length <= 2}
                  aria-label="Quitar opción"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-zinc-200 bg-white text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-950 active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus size={16} weight="bold" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <button
          type="button"
          onClick={addOption}
          disabled={options.length >= 5}
          className="mt-1 inline-flex items-center gap-2 self-start rounded-full border border-dashed border-zinc-300 px-4 py-2 text-sm font-medium tracking-tight text-zinc-600 transition hover:border-zinc-900 hover:text-zinc-950 active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={14} weight="bold" />
          Agregar opción
        </button>
      </div>

      <AnimatePresence>
        {error ? (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 rounded-2xl border border-red-200/70 bg-red-50/60 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="submit"
        disabled={submitting}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98, y: 0 }}
        transition={spring}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-6 py-4 text-base font-medium tracking-tight text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
      >
        {submitting ? 'Creando…' : 'Crear encuesta'}
        <ArrowRight size={18} weight="bold" />
      </motion.button>
    </form>
  );
}
