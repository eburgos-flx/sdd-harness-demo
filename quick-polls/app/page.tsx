import CreatePollForm from './create-poll-form';
import PreviewCard from './_ui/preview-card';
import Shell from './_ui/shell';

export default function Home() {
  return (
    <Shell>
      <section className="grid items-center gap-14 pt-6 md:grid-cols-[1.05fr_0.95fr] md:gap-16 md:pt-14">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200/60 bg-white/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-zinc-600 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Público · sin cuenta
          </span>
          <h1 className="mt-6 text-5xl font-medium leading-[0.95] tracking-tighter text-zinc-950 md:text-7xl">
            Encuestas rápidas.
            <br />
            <span className="text-zinc-400">Cero fricción.</span>
          </h1>
          <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-zinc-600 md:text-lg">
            Armá una pregunta con 2 a 5 opciones, compartí el link público y mirá los
            resultados en vivo. Cada navegador vota una sola vez.
          </p>
          <div className="mt-10">
            <CreatePollForm />
          </div>
        </div>

        <div className="order-first md:order-last">
          <PreviewCard />
        </div>
      </section>
    </Shell>
  );
}
