import { describe, expect, it } from 'vitest';
import { inTurns } from '@/lib/in-turns';

const tick = () => new Promise((resolve) => setTimeout(resolve, 1));

describe('inTurns', () => {
  it('keeps the results in the order of the items', async () => {
    const delays = [5, 1, 3, 2, 4];
    const results = await inTurns(delays, 2, async (delay) => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return delay * 10;
    });
    expect(results).toEqual([50, 10, 30, 20, 40]);
  });

  it('never runs more than the limit at once', async () => {
    let running = 0;
    let most = 0;
    await inTurns(Array.from({ length: 25 }, (_, i) => i), 4, async () => {
      running++;
      most = Math.max(most, running);
      await tick();
      running--;
    });
    expect(most).toBe(4);
  });

  it('copes with nothing to do', async () => {
    await expect(inTurns([], 4, async () => 1)).resolves.toEqual([]);
  });

  it('passes a failure on', async () => {
    await expect(inTurns([1], 4, async () => Promise.reject(new Error('no')))).rejects.toThrow('no');
  });
});
