import type { ReactNode } from 'react';

type Tone = 'live' | 'muted' | 'danger';

const TONE: Record<Tone, string> = {
  live: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60',
  muted: 'bg-zinc-100 text-zinc-700 ring-zinc-200/60',
  danger: 'bg-red-50 text-red-700 ring-red-200/60',
};

export default function Badge({
  tone = 'muted',
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  const pulseDot =
    tone === 'live' ? (
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
    ) : null;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium tracking-tight ring-1 ${TONE[tone]}`}
    >
      {pulseDot}
      {children}
    </span>
  );
}
