import { describe, expect, it } from 'vitest';
import { progressOf } from '@/lib/campaign-progress';

const rows = {
  customers: [
    { id: 'c1', name: 'Tara Singh' },
    { id: 'c2', name: 'Alex Rivera' },
    { id: 'c3', name: 'Daniel Martin' },
  ],
  invoices: [
    { id: 'i1', customerId: 'c1' },
    { id: 'i2', customerId: 'c2' },
    { id: 'i3', customerId: 'c2' },
    { id: 'i4', customerId: 'c3' },
  ],
  invoicePayments: [
    { invoiceId: 'i1', program: 'Winter Shelter Drive', signedAmount: 20, amount: 20, giftId: 'g1', date: '2026-11-07' },
    { invoiceId: 'i2', program: 'Winter Shelter Drive', signedAmount: 50, amount: 50, giftId: 'g2', date: '2026-11-05' },
    { invoiceId: 'i3', program: 'Winter Shelter Drive', signedAmount: 25, amount: 25, giftId: 'g3', date: '2026-11-06' },
    { invoiceId: 'i3', program: 'Winter Shelter Drive', signedAmount: -25, amount: 25, giftId: null, date: '2026-11-06' },
    { invoiceId: 'i4', program: 'Medical Fund', signedAmount: 100, amount: 100, giftId: 'g4', date: '2026-11-08' },
  ],
};

describe('progressOf', () => {
  it('adds up one campaign, net of refunds, against its goal', () => {
    const progress = progressOf(rows, 'Winter Shelter Drive');
    expect(progress).toMatchObject({ campaign: 'Winter Shelter Drive', raised: 70, goal: 1500, donors: 2 });
  });

  it('lists each recent donor once, newest first, by first name and initial', () => {
    expect(progressOf(rows, 'Winter Shelter Drive').recent).toEqual([
      { name: 'Tara S.', amount: 20 },
      { name: 'Alex R.', amount: 25 },
    ]);
  });

  it('knows a campaign with no goal and no gifts', () => {
    expect(progressOf(rows, 'Spring Fair')).toEqual({ campaign: 'Spring Fair', raised: 0, goal: null, donors: 0, recent: [] });
  });
});
