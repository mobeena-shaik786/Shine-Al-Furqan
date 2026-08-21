import { describe, expect, it } from 'vitest';
import { formatNumber, getGreeting, initials } from './utils';

describe('utils', () => {
  it('formats numbers', () => {
    expect(formatNumber(2363)).toBe('2,363');
  });

  it('builds initials', () => {
    expect(initials('Super', 'Admin')).toBe('SA');
  });

  it('returns a greeting string', () => {
    expect(getGreeting(new Date('2026-08-05T15:00:00'))).toBe('Good Afternoon');
  });
});
