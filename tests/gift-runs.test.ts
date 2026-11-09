import { describe, expect, it } from 'vitest';
import { groupRuns, type FeedGift } from '@/app/dashboard/studio/widgets/gift-runs';

const gift = (key: string, donor: string, day: string, amount: number, program: string | null = 'Winter Shelter Drive'): FeedGift => ({ key, donor, day, amount, program });

describe('groupRuns', () => {
  it('joins gifts in a row from one donor, keeping the newest key and day', () => {
    const lines = groupRuns([
      gift('t', 'Tara Singh', '2026-11-08', 20),
      gift('j4', 'John Doe', '2026-11-07', 25),
      gift('j3', 'John Doe', '2026-11-06', 50),
      gift('j2', 'John Doe', '2026-11-06', 50),
      gift('a', 'Alex Rivera', '2026-11-06', 50),
    ]);
    expect(lines.map((line) => [line.key, line.donor, line.count, line.amount, line.day])).toEqual([
      ['t', 'Tara Singh', 1, 20, '2026-11-08'],
      ['j4', 'John Doe', 3, 125, '2026-11-07'],
      ['a', 'Alex Rivera', 1, 50, '2026-11-06'],
    ]);
  });

  it('keeps the newest gift on a line of its own, so a $50 gift never reads as $75', () => {
    const lines = groupRuns([gift('new', 'John Doe', '2026-11-09', 50), gift('j2', 'John Doe', '2026-11-09', 25), gift('j1', 'John Doe', '2026-11-08', 25)]);
    expect(lines.map((line) => [line.key, line.count, line.amount])).toEqual([
      ['new', 1, 50],
      ['j2', 2, 50],
    ]);
  });

  it("doesn't join a donor's gifts that someone else's came between", () => {
    const lines = groupRuns([gift('1', 'Maya', '2026-11-08', 10), gift('2', 'Omar', '2026-11-08', 10), gift('3', 'Maya', '2026-11-07', 10)]);
    expect(lines.map((line) => line.count)).toEqual([1, 1, 1]);
  });

  it('drops the program when the gifts went to different ones', () => {
    const [, line] = groupRuns([gift('0', 'Omar', '2026-11-09', 5), gift('1', 'Maya', '2026-11-08', 10, 'Medical Fund'), gift('2', 'Maya', '2026-11-07', 15, 'Sponsor a Pet')]);
    expect(line).toMatchObject({ count: 2, amount: 25, program: null });
  });
});
