// Harbor Lane is fictional, and its year of giving was seeded once. Left alone, that year would stop on
// the day it was seeded, and a few weeks later every monthly sponsor would read as lapsed. So a daily job
// (app/api/cron/daily-gifts) records what a day at the shelter brings: sponsors who are still giving give
// again when their month comes round, and every other day someone new gives. Sponsors who stopped stay
// stopped: they are who the Development Director is there to win back.
//
// This file only decides what is due, from PayPal's own records. Invoice numbers are fixed per month and
// per day, so a second run finds nothing left to do and PayPal would refuse a duplicate anyway.

import type { DashboardData } from './dashboard-data';
import { giftsByDonor, hasMonthlyHabit, MONTHLY_GAP_DAYS } from './insights';
import type { GiftMethod } from './paid-gift';

const DAY_MS = 86_400_000;

export type PlannedGift = {
  number: string;
  given: string;
  surname: string;
  email: string;
  amount: number;
  campaign: string;
  method: GiftMethod;
};

type GivingData = Pick<DashboardData, 'customers' | 'invoices' | 'invoicePayments'>;

const lastDayOfMonth = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();

function sponsorsDue(data: GivingData, today: Date): PlannedGift[] {
  const month = today.toISOString().slice(0, 7);
  const gifts = giftsByDonor(data);
  return data.customers.flatMap((donor) => {
    if (donor.company && donor.company !== 'Individual') return [];
    const history = gifts.get(donor.id) ?? [];
    const last = history.at(-1);
    if (!last || !donor.email || !hasMonthlyHabit(history.map((gift) => gift.date))) return [];

    const lastDate = new Date(`${last.date.slice(0, 10)}T00:00:00Z`);
    const stopped = (today.getTime() - lastDate.getTime()) / DAY_MS > MONTHLY_GAP_DAYS;
    const gaveThisMonth = last.date.startsWith(month);
    const theirDay = Math.min(lastDate.getUTCDate(), lastDayOfMonth(today));
    if (stopped || gaveThisMonth || today.getUTCDate() < theirDay) return [];

    const [given, ...surname] = donor.name.split(' ');
    const handle = donor.email.split('@')[0];
    return [
      {
        number: `HLAR-SP-${month.replace('-', '')}-${handle}`,
        given,
        surname: surname.join(' '),
        email: donor.email,
        amount: last.amount,
        campaign: last.program ?? 'Sponsor a Pet',
        method: 'BANK_TRANSFER' as const,
      },
    ];
  });
}

// Fictional people, in turn. Lists of coprime lengths, so the same people don't always give the same way.
const NEW_FRIENDS = [
  ['Elena', 'Sorensen'],
  ['Marcus', 'Whitfield'],
  ['Aisha', 'Rahman'],
  ['Tomas', 'Lindgren'],
  ['Nina', 'Castillo'],
  ['Owen', 'Gallagher'],
  ['Leila', 'Farouk'],
  ['Peter', 'Vasquez'],
  ['Rina', 'Takeda'],
  ['Felix', 'Brandt'],
  ['Joy', 'Adebayo'],
  ['Caleb', 'Rhodes'],
  ['Mira', 'Kovacs'],
  ['Sean', 'Doyle'],
  ['Tara', 'Singh'],
  ['Victor', 'Lam'],
  ['Ines', 'Duarte'],
  ['Paul', 'Hartmann'],
  ['Zoe', 'Archer'],
  ['Emeka', 'Obi'],
  ['Ruth', 'Ellison'],
  ['Karim', 'Saleh'],
  ['Lena', 'Holt'],
  ['Diego', 'Paredes'],
];
const AMOUNTS = [25, 50, 20, 100, 35, 75, 50, 150, 25, 60];
const CAMPAIGNS = ['Winter Shelter Drive', 'Medical Fund', 'Winter Shelter Drive', 'Winter Shelter Drive', 'Community Spay & Neuter'];
const METHODS: GiftMethod[] = ['CREDIT_CARD', 'CHECK', 'OTHER', 'CASH', 'CREDIT_CARD', 'CHECK', 'CREDIT_CARD'];

function newFriendDue(today: Date): PlannedGift[] {
  const day = Math.floor(today.getTime() / DAY_MS);
  if (day % 2 !== 0) return [];
  const turn = day / 2;
  const [given, surname] = NEW_FRIENDS[turn % NEW_FRIENDS.length];
  return [
    {
      number: `HLAR-NF-${today.toISOString().slice(0, 10).replaceAll('-', '')}`,
      given,
      surname,
      email: `${given}.${surname}@example.com`.toLowerCase(),
      amount: AMOUNTS[turn % AMOUNTS.length],
      campaign: CAMPAIGNS[turn % CAMPAIGNS.length],
      method: METHODS[turn % METHODS.length],
    },
  ];
}

/** What a day at the shelter brings, leaving out anything already recorded. */
export function giftsDueOn(data: GivingData, today: Date): PlannedGift[] {
  const recorded = new Set(data.invoices.map((invoice) => invoice.number));
  return [...sponsorsDue(data, today), ...newFriendDue(today)].filter((gift) => !recorded.has(gift.number));
}
