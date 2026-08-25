import { NextRequest, NextResponse } from 'next/server';
import { getPoll } from '@/lib/store';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const poll = await getPoll(id);
  if (!poll) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { adminToken: _adminToken, ...publicPoll } = poll;
  return NextResponse.json(publicPoll);
}
