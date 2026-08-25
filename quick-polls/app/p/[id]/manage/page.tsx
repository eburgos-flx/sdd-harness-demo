import { timingSafeEqual } from 'node:crypto';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getPoll } from '@/lib/store';
import Shell from '@/app/_ui/shell';
import Badge from '@/app/_ui/badge';
import LinkRow from './link-row';
import CloseButton from './close-button';

function tokenMatches(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export default async function ManagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t } = await searchParams;
  const poll = await getPoll(id);
  if (!poll || !t || !tokenMatches(t, poll.adminToken)) notFound();

  const h = await headers();
  const host = h.get('host') ?? '';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const origin = `${proto}://${host}`;
  const publicUrl = `${origin}/p/${id}`;
  const resultsUrl = `${origin}/p/${id}/results`;

  const total = poll.votes.reduce((sum, n) => sum + n, 0);
  const isOpen = poll.status === 'open';

  return (
    <Shell>
      <section className="mx-auto grid max-w-4xl gap-8 pt-6 md:pt-14">
        <header className="grid gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
              Panel de administración
            </span>
            {isOpen ? <Badge tone="live">Open</Badge> : <Badge tone="danger">Closed</Badge>}
          </div>
          <h1 className="text-4xl font-medium leading-[1.02] tracking-tighter text-zinc-950 md:text-6xl">
            {poll.question}
          </h1>
          <p className="max-w-[60ch] text-sm text-zinc-500">
            Guardá este link. Es la única forma de gestionar la encuesta. Cualquiera
            con el link público puede votar; solo vos podés cerrarla.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
          <div className="grid gap-4">
            <div className="rounded-[2.5rem] border border-zinc-200/60 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.08)] md:p-8">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
                Links para compartir
              </span>
              <div className="mt-4 grid gap-3">
                <LinkRow label="Público (votar)" href={publicUrl} />
                <LinkRow label="Resultados" href={resultsUrl} />
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-red-200/60 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.05)] md:p-8">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <span className="text-xs font-medium uppercase tracking-[0.14em] text-red-600">
                    Zona de riesgo
                  </span>
                  <p className="mt-2 max-w-[46ch] text-sm text-zinc-600">
                    Cerrar la encuesta impide nuevos votos y no se puede deshacer desde
                    la UI. Los resultados quedan visibles.
                  </p>
                </div>
                {isOpen ? (
                  <CloseButton pollId={id} adminToken={t} />
                ) : (
                  <span className="rounded-2xl bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-500">
                    Ya cerrada
                  </span>
                )}
              </div>
            </div>
          </div>

          <aside className="rounded-[2.5rem] border border-zinc-200/60 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.08)] md:p-8">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
              Resumen
            </span>
            <dl className="mt-5 grid gap-5">
              <div>
                <dt className="text-xs text-zinc-500">Votos totales</dt>
                <dd className="mt-1 font-mono text-4xl tracking-tighter text-zinc-950">
                  {total}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Opciones</dt>
                <dd className="mt-1 font-mono text-4xl tracking-tighter text-zinc-950">
                  {poll.options.length}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Creada</dt>
                <dd className="mt-1 text-sm text-zinc-700">
                  {new Date(poll.createdAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>
    </Shell>
  );
}
