import { beforeEach, describe, expect, it } from 'vitest';
import type { DashboardData } from '@/lib/dashboard-data';
import { newsSince, readVisit } from '@/app/dashboard/visit';

type Row<K extends keyof DashboardData> = DashboardData[K] extends (infer T)[] ? T : never;

function data(gifts: { donor: string; date: string; amount: number; program?: string; refunded?: boolean }[]): DashboardData {
  const names = [...new Set(gifts.map((gift) => gift.donor))];
  return {
    asOf: '2026-11-12T12:00:00.000Z',
    customers: names.map((name) => ({ id: name, name, company: 'Individual', email: null })),
    invoices: gifts.map((gift, i) => ({ id: `inv-${i}`, customerId: gift.donor, paidAmount: gift.amount, refundedAmount: gift.refunded ? gift.amount : 0 }) as unknown as Row<'invoices'>),
    invoicePayments: gifts.map((gift, i) => ({ id: `p-${i}`, giftId: `p-${i}`, invoiceId: `inv-${i}`, kind: 'Payment', method: 'Check', date: gift.date, amount: gift.amount, signedAmount: gift.amount, program: gift.program ?? null })),
    invoiceItems: [],
    products: [],
    plans: [],
    transactions: [],
    balances: [],
  } as DashboardData;
}

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
  } as Storage;
});

describe('newsSince', () => {
  const gifts = data([
    { donor: 'Maya Chen', date: '2026-11-06', amount: 35, program: 'Sponsor a Pet' },
    { donor: 'Elena Sorensen', date: '2026-11-09', amount: 25, program: 'Winter Shelter Drive' },
    { donor: 'Marcus Whitfield', date: '2026-11-11', amount: 50, program: 'Medical Fund' },
    { donor: 'Refunded Twice', date: '2026-11-10', amount: 80, refunded: true },
  ]);

  it('counts the gifts after the last visit, newest first, and leaves refunds out', () => {
    expect(newsSince(gifts, '2026-11-08')).toBe('Since your last visit on Sun, Nov 8: 2 new gifts, $75. Latest: Marcus Whitfield, $50 to Medical Fund.');
  });

  it('says nothing when nothing came in', () => {
    expect(newsSince(gifts, '2026-11-11')).toBeNull();
  });
});

describe('readVisit', () => {
  const gifts = data([{ donor: 'Elena Sorensen', date: '2026-11-10', amount: 25 }]);

  it('treats a first visit as one, then remembers the day', () => {
    expect(readVisit(gifts)).toEqual({ first: true, news: null });
    expect(store.get('gratia:lastVisit')).toBe('2026-11-12');
  });

  it('brings news to someone back on a later day', () => {
    store.set('gratia:lastVisit', '2026-11-09');
    expect(readVisit(gifts).news).toContain('1 new gift, $25');
  });

  it('stays quiet on a second visit the same day', () => {
    store.set('gratia:lastVisit', '2026-11-12');
    expect(readVisit(gifts)).toEqual({ first: false, news: null });
  });
});
