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
const MONTHLY_GAP_DAYS = 45;
const REPEAT_GAP_DAYS = 90;
const FIRST_GIFT_WINDOW = [30, 365] as const;

export function donorsAtRisk(data: DashboardData, today = new Date(data.asOf)): DonorAtRisk[] {
  const invoicesById = new Map(data.invoices.map((invoice) => [invoice.id, invoice]));
  const programsByInvoice = new Map<string, string>();
  for (const item of data.invoiceItems) programsByInvoice.set(item.invoiceId, item.name);

  const giftsByDonor = new Map<string, { date: string; amount: number; program?: string }[]>();
  for (const payment of data.invoicePayments) {
    const invoice = invoicesById.get(payment.invoiceId);
    if (!invoice || payment.kind !== 'Payment' || !payment.date) continue;
    const gifts = giftsByDonor.get(invoice.customerId) ?? [];
    gifts.push({ date: payment.date, amount: payment.amount, program: programsByInvoice.get(invoice.id) });
    giftsByDonor.set(invoice.customerId, gifts);
  }

  const atRisk: DonorAtRisk[] = [];
  for (const donor of data.customers) {
    // Businesses are followed up through their pledges, not as individual donors.
    if (donor.company && donor.company !== 'Individual') continue;
    const gifts = (giftsByDonor.get(donor.id) ?? []).sort((a, b) => a.date.localeCompare(b.date));
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
      programs: [...new Set(gifts.map((g) => g.program).filter((p): p is string => Boolean(p)))],
    });
  }
  // Most to lose first.
  return atRisk.sort((a, b) => b.totalGiven - a.totalGiven);
}

function segmentOf(dates: string[], daysSince: number): DonorSegment | null {
  if (dates.length === 1) {
    return daysSince >= FIRST_GIFT_WINDOW[0] && daysSince <= FIRST_GIFT_WINDOW[1] ? 'First gift, never returned' : null;
  }
  const gaps = dates.slice(1).map((date, i) => (Date.parse(date) - Date.parse(dates[i])) / DAY_MS);
  const typicalGap = gaps.sort((a, b) => a - b)[Math.floor(gaps.length / 2)];
  if (typicalGap <= 35) return daysSince > MONTHLY_GAP_DAYS ? 'Lapsed monthly sponsor' : null;
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
