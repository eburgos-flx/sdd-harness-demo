import { promises as fs } from 'node:fs';
import path from 'node:path';

export type PollStatus = 'open' | 'closed';

export interface Poll {
  id: string;
  question: string;
  options: string[];
  votes: number[];
  status: PollStatus;
  adminToken: string;
  createdAt: string;
}

interface StoreShape {
  polls: Record<string, Poll>;
}

const DATA_FILE = path.join(process.cwd(), 'data', 'polls.json');
const EMPTY: StoreShape = { polls: {} };

let writeChain: Promise<void> = Promise.resolve();

async function ensureFile(): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(EMPTY, null, 2), 'utf8');
  }
}

async function readAll(): Promise<StoreShape> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(raw) as StoreShape;
}

async function writeAll(next: StoreShape): Promise<void> {
  await ensureFile();
  const tmp = `${DATA_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(next, null, 2), 'utf8');
  await fs.rename(tmp, DATA_FILE);
}

export async function getPoll(id: string): Promise<Poll | null> {
  const store = await readAll();
  return store.polls[id] ?? null;
}

export async function createPoll(poll: Poll): Promise<void> {
  writeChain = writeChain.then(async () => {
    const store = await readAll();
    store.polls[poll.id] = poll;
    await writeAll(store);
  });
  await writeChain;
}

export async function updatePoll(
  id: string,
  mutator: (poll: Poll) => Poll,
): Promise<Poll | null> {
  let result: Poll | null = null;
  writeChain = writeChain.then(async () => {
    const store = await readAll();
    const current = store.polls[id];
    if (!current) return;
    const next = mutator(current);
    store.polls[id] = next;
    await writeAll(store);
    result = next;
  });
  await writeChain;
  return result;
}
