import { createHmac, timingSafeEqual } from 'node:crypto';
import { InvalidCursorException } from '../common/exceptions/domain.exceptions';


export interface CursorPayload {
  t: string;
  i: string;
}

const SIG_LENGTH = 16;

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(input: string): Buffer {
  const pad = 4 - (input.length % 4);
  const padded = pad < 4 ? input + '='.repeat(pad) : input;
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function sign(payload: string, secret: string): string {
  const sig = createHmac('sha256', secret).update(payload).digest();
  return base64UrlEncode(sig).slice(0, SIG_LENGTH);
}

export function encodeCursor(payload: CursorPayload, secret: string): string {
  const json = JSON.stringify(payload);
  const body = base64UrlEncode(json);
  const sig = sign(body, secret);
  return `${body}.${sig}`;
}

export function decodeCursor(cursor: string, secret: string): CursorPayload {
  if (typeof cursor !== 'string' || !cursor.includes('.')) {
    throw new InvalidCursorException();
  }
  const [body, sig] = cursor.split('.', 2);
  if (!body || !sig || sig.length !== SIG_LENGTH) {
    throw new InvalidCursorException();
  }
  const expected = sign(body, secret);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    throw new InvalidCursorException();
  }
  try {
    const json = base64UrlDecode(body).toString('utf8');
    const parsed = JSON.parse(json) as CursorPayload;
    if (typeof parsed.t !== 'string' || typeof parsed.i !== 'string') {
      throw new InvalidCursorException();
    }
    return parsed;
  } catch {
    throw new InvalidCursorException();
  }
}
