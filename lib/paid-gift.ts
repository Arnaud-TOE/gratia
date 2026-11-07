// A gift, recorded in PayPal Invoicing as a paid invoice: that is what puts it on the dashboard and in the
// donor's giving history. Three PayPal calls: create, issue without emailing anyone, and record the payment.

import { ORGANIZATION } from './organization';
import { post } from './paypal';

export type GiftMethod = 'PAYPAL' | 'BANK_TRANSFER' | 'CHECK' | 'CASH' | 'CREDIT_CARD' | 'OTHER';

export type PaidGift = {
  number: string;
  /** Where the gift came from: a PayPal capture id, or the name of the demo job. */
  reference: string;
  given: string;
  surname: string;
  email?: string;
  amount: string;
  campaign: string;
  itemDescription: string;
  note: string;
  method: GiftMethod;
  paymentNote: string;
};

export async function recordPaidGift(gift: PaidGift): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const invoice = await post<{ id?: string; href?: string }>('/v2/invoicing/invoices', {
    detail: {
      invoice_number: gift.number,
      reference: gift.reference,
      currency_code: 'USD',
      invoice_date: today,
      payment_term: { term_type: 'DUE_ON_RECEIPT' },
      note: gift.note,
    },
    invoicer: { business_name: ORGANIZATION },
    primary_recipients: [
      {
        billing_info: {
          name: { given_name: gift.given, surname: gift.surname },
          ...(gift.email && { email_address: gift.email }),
        },
      },
    ],
    items: [{ name: gift.campaign, description: gift.itemDescription, quantity: '1', unit_amount: { currency_code: 'USD', value: gift.amount } }],
  });
  const id = invoice.id ?? invoice.href?.split('/').pop();
  await post(`/v2/invoicing/invoices/${id}/send`, { send_to_invoicer: false, send_to_recipient: false });
  await post(`/v2/invoicing/invoices/${id}/payments`, {
    method: gift.method,
    payment_date: today,
    amount: { currency_code: 'USD', value: gift.amount },
    note: gift.paymentNote,
  });
}
