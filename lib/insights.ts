// Fundraising questions answered from the dashboard's PayPal data: which donors are drifting away,
// and which business pledges are overdue. Pure functions, so the agent's tools and the tests share
// one implementation.

import type { DashboardData } from './dashboard-data';

const DAY_MS = 86_400_000;
const round2 = (n: number) => Math.round(n * 100) / 100;

export type DonorSegment = 'Lapsed monthly sponsor' | 'Lapsed repeat donor' | 'First gift, never returned';

export type DonorAtRisk = {
  name: string;
  email: string | null;
  segment: DonorSegment;
  gifts: number;
  totalGiven: number;
  typicalGift: number;
  lastGiftDate: string;
  daysSinceLastGift: number;
  programs: string[];
};

// A monthly sponsor who misses six weeks has probably stopped; anyone else gets a quarter before
// we call them lapsed, and a first gift older than a year is past the point a note can win back.
export const MONTHLY_GAP_DAYS = 45;
const REPEAT_GAP_DAYS = 90;
const FIRST_GIFT_WINDOW = [30, 365] as const;
const MIN_GIFTS_FOR_A_HABIT = 3;
const MONTHLY_RHYTHM_DAYS = [25, 35] as const;

export type DonorGift = { date: string; amount: number; invoiceId: string; program: string | null };

/** Each donor's gifts, oldest first. */
export function giftsByDonor(data: Pick<DashboardData, 'invoices' | 'invoicePayments'>): Map<string, DonorGift[]> {
  const invoicesById = new Map(data.invoices.map((invoice) => [invoice.id, invoice]));
  const byDonor = new Map<string, DonorGift[]>();
  for (const payment of data.invoicePayments) {
    const invoice = invoicesById.get(payment.invoiceId);
    if (!invoice || payment.kind !== 'Payment' || !payment.date) continue;
    // A gift refunded in full never happened, as far as a thank-you note is concerned.
    if (invoice.refundedAmount > 0 && invoice.refundedAmount >= invoice.paidAmount) continue;
    const gifts = byDonor.get(invoice.customerId) ?? [];
    gifts.push({ date: payment.date, amount: payment.amount, invoiceId: invoice.id, program: payment.program });
    byDonor.set(invoice.customerId, gifts);
  }
  for (const gifts of byDonor.values()) gifts.sort((a, b) => a.date.localeCompare(b.date));
  return byDonor;
}

export function donorsAtRisk(data: DashboardData, today = new Date(data.asOf)): DonorAtRisk[] {
  const programsByInvoice = new Map<string, string>();
  for (const item of data.invoiceItems) programsByInvoice.set(item.invoiceId, item.name);
  const history = giftsByDonor(data);

  const atRisk: DonorAtRisk[] = [];
  for (const donor of data.customers) {
    // Businesses are followed up through their pledges, not as individual donors.
    if (donor.company && donor.company !== 'Individual') continue;
    const gifts = history.get(donor.id) ?? [];
    if (gifts.length === 0) continue;

    const last = gifts[gifts.length - 1];
    const daysSince = Math.floor((today.getTime() - Date.parse(last.date)) / DAY_MS);
    const segment = segmentOf(gifts.map((g) => g.date), daysSince);
    if (!segment) continue;

    const total = gifts.reduce((sum, gift) => sum + gift.amount, 0);
    atRisk.push({
      name: donor.name,
      email: donor.email,
      segment,
      gifts: gifts.length,
      totalGiven: round2(total),
      typicalGift: round2(total / gifts.length),
      lastGiftDate: last.date,
      daysSinceLastGift: daysSince,
      programs: [...new Set(gifts.map((g) => programsByInvoice.get(g.invoiceId)).filter((p): p is string => Boolean(p)))],
    });
  }
  // Most to lose first.
  return atRisk.sort((a, b) => b.totalGiven - a.totalGiven);
}

/** Whether these gift dates, oldest first, look like a monthly habit. It takes more than two gifts to make one. */
export function hasMonthlyHabit(dates: string[]): boolean {
  if (dates.length < MIN_GIFTS_FOR_A_HABIT) return false;
  const gaps = dates.slice(1).map((date, i) => (Date.parse(date) - Date.parse(dates[i])) / DAY_MS);
  const typicalGap = gaps.sort((a, b) => a - b)[Math.floor(gaps.length / 2)];
  return typicalGap >= MONTHLY_RHYTHM_DAYS[0] && typicalGap <= MONTHLY_RHYTHM_DAYS[1];
}

function segmentOf(dates: string[], daysSince: number): DonorSegment | null {
  if (dates.length === 1) {
    return daysSince >= FIRST_GIFT_WINDOW[0] && daysSince <= FIRST_GIFT_WINDOW[1] ? 'First gift, never returned' : null;
  }
  if (hasMonthlyHabit(dates)) return daysSince > MONTHLY_GAP_DAYS ? 'Lapsed monthly sponsor' : null;
  return daysSince > REPEAT_GAP_DAYS ? 'Lapsed repeat donor' : null;
}

export type OverduePledge = {
  invoiceId: string;
  invoiceNumber: string;
  donor: string;
  contact: string;
  email: string | null;
  pledged: number;
  outstanding: number;
  daysOverdue: number;
  dueDate: string | null;
  status: string;
};

export function overduePledges(data: DashboardData): OverduePledge[] {
  const customers = new Map(data.customers.map((customer) => [customer.id, customer]));
  return data.invoices
    .filter((invoice) => invoice.overdueAmount > 0)
    .map((invoice) => {
      const customer = customers.get(invoice.customerId);
      return {
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        donor: customer?.company && customer.company !== 'Individual' ? customer.company : (customer?.name ?? 'Unknown'),
        contact: customer?.name ?? 'Unknown',
        email: customer?.email ?? null,
        pledged: invoice.total,
        outstanding: invoice.outstanding,
        daysOverdue: invoice.daysOverdue,
        dueDate: invoice.dueDate,
        status: invoice.status,
      };
    })
    .sort((a, b) => b.outstanding - a.outstanding);
}

export type DatedGift = { donor: string; amount: number; program: string | null; date: string };

/** Gifts paid after `day` (YYYY-MM-DD), newest first. A gift refunded in full doesn't count. */
export function giftsAfter(data: Pick<DashboardData, 'customers' | 'invoices' | 'invoicePayments'>, day: string): DatedGift[] {
  const names = new Map(data.customers.map((donor) => [donor.id, donor.name]));
  const history = giftsByDonor(data);
  const gifts: DatedGift[] = [];
  for (const [donorId, donorGifts] of history) {
    for (const gift of donorGifts) {
      if (gift.date.slice(0, 10) > day) gifts.push({ donor: names.get(donorId) ?? 'A donor', amount: gift.amount, program: gift.program, date: gift.date });
    }
  }
  return gifts.sort((a, b) => b.date.localeCompare(a.date));
}

export type NewGift = { id: string; donor: string; amount: number; program: string | null };

/** Gifts in `data` whose payment id isn't in `known`: what has come in since the last read. */
export function giftsSince(known: ReadonlySet<string>, data: DashboardData): NewGift[] {
  const invoices = new Map(data.invoices.map((invoice) => [invoice.id, invoice]));
  const donors = new Map(data.customers.map((donor) => [donor.id, donor.name]));
  return data.invoicePayments
    .filter((payment) => payment.kind === 'Payment' && !known.has(payment.id))
    .map((payment) => {
      const invoice = invoices.get(payment.invoiceId);
      return {
        id: payment.id,
        donor: (invoice && donors.get(invoice.customerId)) ?? 'A donor',
        amount: payment.amount,
        program: payment.program,
      };
    });
}
