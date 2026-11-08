// How one campaign is doing, for the donation page: what it raised in PayPal, against its goal, from how
// many donors, and who gave last. The same figures as the dashboard's Campaign goals widget.

import { givingRows } from './dashboard-data';
import { goalFor } from './organization';
import { listInvoices } from './paypal';

type Rows = {
  customers: { id: string; name: string }[];
  invoices: { id: string; customerId: string }[];
  invoicePayments: { invoiceId: string; program: string | null; signedAmount: number; amount: number; giftId: string | null; date: string | null }[];
};

export type CampaignProgress = {
  campaign: string;
  raised: number;
  goal: number | null;
  donors: number;
  /** The latest donors, newest first, as "Tara S.". */
  recent: { name: string; amount: number }[];
};

const shortName = (full: string) => {
  const [first, ...rest] = full.trim().split(/\s+/);
  const last = rest.at(-1);
  return last ? `${first} ${last[0]}.` : first;
};

export function progressOf(rows: Rows, campaign: string, recentCount = 4): CampaignProgress {
  const customerOf = new Map(rows.invoices.map((invoice) => [invoice.id, invoice.customerId]));
  const nameOf = new Map(rows.customers.map((customer) => [customer.id, customer.name]));
  const payments = rows.invoicePayments.filter((payment) => payment.program === campaign);

  const raised = Math.round(payments.reduce((sum, payment) => sum + payment.signedAmount, 0) * 100) / 100;
  const donors = new Set(payments.filter((payment) => payment.signedAmount > 0).map((payment) => customerOf.get(payment.invoiceId)));

  const seen = new Set<string | undefined>();
  const recent = payments
    .filter((payment) => payment.giftId && payment.date)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .flatMap((payment) => {
      const customer = customerOf.get(payment.invoiceId);
      if (seen.has(customer)) return [];
      seen.add(customer);
      return [{ name: shortName(nameOf.get(customer ?? '') ?? 'A friend'), amount: payment.amount }];
    })
    .slice(0, recentCount);

  return { campaign, raised: Math.max(0, raised), goal: goalFor(campaign), donors: donors.size, recent };
}

/** The campaign's progress from PayPal, or null when PayPal is slow or unavailable: the page works without it. */
export async function readCampaignProgress(campaign: string, timeoutMs = 8000): Promise<CampaignProgress | null> {
  try {
    const invoices = await Promise.race([
      listInvoices(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);
    if (!invoices) return null;
    return progressOf(givingRows(invoices, new Date().toISOString().slice(0, 10)), campaign);
  } catch (error) {
    console.error('[donate] could not read the campaign progress', error);
    return null;
  }
}
