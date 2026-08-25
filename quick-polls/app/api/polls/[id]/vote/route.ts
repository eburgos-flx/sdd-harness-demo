import { NextRequest, NextResponse } from 'next/server';
import { voteSchema } from '@/lib/schemas';
import { updatePoll } from '@/lib/store';

const YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

type Outcome = 'ok' | 'closed' | 'out_of_range';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (req.cookies.get(`voted_${id}`)?.value === '1') {
    return NextResponse.json({ error: 'already_voted' }, { status: 409 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_payload', details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const optionIndex = parsed.data.optionIndex;

  const outcomeRef: { value: Outcome } = { value: 'ok' };
  const updated = await updatePoll(id, (poll) => {
    if (poll.status === 'closed') {
      outcomeRef.value = 'closed';
      return poll;
    }
    if (optionIndex >= poll.options.length) {
      outcomeRef.value = 'out_of_range';
      return poll;
    }
    const votes = poll.votes.slice();
    votes[optionIndex] += 1;
    return { ...poll, votes };
  });

  if (updated === null) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (outcomeRef.value === 'closed') return NextResponse.json({ error: 'closed' }, { status: 410 });
  if (outcomeRef.value === 'out_of_range')
    return NextResponse.json({ error: 'out_of_range' }, { status: 400 });

  const res = new NextResponse(null, { status: 204 });
  res.cookies.set(`voted_${id}`, '1', {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: YEAR_IN_SECONDS,
    path: '/',
  });
  return res;
}
