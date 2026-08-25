import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { ArrowRight, LockKey } from '@phosphor-icons/react/dist/ssr';
import { getPoll } from '@/lib/store';
import Shell from '@/app/_ui/shell';
import Badge from '@/app/_ui/badge';
import VoteForm from './vote-form';

export default async function PollPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const poll = await getPoll(id);
  if (!poll) notFound();

  const jar = await cookies();
  const alreadyVoted = jar.get(`voted_${id}`)?.value === '1';
  const closed = poll.status === 'closed';

  const state: 'closed' | 'voted' | 'open' = closed
    ? 'closed'
    : alreadyVoted
      ? 'voted'
      : 'open';

  return (
    <Shell>
      <section className="mx-auto grid max-w-3xl gap-8 pt-6 md:pt-14">
        <header className="grid gap-4">
          {state === 'open' ? (
            <Badge tone="live">Encuesta abierta</Badge>
          ) : state === 'voted' ? (
            <Badge tone="muted">Ya votaste</Badge>
          ) : (
            <Badge tone="danger">Encuesta cerrada</Badge>
          )}
          <h1 className="text-4xl font-medium leading-[1.02] tracking-tighter text-zinc-950 md:text-6xl">
            {poll.question}
          </h1>
          <p className="text-sm text-zinc-500">
            Un voto por navegador. Los resultados se actualizan en vivo.
          </p>
        </header>

        <div className="rounded-[2.5rem] border border-zinc-200/60 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.08)] md:p-10">
          {state === 'open' ? (
            <VoteForm pollId={id} options={poll.options} />
          ) : (
            <div className="grid gap-6">
              <div className="grid gap-3">
                {poll.options.map((opt, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-2xl border border-zinc-200/70 bg-zinc-50/70 px-4 py-3.5"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-zinc-200 bg-white font-mono text-[11px] text-zinc-500">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-base tracking-tight text-zinc-950">
                      {opt}
                    </span>
                    {state === 'closed' ? (
                      <LockKey
                        className="ml-auto text-zinc-400"
                        size={16}
                        weight="regular"
                      />
                    ) : null}
                  </div>
                ))}
              </div>
              <Link
                href={`/p/${id}/results`}
                className="inline-flex items-center justify-center gap-2 self-start rounded-2xl bg-zinc-950 px-6 py-3.5 text-base font-medium tracking-tight text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition hover:-translate-y-[1px] active:translate-y-0"
              >
                Ver resultados
                <ArrowRight size={16} weight="bold" />
              </Link>
            </div>
          )}
        </div>

        {state === 'open' ? (
          <p className="text-center text-xs text-zinc-500">
            ¿Ya votaste?{' '}
            <Link
              href={`/p/${id}/results`}
              className="underline decoration-zinc-300 underline-offset-4 transition hover:text-zinc-950"
            >
              Ver resultados
            </Link>
          </p>
        ) : null}
      </section>
    </Shell>
  );
}
