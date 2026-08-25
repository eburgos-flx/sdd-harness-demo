'use client';

import { useState } from 'react';
import { Copy, Check } from '@phosphor-icons/react';

export default function LinkRow({ label, href }: { label: string; href: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  }

  return (
    <div className="grid gap-1.5">
      <span className="text-xs text-zinc-500">{label}</span>
      <div className="flex items-center gap-2 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 py-1.5 pl-4 pr-1.5">
        <a
          href={href}
          className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-700 transition hover:text-zinc-950"
        >
          {href}
        </a>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-medium tracking-tight text-zinc-700 shadow-sm ring-1 ring-zinc-200/70 transition hover:text-zinc-950 active:translate-y-[1px]"
        >
          {copied ? (
            <>
              <Check size={12} weight="bold" /> Copiado
            </>
          ) : (
            <>
              <Copy size={12} weight="bold" /> Copiar
            </>
          )}
        </button>
      </div>
    </div>
  );
}
