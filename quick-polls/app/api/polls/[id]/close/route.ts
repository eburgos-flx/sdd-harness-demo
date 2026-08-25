import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { closeSchema } from '@/lib/schemas';
import { getPoll, updatePoll } from '@/lib/store';

function tokenMatches(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  const parsed = closeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const existing = await getPoll(id);
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (!tokenMatches(parsed.data.adminToken, existing.adminToken)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const updated = await updatePoll(id, (poll) =>
    poll.status === 'closed' ? poll : { ...poll, status: 'closed' },
  );

  return NextResponse.json({ id, status: updated?.status ?? 'closed' }, { status: 200 });
}
