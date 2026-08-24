import { decodeCursor, encodeCursor } from './cursor.util';
import { InvalidCursorException } from '../common/exceptions/domain.exceptions';

describe('cursor', () => {
  const secret = 'test-secret';
  const payload = { t: '2026-08-24T10:00:00.000Z', i: 'abc-123' };

  it('roundtrips encode/decode', () => {
    const cursor = encodeCursor(payload, secret);
    expect(decodeCursor(cursor, secret)).toEqual(payload);
  });

  it('rejects cursor signed with another secret', () => {
    const cursor = encodeCursor(payload, secret);
    expect(() => decodeCursor(cursor, 'other-secret')).toThrow(InvalidCursorException);
  });

  it('rejects malformed cursor', () => {
    expect(() => decodeCursor('not-a-cursor', secret)).toThrow(InvalidCursorException);
    expect(() => decodeCursor('a.b', secret)).toThrow(InvalidCursorException);
  });
});
