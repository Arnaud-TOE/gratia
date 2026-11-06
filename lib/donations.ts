// Online donations. The gift itself is a PayPal Checkout order (PayPal Server SDK); once it is
// captured, a paid receipt is recorded in PayPal Invoicing. That receipt is what puts the gift on
// the dashboard straight away (Transaction Search can take hours to list a new payment) and in the
// donor's giving history next to their pledges.

import {
  CheckoutPaymentIntent,
  ItemCategory,
  OrderStatus,
  PaypalExperienceUserAction,
  PaypalWalletContextShippingPreference,
} from '@paypal/paypal-server-sdk';
import { after } from 'next/server';
import { ORGANIZATION } from './organization';
import { post } from './paypal';
import { ordersApi } from './paypal-sdk';

export { ORGANIZATION };

export const CAMPAIGNS = ['Winter Shelter Drive', 'Medical Fund', 'Sponsor a Pet', 'Community Spay & Neuter'] as const;
export type Campaign = (typeof CAMPAIGNS)[number];

export const MIN_DONATION = 1;
export const MAX_DONATION = 10_000;

export type DonationRequest = { amount: number; campaign: Campaign };

/** Validates a donation request from the browser; never trust its amount or campaign as sent. */
export function parseDonation(input: unknown): DonationRequest | { error: string } {
  const { amount, campaign } = (input ?? {}) as { amount?: unknown; campaign?: unknown };
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return { error: 'Amount must be a number.' };
  const cents = Math.round(amount * 100);
  if (cents < MIN_DONATION * 100 || cents > MAX_DONATION * 100) {
    return { error: `Donations must be between $${MIN_DONATION} and $${MAX_DONATION.toLocaleString('en-US')}.` };
  }
  if (!CAMPAIGNS.includes(campaign as Campaign)) return { error: 'Unknown campaign.' };
  return { amount: cents / 100, campaign: campaign as Campaign };
}

export async function createDonationOrder({ amount, campaign }: DonationRequest): Promise<string> {
  const value = amount.toFixed(2);
  const { result } = await ordersApi().createOrder({
    body: {
      intent: CheckoutPaymentIntent.Capture,
      purchaseUnits: [
        {
          amount: { currencyCode: 'USD', value, breakdown: { itemTotal: { currencyCode: 'USD', value } } },
          description: campaign,
          softDescriptor: 'HARBORLANE',
          items: [{ name: campaign, quantity: '1', category: ItemCategory.Donation, unitAmount: { currencyCode: 'USD', value } }],
        },
      ],
      // A gift, not a purchase: nothing to ship, PayPal's page names the rescue, and the donor
      // confirms the gift there rather than coming back to a review step.
      paymentSource: {
        paypal: {
          experienceContext: {
            brandName: ORGANIZATION,
            shippingPreference: PaypalWalletContextShippingPreference.NoShipping,
            userAction: PaypalExperienceUserAction.PayNow,
          },
        },
      },
    },
    prefer: 'return=minimal',
  });
  if (!result.id) throw new Error('PayPal returned no order id.');
  return result.id;
}

export type DonationReceipt = {
  donor: string;
  amount: string;
  campaign: string;
  receiptNumber: string;
};

export async function captureDonation(orderId: string): Promise<DonationReceipt> {
  const { result: order } = await ordersApi().captureOrder({ id: orderId, prefer: 'return=representation' });
  const unit = order.purchaseUnits?.[0];
  const capture = unit?.payments?.captures?.[0];
  if (order.status !== OrderStatus.Completed || !capture?.id) {
    throw new Error(`The donation did not complete (order status ${order.status ?? 'unknown'}).`);
  }

  const given = order.payer?.name?.givenName ?? 'Friend';
  const surname = order.payer?.name?.surname ?? '';
  const amount = capture.amount?.value ?? '0.00';
  const campaign = unit?.description ?? 'General fund';
  // The gift is complete. The receipt takes three more PayPal calls, so the donor doesn't wait for it.
  const gift = { captureId: capture.id, given, surname, email: order.payer?.emailAddress, amount, campaign };
  after(() => recordReceipt(gift));
  return { donor: `${given} ${surname}`.trim(), amount, campaign, receiptNumber: receiptNumberFor(capture.id) };
}

const receiptNumberFor = (captureId: string) => `HLAR-WEB-${captureId.slice(-8)}`;

type ReceiptInput = {
  captureId: string;
  given: string;
  surname: string;
  email?: string;
  amount: string;
  campaign: string;
};

// A paid invoice carrying the PayPal capture id: the donor's receipt and the dashboard's record of
// the gift. A failure here must not fail the donation, which has already been captured.
async function recordReceipt(gift: ReceiptInput): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const receiptNumber = receiptNumberFor(gift.captureId);
  try {
    const invoice = await post<{ id?: string; href?: string }>('/v2/invoicing/invoices', {
      detail: {
        invoice_number: receiptNumber,
        reference: gift.captureId,
        currency_code: 'USD',
        invoice_date: today,
        payment_term: { term_type: 'DUE_ON_RECEIPT' },
        note: `Thank you for supporting ${ORGANIZATION}. This receipt confirms your online donation.`,
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
      items: [{ name: gift.campaign, description: 'Online donation', quantity: '1', unit_amount: { currency_code: 'USD', value: gift.amount } }],
    });
    const id = invoice.id ?? invoice.href?.split('/').pop();
    await post(`/v2/invoicing/invoices/${id}/send`, { send_to_invoicer: false, send_to_recipient: false });
    await post(`/v2/invoicing/invoices/${id}/payments`, {
      method: 'PAYPAL',
      payment_date: today,
      amount: { currency_code: 'USD', value: gift.amount },
      note: `PayPal capture ${gift.captureId}`,
    });
  } catch (error) {
    console.error('[donations] receipt not recorded for capture', gift.captureId, error);
  }
}
