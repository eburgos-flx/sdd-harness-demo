import { notFound } from 'next/navigation';
import { getPoll } from '@/lib/store';
import Shell from '@/app/_ui/shell';
import ResultsView from './results-view';

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const poll = await getPoll(id);
  if (!poll) notFound();

  return (
    <Shell>
      <ResultsView
        pollId={id}
        initial={{
          id: poll.id,
          question: poll.question,
          options: poll.options,
          votes: poll.votes,
          status: poll.status,
          createdAt: poll.createdAt,
        }}
      />
    </Shell>
  );
}
