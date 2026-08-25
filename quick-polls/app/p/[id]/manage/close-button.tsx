'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Prohibit, WarningCircle } from '@phosphor-icons/react';

const spring = { type: 'spring' as const, stiffness: 240, damping: 22 };

export default function CloseButton({
  pollId,
  adminToken,
}: {
  pollId: string;
  adminToken: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<'idle' | 'confirm' | 'submitting'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function confirmClose() {
    setPhase('submitting');
    setError(null);
    try {
      const res = await fetch(`/api/polls/${pollId}/close`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ adminToken }),
      });
      if (!res.ok) {
        setError('No se pudo cerrar la encuesta.');
        setPhase('confirm');
        return;
      }
      router.refresh();
    } catch {
      setError('Error de red.');
      setPhase('confirm');
    }
  }

  return (
    <div className="grid gap-2 justify-items-end">
      <AnimatePresence mode="wait">
        {phase === 'idle' ? (
          <motion.button
            key="idle"
            layout
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={spring}
            onClick={() => setPhase('confirm')}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98, y: 0 }}
            className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-medium tracking-tight text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
          >
            <Prohibit size={16} weight="bold" />
            Cerrar encuesta
          </motion.button>
        ) : (
          <motion.div
            key="confirm"
            layout
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={() => setPhase('idle')}
              disabled={phase === 'submitting'}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium tracking-tight text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmClose}
              disabled={phase === 'submitting'}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-medium tracking-tight text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition hover:-translate-y-[1px] active:translate-y-0 disabled:opacity-60"
            >
              <WarningCircle size={16} weight="bold" />
              {phase === 'submitting' ? 'Cerrando…' : 'Sí, cerrar'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
