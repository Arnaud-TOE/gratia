// The loyalty heatmap's arithmetic: gifts laid out donor by month, over the last year. Pure, so the
// widget stays about drawing and the tests can pin down what counts as "gone quiet".

export type GiftPoint = { donor: string; day: string; amount: number };

export type LoyaltyMonth = { key: string; letter: string; label: string };

export type LoyaltyDonor = {
  name: string;
  /** What they gave in each of the window's months, oldest first; 0 for a month with no gift. */
  months: number[];
  activeMonths: number;
  /** Index of the last month with a gift. */
  lastActive: number;
  /** No gift this month or last month, after giving earlier in the window. */
  quiet: boolean;
};

export type LoyaltyGrid = {
  months: LoyaltyMonth[];
  donors: LoyaltyDonor[];
  /** The largest monthly amount, for scaling the colours. */
  top: number;
  quietCount: number;
};

export const WINDOW_MONTHS = 12;

// This month may simply not have reached the donor's usual day yet, so one empty month is normal.
const QUIET_AFTER_EMPTY_MONTHS = 2;

const monthKey = (year: number, month: number) => `${year}-${String(month + 1).padStart(2, '0')}`;

export function buildLoyaltyGrid(gifts: GiftPoint[], today: Date): LoyaltyGrid {
  const months: LoyaltyMonth[] = Array.from({ length: WINDOW_MONTHS }, (_, i) => {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (WINDOW_MONTHS - 1 - i), 1));
    const name = date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
    return {
      key: monthKey(date.getUTCFullYear(), date.getUTCMonth()),
      letter: name[0],
      label: `${name} ${date.getUTCFullYear()}`,
    };
  });
  const indexOf = new Map(months.map((month, i) => [month.key, i]));

  const byDonor = new Map<string, number[]>();
  for (const { donor, day, amount } of gifts) {
    const index = indexOf.get(day.slice(0, 7));
    if (index === undefined || amount <= 0) continue;
    const cells = byDonor.get(donor) ?? new Array<number>(WINDOW_MONTHS).fill(0);
    cells[index] += amount;
    byDonor.set(donor, cells);
  }

  const donors = [...byDonor.entries()].map(([name, cells]): LoyaltyDonor => {
    const lastActive = cells.findLastIndex((amount) => amount > 0);
    return {
      name,
      months: cells,
      activeMonths: cells.filter((amount) => amount > 0).length,
      lastActive,
      quiet: WINDOW_MONTHS - 1 - lastActive >= QUIET_AFTER_EMPTY_MONTHS,
    };
  });

  // The faithful first, so the rows that stop short stand out against the ones that don't.
  donors.sort((a, b) => b.activeMonths - a.activeMonths || b.lastActive - a.lastActive || a.name.localeCompare(b.name));

  return {
    months,
    donors,
    top: Math.max(0, ...donors.flatMap((donor) => donor.months)),
    quietCount: donors.filter((donor) => donor.quiet).length,
  };
}
