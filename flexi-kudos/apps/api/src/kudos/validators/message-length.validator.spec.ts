import 'reflect-metadata';
import { validateSync } from 'class-validator';
import { IsMessageLength, countCodePoints } from './message-length.validator';

class MessageFixture {
  @IsMessageLength()
  message!: string;

  constructor(message: string) {
    this.message = message;
  }
}

function isValid(msg: string): boolean {
  const errors = validateSync(new MessageFixture(msg));
  return errors.length === 0;
}

describe('IsMessageLength', () => {
  it('rejects empty message', () => {
    expect(isValid('')).toBe(false);
  });

  it('rejects whitespace-only message', () => {
    expect(isValid('   ')).toBe(false);
  });

  it('accepts single character', () => {
    expect(isValid('a')).toBe(true);
  });

  it('accepts message with 280 code points', () => {
    expect(isValid('a'.repeat(280))).toBe(true);
  });

  it('rejects 281 code points', () => {
    expect(isValid('a'.repeat(281))).toBe(false);
  });

  it('counts multibyte emoji as one code point', () => {
    const emoji = '👏';
    expect(countCodePoints(emoji)).toBe(1);
    expect(isValid(emoji.repeat(280))).toBe(true);
    expect(isValid(emoji.repeat(281))).toBe(false);
  });
});
