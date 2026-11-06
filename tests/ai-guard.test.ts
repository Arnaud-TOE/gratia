import { describe, expect, it } from 'vitest';
import { CallLimiter } from '@/lib/ai-guard';
import { isSameOrigin } from '@/lib/same-origin';

describe('CallLimiter', () => {
  it('allows calls up to the limit, then refuses', () => {
    const limiter = new CallLimiter(2, 1000);
    expect(limiter.hit('a', 0)).toBe(true);
    expect(limiter.hit('a', 10)).toBe(true);
    expect(limiter.hit('a', 20)).toBe(false);
  });

  it('counts each visitor separately', () => {
    const limiter = new CallLimiter(1, 1000);
    expect(limiter.hit('a', 0)).toBe(true);
    expect(limiter.hit('b', 0)).toBe(true);
  });

  it('frees a slot once the oldest call leaves the window', () => {
    const limiter = new CallLimiter(1, 1000);
    expect(limiter.hit('a', 0)).toBe(true);
    expect(limiter.hit('a', 999)).toBe(false);
    expect(limiter.hit('a', 1000)).toBe(true);
  });
});

describe('isSameOrigin', () => {
  const request = (headers: Record<string, string>) => new Request('https://gratia.example/api/ai/responses', { method: 'POST', headers });

  it('accepts a page of the same site', () => {
    expect(isSameOrigin(request({ origin: 'https://gratia.example', host: 'gratia.example' }))).toBe(true);
  });

  it('uses the forwarded host behind a proxy', () => {
    expect(isSameOrigin(request({ origin: 'https://gratia.example', host: 'internal:3000', 'x-forwarded-host': 'gratia.example' }))).toBe(true);
  });

  it('refuses another site and a request with no origin', () => {
    expect(isSameOrigin(request({ origin: 'https://elsewhere.example', host: 'gratia.example' }))).toBe(false);
    expect(isSameOrigin(request({ host: 'gratia.example' }))).toBe(false);
  });
});
