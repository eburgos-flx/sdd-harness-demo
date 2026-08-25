import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { createPollSchema } from '@/lib/schemas';
import { createPoll, type Poll } from '@/lib/store';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = createPollSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_payload', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const id = nanoid(8);
  const adminToken = nanoid(32);
  const poll: Poll = {
    id,
    question: parsed.data.question,
    options: parsed.data.options,
    votes: new Array(parsed.data.options.length).fill(0),
    status: 'open',
    adminToken,
    createdAt: new Date().toISOString(),
  };
  await createPoll(poll);

  return NextResponse.json(
    {
      id,
      adminToken,
      publicUrl: `/p/${id}`,
      adminUrl: `/p/${id}/manage?t=${adminToken}`,
    },
    { status: 201 },
  );
}
