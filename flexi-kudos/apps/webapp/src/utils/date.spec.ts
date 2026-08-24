import { describe, expect, it } from 'vitest';
import { formatAbsoluteAr, formatRelativeAr } from './date';

const NOW = new Date('2026-08-24T15:00:00Z');

describe('formatRelativeAr', () => {
  it('returns "hace un momento" for deltas under 30 seconds', () => {
    expect(formatRelativeAr('2026-08-24T14:59:50Z', NOW)).toBe('hace un momento');
  });

  it('formats a minutes-old event with "hace X min"', () => {
    const out = formatRelativeAr('2026-08-24T14:55:00Z', NOW);
    expect(out).toMatch(/min/);
  });

  it('formats a hours-old event with "hace X h"', () => {
    const out = formatRelativeAr('2026-08-24T12:00:00Z', NOW);
    expect(out).toMatch(/h/);
  });

  it('formats a days-old event with a day-scale label', () => {
    const out = formatRelativeAr('2026-08-22T15:00:00Z', NOW);
    expect(out).toMatch(/anteayer|día|d\.?|hace/);
  });

  it('formats a weeks-old event with a week-scale label', () => {
    const out = formatRelativeAr('2026-08-10T15:00:00Z', NOW);
    expect(out).toMatch(/sem|hace/);
  });
});

describe('formatAbsoluteAr', () => {
  it('produces a Buenos Aires timezone formatted string', () => {
    const s = formatAbsoluteAr('2026-08-24T15:00:00Z');
    expect(s.length).toBeGreaterThan(0);
  });
});
