import { describe, expect, it } from 'vitest';
import { buildLoyaltyGrid, WINDOW_MONTHS } from '@/lib/loyalty';

const TODAY = new Date('2026-11-06T12:00:00Z');

describe('buildLoyaltyGrid', () => {
  it('covers the last twelve months, ending with this one', () => {
    const { months } = buildLoyaltyGrid([], TODAY);
    expect(months).toHaveLength(WINDOW_MONTHS);
    expect(months[0].key).toBe('2025-12');
    expect(months[0].label).toBe('Dec 2025');
    expect(months[11].key).toBe('2026-11');
    expect(months[11].letter).toBe('N');
  });

  it('adds up gifts per donor and month, ignoring refunds and gifts outside the window', () => {
    const { donors } = buildLoyaltyGrid(
      [
        { donor: 'Ana', day: '2026-10-02', amount: 20 },
        { donor: 'Ana', day: '2026-10-20', amount: 5 },
        { donor: 'Ana', day: '2026-10-21', amount: -5 },
        { donor: 'Ana', day: '2025-01-01', amount: 100 },
      ],
      TODAY,
    );
    expect(donors).toHaveLength(1);
    expect(donors[0].months[10]).toBe(25);
    expect(donors[0].activeMonths).toBe(1);
  });

  it('puts the most faithful donors first, then the most recent', () => {
    const { donors } = buildLoyaltyGrid(
      [
        { donor: 'Once, long ago', day: '2026-01-10', amount: 500 },
        { donor: 'Once, lately', day: '2026-10-10', amount: 5 },
        { donor: 'Often', day: '2026-08-10', amount: 5 },
        { donor: 'Often', day: '2026-09-10', amount: 5 },
      ],
      TODAY,
    );
    expect(donors.map((donor) => donor.name)).toEqual(['Often', 'Once, lately', 'Once, long ago']);
  });

  it('counts a donor as quiet after two empty months, not one', () => {
    const { donors, quietCount } = buildLoyaltyGrid(
      [
        { donor: 'Gave last month', day: '2026-10-15', amount: 10 },
        { donor: 'Gave two months ago', day: '2026-09-15', amount: 10 },
      ],
      TODAY,
    );
    const quiet = Object.fromEntries(donors.map((donor) => [donor.name, donor.quiet]));
    expect(quiet).toEqual({ 'Gave last month': false, 'Gave two months ago': true });
    expect(quietCount).toBe(1);
  });
});
