import { beforeEach, describe, expect, it, vi } from 'vitest';

// What a visitor gets when a part of PayPal doesn't answer. The rest of the dashboard should still load.

const paypal = vi.hoisted(() => ({
  listProducts: vi.fn(),
  listPlans: vi.fn(),
  listInvoices: vi.fn(),
  searchTransactions: vi.fn(),
  getBalances: vi.fn(),
}));

vi.mock('@/lib/paypal', async (original) => ({ ...(await original<typeof import('@/lib/paypal')>()), ...paypal }));

const { getDashboardData } = await import('@/lib/dashboard-data');

const INVOICE = { id: 'INV-1', status: 'PAID', detail: { invoice_number: 'HLAR-1', currency_code: 'USD', invoice_date: '2026-11-01' } };
const PRODUCT = { id: 'P-1', name: 'Medical Fund' };

beforeEach(() => {
  paypal.listProducts.mockResolvedValue([PRODUCT]);
  paypal.listPlans.mockResolvedValue([]);
  paypal.listInvoices.mockResolvedValue([INVOICE]);
  paypal.searchTransactions.mockResolvedValue([]);
  paypal.getBalances.mockResolvedValue({ balances: [] });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('getDashboardData when PayPal has a bad moment', () => {
  it('still shows the gifts if the ledger and the balance are down', async () => {
    paypal.searchTransactions.mockRejectedValue(new Error('PayPal 503'));
    paypal.getBalances.mockRejectedValue(new Error('PayPal 503'));
    const data = await getDashboardData(new Date('2026-11-07T12:00:00Z'));
    expect(data.invoices.map((invoice) => invoice.id)).toEqual(['INV-1']);
    expect(data.transactions).toEqual([]);
    expect(data.balances).toEqual([]);
  });

  it('still shows the gifts if the catalog is down', async () => {
    paypal.listProducts.mockRejectedValue(new Error('PayPal 503'));
    paypal.listPlans.mockRejectedValue(new Error('PayPal 503'));
    const data = await getDashboardData(new Date('2026-11-07T12:00:00Z'));
    expect(data.invoices).toHaveLength(1);
    expect(data.products).toEqual([]);
  });

  it('keeps the part of the ledger that did answer', async () => {
    const gift = { transaction_info: { transaction_id: 'T-1', transaction_event_code: 'T0006', transaction_amount: { value: '50.00', currency_code: 'USD' } } };
    paypal.searchTransactions.mockRejectedValueOnce(new Error('PayPal 503')).mockResolvedValue([gift]);
    const data = await getDashboardData(new Date('2026-11-07T12:00:00Z'));
    // Three windows, one of which failed: the other two each answered with the same gift in this test.
    expect(data.transactions.map((row) => row.id)).toEqual(['T-1', 'T-1']);
  });

  it('does not pretend everything is fine when the gifts themselves are down', async () => {
    paypal.listInvoices.mockRejectedValue(new Error('PayPal 503'));
    await expect(getDashboardData(new Date('2026-11-07T12:00:00Z'))).rejects.toThrow('PayPal 503');
  });
});
