import { describe, expect, it } from 'vitest';
import { giftsDueOn } from '@/lib/daily-gifts';
import type { DashboardData } from '@/lib/dashboard-data';
import { donorsAtRisk } from '@/lib/insights';

type Giving = Pick<DashboardData, 'customers' | 'invoices' | 'invoicePayments'>;
type GiftRow = { donor: string; date: string; amount?: number; program?: string; refunded?: boolean; number?: string };

const DAY_MS = 86_400_000;
const NOON = 'T12:00:00Z';
const SOME_DAY = new Date(`2026-11-15${NOON}`);

function giving(rows: GiftRow[], company = 'Individual'): Giving {
  const names = [...new Set(rows.map((row) => row.donor))];
  return {
    customers: names.map((name) => ({ id: name, name, company, email: `${name.toLowerCase().replace(' ', '.')}@example.com` })),
    invoices: rows.map((row, i) => ({
      id: `inv-${i}`,
      number: row.number ?? `N-${i}`,
      customerId: row.donor,
      paidAmount: row.amount ?? 35,
      refundedAmount: row.refunded ? (row.amount ?? 35) : 0,
    })) as Giving['invoices'],
    invoicePayments: rows.map((row, i) => ({
      id: `pay-${i}`,
      giftId: `pay-${i}`,
      invoiceId: `inv-${i}`,
      kind: 'Payment',
      method: 'Bank transfer',
      date: row.date,
      amount: row.amount ?? 35,
      signedAmount: row.amount ?? 35,
      program: row.program ?? 'Sponsor a Pet',
    })),
  };
}

const monthly = (donor: string, dates: string[], extra: Partial<GiftRow> = {}) => dates.map((date) => ({ donor, date, ...extra }));
const SPONSOR = monthly('Maya Chen', ['2026-08-10', '2026-09-10', '2026-10-10']);

const sponsorsDue = (data: Giving, today = SOME_DAY) => giftsDueOn(data, today).filter((gift) => gift.number.startsWith('HLAR-SP'));

describe('giftsDueOn: sponsors', () => {
  it('records a sponsor once their day of the month has come', () => {
    expect(sponsorsDue(giving(SPONSOR))).toEqual([
      {
        number: 'HLAR-SP-202611-maya.chen',
        given: 'Maya',
        surname: 'Chen',
        email: 'maya.chen@example.com',
        amount: 35,
        campaign: 'Sponsor a Pet',
        method: 'BANK_TRANSFER',
      },
    ]);
  });

  it('waits for their day of the month', () => {
    expect(sponsorsDue(giving(monthly('Maya Chen', ['2026-08-20', '2026-09-20', '2026-10-20'])))).toEqual([]);
  });

  it('asks only once a month', () => {
    expect(sponsorsDue(giving([...SPONSOR, { donor: 'Maya Chen', date: '2026-11-10' }]))).toEqual([]);
  });

  it('leaves a sponsor who stopped giving alone, so they stay on the list to win back', () => {
    expect(sponsorsDue(giving(monthly('Lucas Petrova', ['2026-06-10', '2026-07-10', '2026-08-10'])))).toEqual([]);
  });

  it('gives what the sponsor usually gives, to the same program', () => {
    const data = giving(monthly('Maya Chen', ['2026-08-10', '2026-09-10', '2026-10-10'], { amount: 75, program: 'Medical Fund' }));
    expect(sponsorsDue(data)[0]).toMatchObject({ amount: 75, campaign: 'Medical Fund' });
  });

  it('copes with a day this month does not have', () => {
    const data = giving(monthly('Maya Chen', ['2026-08-31', '2026-09-30', '2026-10-31']));
    expect(sponsorsDue(data, new Date(`2026-11-29${NOON}`))).toHaveLength(0);
    expect(sponsorsDue(data, new Date(`2026-11-30${NOON}`))).toHaveLength(1);
  });

  it('does not take several gifts in a few days for a monthly habit', () => {
    expect(sponsorsDue(giving(monthly('John Doe', ['2026-10-10', '2026-10-11', '2026-10-13', '2026-10-14'])))).toEqual([]);
  });

  it('ignores one-off donors, businesses and refunded gifts', () => {
    expect(sponsorsDue(giving(monthly('Once Only', ['2026-09-10', '2026-10-10'])))).toEqual([]);
    expect(sponsorsDue(giving(SPONSOR, 'Bluebell Bakery'))).toEqual([]);
    expect(sponsorsDue(giving(monthly('Maya Chen', ['2026-08-10', '2026-09-10', '2026-10-10'], { refunded: true })))).toEqual([]);
  });

  it('leaves out what is already recorded', () => {
    const data = giving([...SPONSOR, { donor: 'Someone Else', date: '2026-01-01', number: 'HLAR-SP-202611-maya.chen' }]);
    expect(sponsorsDue(data)).toEqual([]);
  });
});

describe('giftsDueOn: someone new', () => {
  const on = (time: number) => giftsDueOn(giving([]), new Date(time));
  // Whichever of two days in a row is the day someone new comes.
  const firstDay = [0, 1].map((n) => SOME_DAY.getTime() + n * DAY_MS).find((time) => on(time).length === 1) as number;

  it('brings someone new every other day', () => {
    const counts = [0, 1, 2, 3].map((n) => on(firstDay + n * DAY_MS).length);
    expect(counts).toEqual([1, 0, 1, 0]);
  });

  it('chooses the same gift if it runs again that day, and someone else next time', () => {
    expect(on(firstDay)).toEqual(on(firstDay));
    expect(on(firstDay + 2 * DAY_MS)[0].email).not.toBe(on(firstDay)[0].email);
  });

  it('leaves out a gift already recorded today', () => {
    const [{ number }] = on(firstDay);
    const data = giving([{ donor: 'Elena Sorensen', date: '2026-11-15', number }]);
    expect(giftsDueOn(data, new Date(firstDay)).map((gift) => gift.number)).not.toContain(number);
  });
});

describe('over the weeks of judging', () => {
  it('keeps a giving sponsor off the at-risk list, while the one who stopped stays on it', () => {
    const rows: GiftRow[] = [...SPONSOR, ...monthly('Lucas Petrova', ['2026-06-10', '2026-07-10', '2026-08-10'])];
    const end = Date.parse(`2026-12-15${NOON}`);
    for (let time = Date.parse(`2026-11-08${NOON}`); time <= end; time += DAY_MS) {
      const today = new Date(time);
      for (const gift of sponsorsDue(giving(rows), today)) {
        rows.push({ donor: `${gift.given} ${gift.surname}`, date: today.toISOString().slice(0, 10), number: gift.number });
      }
    }
    const data = { ...giving(rows), asOf: new Date(end).toISOString(), invoiceItems: [] } as unknown as DashboardData;
    expect(donorsAtRisk(data).map((donor) => donor.name)).toEqual(['Lucas Petrova']);
    expect(rows.filter((row) => row.donor === 'Maya Chen').map((row) => row.date.slice(0, 7))).toEqual(['2026-08', '2026-09', '2026-10', '2026-11', '2026-12']);
  });
});
