// What the dashboard says about a visitor's own visits: a first visit gets pointed at the director, and a
// visitor who comes back hears what came in since. The daily job (app/api/cron/daily-gifts) means there is
// news most days. Kept in this browser only.

import type { DashboardData } from '@/lib/dashboard-data';
import { giftsAfter } from '@/lib/insights';

const KEY = 'gratia:lastVisit';

export type Visit = { first: boolean; news: string | null };

const usd = (amount: number) => `$${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
const dayName = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

/** The line shown to someone back since `lastDay`, or null when nothing has come in. */
export function newsSince(data: DashboardData, lastDay: string): string | null {
  const gifts = giftsAfter(data, lastDay);
  if (gifts.length === 0) return null;
  const total = gifts.reduce((sum, gift) => sum + gift.amount, 0);
  const [latest] = gifts;
  const count = gifts.length === 1 ? '1 new gift' : `${gifts.length} new gifts`;
  return `Since your last visit on ${dayName(lastDay)}: ${count}, ${usd(total)}. Latest: ${latest.donor}, ${usd(latest.amount)}${latest.program ? ` to ${latest.program}` : ''}.`;
}

/** Reads the last visit, then records today's. */
export function readVisit(data: DashboardData, today = data.asOf.slice(0, 10)): Visit {
  let last: string | null = null;
  try {
    last = localStorage.getItem(KEY);
    localStorage.setItem(KEY, today);
  } catch {
    // Storage can be refused: then every visit is a first one.
  }
  if (!last) return { first: true, news: null };
  return { first: false, news: last < today ? newsSince(data, last) : null };
}
