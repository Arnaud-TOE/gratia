import { describe, expect, it } from 'vitest';
import type { DashboardData } from '@/lib/dashboard-data';
import { donorsAtRisk, overduePledges } from '@/lib/insights';

type Row<K extends keyof DashboardData> = DashboardData[K] extends (infer T)[] ? T : never;

const AS_OF = '2026-11-04T12:00:00.000Z';
const daysAgo = (n: number) => new Date(Date.parse(AS_OF) - n * 86_400_000).toISOString().slice(0, 10);

function dataset(parts: Partial<DashboardData>): DashboardData {
  return {
    asOf: AS_OF,
    customers: [],
    invoices: [],
    invoiceItems: [],
    invoicePayments: [],
    products: [],
    plans: [],
    transactions: [],
    payouts: [],
    balances: [],
    ...parts,
  };
}

const donor = (id: string, company = 'Individual'): Row<'customers'> => ({ id, name: id, company, email: `${id}@example.com` });

const invoice = (id: string, customerId: string, extra: Partial<Row<'invoices'>> = {}): Row<'invoices'> => ({
  id,
  number: id,
  customerId,
  status: 'Paid',
  statusGroup: 'Paid',
  currency: 'USD',
  paymentTerm: null,
  invoiceDate: daysAgo(30),
  dueDate: daysAgo(15),
  total: 0,
  issuedAmount: 0,
  paidAmount: 0,
  refundedAmount: 0,
  netCollected: 0,
  isReceivable: false,
  outstanding: 0,
  overdueAmount: 0,
  daysOverdue: 0,
  agingBucket: null,
  daysToPay: null,
  taxTotal: 0,
  ...extra,
});

// One paid gift: an invoice plus the payment recorded against it.
function gift(customerId: string, daysBack: number, amount: number, n: number) {
  const id = `${customerId}-${n}`;
  return {
    invoice: invoice(id, customerId),
    payment: { id: `${id}-p`, invoiceId: id, kind: 'Payment', method: 'Check', date: daysAgo(daysBack), amount, signedAmount: amount },
  };
}

function withGifts(customers: Row<'customers'>[], gifts: ReturnType<typeof gift>[]) {
  return dataset({ customers, invoices: gifts.map((g) => g.invoice), invoicePayments: gifts.map((g) => g.payment) });
}

describe('donorsAtRisk', () => {
  it('flags a monthly sponsor who stopped giving', () => {
    const gifts = [100, 70, 40].map((d, i) => gift('maya', d + 30, 35, i));
    const [result] = donorsAtRisk(withGifts([donor('maya')], gifts));
    expect(result).toMatchObject({ name: 'maya', segment: 'Lapsed monthly sponsor', gifts: 3, totalGiven: 105 });
  });

  it('leaves a monthly sponsor who is still giving alone', () => {
    const gifts = [70, 40, 10].map((d, i) => gift('omar', d, 15, i));
    expect(donorsAtRisk(withGifts([donor('omar')], gifts))).toEqual([]);
  });

  it('flags a first gift that was never followed, but only within a year', () => {
    const data = withGifts(
      [donor('recent'), donor('lost'), donor('ancient')],
      [gift('recent', 10, 50, 0), gift('lost', 100, 50, 0), gift('ancient', 400, 50, 0)],
    );
    expect(donorsAtRisk(data).map((d) => [d.name, d.segment])).toEqual([['lost', 'First gift, never returned']]);
  });

  it('leaves businesses to the pledge follow-up', () => {
    const data = withGifts([donor('acme', 'Acme Bakery')], [gift('acme', 200, 1200, 0)]);
    expect(donorsAtRisk(data)).toEqual([]);
  });

  it('lists the donors with the most to lose first', () => {
    const data = withGifts([donor('small'), donor('large')], [gift('small', 120, 20, 0), gift('large', 120, 500, 0)]);
    expect(donorsAtRisk(data).map((d) => d.name)).toEqual(['large', 'small']);
  });
});

describe('overduePledges', () => {
  it('returns only overdue pledges, largest balance first, named after the organization', () => {
    const data = dataset({
      customers: [donor('rosa', 'Bluebell Bakery'), donor('tom', 'Riverside Hardware Co.')],
      invoices: [
        invoice('INV-1', 'rosa', { total: 1200, outstanding: 1200, overdueAmount: 1200, daysOverdue: 40, status: 'Unpaid' }),
        invoice('INV-2', 'tom', { total: 2500, outstanding: 2500, overdueAmount: 2500, daysOverdue: 10, status: 'Unpaid' }),
        invoice('INV-3', 'tom', { total: 500, outstanding: 500, overdueAmount: 0, status: 'Unpaid' }),
      ],
    });
    expect(overduePledges(data).map((p) => [p.invoiceId, p.donor, p.outstanding])).toEqual([
      ['INV-2', 'Riverside Hardware Co.', 2500],
      ['INV-1', 'Bluebell Bakery', 1200],
    ]);
  });
});
