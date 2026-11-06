import { describe, expect, it } from 'vitest';
import { invoiceItemRows, transactionRows } from '@/lib/dashboard-data';
import type { Invoice, Transaction } from '@/lib/paypal';

const usd = (value: string) => ({ value, currency_code: 'USD' });

const transaction = (code: string, amount: string, fee = '0.00'): Transaction => ({
  transaction_info: {
    transaction_id: `${code}-${amount}`,
    transaction_event_code: code,
    transaction_initiation_date: '2026-11-04T12:56:00+0000',
    transaction_amount: usd(amount),
    fee_amount: usd(fee),
    transaction_status: 'S',
  },
});

describe('transactionRows', () => {
  it('names the ledger in plain words', () => {
    const types = transactionRows([transaction('T0005', '25.00'), transaction('T0006', '25.00'), transaction('T1107', '-20.00'), transaction('T0001', '-5.00')]);
    expect(types.map((row) => row.eventType)).toEqual(['Gift', 'Gift', 'Refund', 'Payout']);
  });

  it('leaves out holds and the sandbox opening balance', () => {
    const rows = transactionRows([transaction('T1900', '5000.00'), transaction('T1503', '-5.25'), transaction('T1105', '5.25'), transaction('T0005', '25.00')]);
    expect(rows.map((row) => row.eventType)).toEqual(['Gift']);
  });

  it('splits gifts, refunds and fees into positive amounts', () => {
    const [gift, refund] = transactionRows([transaction('T0005', '50.00', '-2.54'), transaction('T1107', '-20.00', '0.50')]);
    expect(gift).toMatchObject({ received: 50, refunded: 0, feesPaid: 2.54, net: 47.46, day: '2026-11-04' });
    expect(refund).toMatchObject({ received: 0, refunded: 20, feesPaid: -0.5 });
  });
});

describe('invoiceItemRows', () => {
  const invoice = (status: Invoice['status']): Invoice => ({
    id: status,
    status,
    detail: { invoice_number: status, currency_code: 'USD' },
    items: [{ name: 'Medical Fund', quantity: '1', unit_amount: usd('100.00') }],
  });

  it('counts committed gifts towards their program, but not drafts or cancelled pledges', () => {
    const rows = invoiceItemRows([invoice('PAID'), invoice('SENT'), invoice('DRAFT'), invoice('CANCELLED')]);
    expect(rows.map((row) => row.invoiceId)).toEqual(['PAID', 'SENT']);
    expect(rows[0].lineTotal).toBe(100);
  });
});
