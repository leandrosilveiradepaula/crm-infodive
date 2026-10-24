import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { consumeRateLimit, resetRateLimitsForTests } from './ai-rate-limit';

describe('AI rate limit guard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-07T17:00:00Z'));
    resetRateLimitsForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests up to the configured limit and then blocks', () => {
    expect(consumeRateLimit({ scope: 'test', subject: 'org:user', limit: 2, windowMs: 60_000 }).allowed).toBe(true);
    expect(consumeRateLimit({ scope: 'test', subject: 'org:user', limit: 2, windowMs: 60_000 }).allowed).toBe(true);
    const blocked = consumeRateLimit({ scope: 'test', subject: 'org:user', limit: 2, windowMs: 60_000 });
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) expect(blocked.retryAfterSeconds).toBe(60);
  });

  it('isolates scopes and subjects', () => {
    consumeRateLimit({ scope: 'a', subject: 'one', limit: 1, windowMs: 60_000 });
    expect(consumeRateLimit({ scope: 'a', subject: 'two', limit: 1, windowMs: 60_000 }).allowed).toBe(true);
    expect(consumeRateLimit({ scope: 'b', subject: 'one', limit: 1, windowMs: 60_000 }).allowed).toBe(true);
  });

  it('resets the bucket after the window', () => {
    consumeRateLimit({ scope: 'test', subject: 'org:user', limit: 1, windowMs: 60_000 });
    expect(consumeRateLimit({ scope: 'test', subject: 'org:user', limit: 1, windowMs: 60_000 }).allowed).toBe(false);
    vi.advanceTimersByTime(60_001);
    expect(consumeRateLimit({ scope: 'test', subject: 'org:user', limit: 1, windowMs: 60_000 }).allowed).toBe(true);
  });

  it('fails closed on invalid configuration', () => {
    expect(() => consumeRateLimit({ scope: '', subject: 'x', limit: 1, windowMs: 1000 })).toThrow();
    expect(() => consumeRateLimit({ scope: 'x', subject: 'y', limit: 0, windowMs: 1000 })).toThrow();
  });
});
