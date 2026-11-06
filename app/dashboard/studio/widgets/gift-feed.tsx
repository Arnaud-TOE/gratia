'use client';

// The gift feed: a custom AG Studio widget listing the newest gifts, so a gift made a moment ago
// shows up at the top, marked "New" (the dashboard re-reads PayPal when one arrives; see
// use-live-gifts.ts). AG Studio has no live list of events.

import { useEffect, useMemo, useRef, useState } from 'react';
import type { AgWidgetField, AgWidgetParams } from 'ag-studio';
import type { AgWidgetDefinition } from 'ag-studio-react';
import { dayOf, useWidgetRows } from './use-widget-rows';

const MAX_GIFTS = 6;
const DAY_MS = 86_400_000;

type Mapping = { donor?: AgWidgetField[]; date?: AgWidgetField[]; amount?: AgWidgetField[]; program?: AgWidgetField[]; gift?: AgWidgetField[] };

type Gift = { key: string; donor: string; day: string; amount: number; program: string | null };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');

function whenGiven(day: string, today: string) {
  const days = Math.round((Date.parse(today) - Date.parse(day)) / DAY_MS);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 31) return `${days} days ago`;
  return new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function GiftFeed({ widgetApi, dataMapping }: AgWidgetParams) {
  const mapping = dataMapping as Mapping;
  const donor = mapping.donor?.[0];
  const date = mapping.date?.[0];
  const amount = mapping.amount?.[0];
  const program = mapping.program?.[0];
  // Fields group the query, so without this two gifts from one donor on one day would merge.
  const giftId = mapping.gift?.[0];

  const rows = useWidgetRows(
    widgetApi,
    donor && date && amount
      ? {
          fields: [donor, date, amount, ...(program ? [program] : []), ...(giftId ? [giftId] : [])],
          sort: [{ field: date, direction: 'desc' }],
          // Refunds come back too, and are dropped below.
          limit: { count: MAX_GIFTS * 3 },
        }
      : null,
  );

  const gifts = useMemo(() => {
    if (!donor || !date || !amount) return [];
    return rows
      .flatMap((row): Gift[] => {
        const day = dayOf(row[date.key]);
        const given = Number(row[amount.key] ?? 0);
        if (!day || given <= 0) return [];
        const name = String(row[donor.key] ?? 'Anonymous');
        const purpose = program ? (row[program.key] as string | null | undefined) : null;
        const key = giftId ? String(row[giftId.key]) : `${name}|${day}|${given}|${purpose ?? ''}`;
        return [{ key, donor: name, day, amount: given, program: purpose ?? null }];
      })
      .slice(0, MAX_GIFTS);
    // The field objects are rebuilt on every render; their keys don't change with them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, donor?.key, date?.key, amount?.key, program?.key, giftId?.key]);

  const today = new Date().toISOString().slice(0, 10);

  // A gift of today's that wasn't here on the last read has just arrived. (Filtering can also bring
  // rows back, but only today's count, so that rarely passes for news.)
  const seen = useRef<Set<string> | null>(null);
  const [arrived, setArrived] = useState<ReadonlySet<string>>(new Set());
  useEffect(() => {
    if (gifts.length === 0) return;
    if (seen.current) {
      const known = seen.current;
      const fresh = gifts.filter((gift) => gift.day === today && !known.has(gift.key)).map((gift) => gift.key);
      if (fresh.length > 0) setArrived(new Set(fresh));
    }
    seen.current = new Set([...(seen.current ?? []), ...gifts.map((gift) => gift.key)]);
  }, [gifts, today]);

  if (!amount) return null;
  return (
    <ul className="flex h-full flex-col gap-1.5 overflow-auto px-1 py-0.5">
      {gifts.map((gift) => {
        const isNew = arrived.has(gift.key);
        return (
          <li
            key={gift.key}
            className={`flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 ${isNew ? 'gift-arrived bg-pp-highlight' : 'bg-pp-canvas'}`}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-pp-blue text-xs font-semibold text-white" aria-hidden>
              {initials(gift.donor)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-semibold text-pp-ink">{gift.donor}</span>
                <span className="shrink-0 text-sm font-semibold text-pp-navy">{widgetApi.formatFieldValue(amount, gift.amount)}</span>
              </span>
              <span className="flex items-center justify-between gap-2 text-xs text-pp-muted">
                <span className="truncate">{gift.program ?? 'General fund'}</span>
                {isNew ? (
                  <span className="shrink-0 rounded-full bg-pp-success px-1.5 py-px text-[10px] font-semibold text-white">New</span>
                ) : (
                  <span className="shrink-0">{whenGiven(gift.day, today)}</span>
                )}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

const PULSE_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2.5-6 4 12 2.5-6h5"/></svg>';

export const giftFeedDefinition: AgWidgetDefinition<'gift-feed'> = {
  id: 'gift-feed',
  label: 'Latest gifts',
  icon: PULSE_ICON,
  dataMapping: {
    donor: {
      type: 'field',
      supportedRoles: ['category'],
      required: true,
      aiDescription: 'Who gave: a donor name field, e.g. Donors > Donor.',
    },
    date: {
      type: 'field',
      supportedRoles: ['temporal'],
      required: true,
      aiDescription: 'When they gave: a date field, not a calendar bucket, e.g. Gift Payments > Payment Date.',
    },
    amount: {
      type: 'field',
      supportedRoles: ['numeric'],
      required: true,
      aiDescription: 'How much they gave, aggregated with sum, e.g. Gift Payments > Net Cash.',
    },
    program: {
      type: 'field',
      supportedRoles: ['category'],
      aiDescription: 'Optional: what the gift was for, e.g. Gift Payments > Gift Program.',
    },
    gift: {
      type: 'field',
      supportedRoles: ['category'],
      aiDescription: 'Optional: an id unique to each gift, so two gifts from one donor on one day stay separate, e.g. the field invoicePayments.id.',
    },
  },
  form: (params) =>
    params.createDefaults({
      dataMappingItems: [
        { key: 'donor', label: 'Donor' },
        { key: 'date', label: 'Gift date' },
        { key: 'amount', label: 'Amount given' },
        { key: 'program', label: 'Program' },
        { key: 'gift', label: 'Gift id' },
      ],
    }),
  comp: GiftFeed,
  defaultSize: { width: 340, height: 340 },
  minSize: { width: 240, height: 200 },
  ai: {
    label: 'Latest gifts',
    description: 'A live list of the newest gifts: donor, amount, program and when. A gift that has just arrived is marked "New".',
    usage: 'Use to show what is coming in right now. Not for rankings (use the donor wall) or trends (use a chart).',
    configuration:
      'Map donor to Donors > Donor, date to Gift Payments > Payment Date, amount to the sum of Gift Payments > Net Cash and, optionally, program to Gift Payments > Gift Program.',
  },
};
