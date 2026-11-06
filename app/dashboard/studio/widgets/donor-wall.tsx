'use client';

// The donor wall: a custom AG Studio widget that ranks donors by what they have given, styled as a
// thank-you board rather than a ledger. AG Studio ships gauges, grids and charts but no
// leaderboard, so this one is ours. It reads through the widget API like a built-in widget, so
// page, date and cross filters all apply; clicking a donor filters the rest of the page to them;
// and it carries AI metadata so the agents can place it.

import { useMemo } from 'react';
import type { AgWidgetField, AgWidgetParams } from 'ag-studio';
import type { AgWidgetDefinition } from 'ag-studio-react';
import { useWidgetRows } from './use-widget-rows';

const MAX_ROWS = 8;
const MEDALS = ['🥇', '🥈', '🥉'];

type Entry = { name: string; amount: number; gifts: number | null };

type DonorWallMapping = { donor?: AgWidgetField[]; amount?: AgWidgetField[]; gifts?: AgWidgetField[] };

function DonorWall({ widgetApi, dataMapping }: AgWidgetParams) {
  const mapping = dataMapping as DonorWallMapping;
  const donor = mapping.donor?.[0];
  const amount = mapping.amount?.[0];
  const gifts = mapping.gifts?.[0];

  const rows = useWidgetRows(
    widgetApi,
    donor && amount
      ? {
          fields: gifts ? [donor, amount, gifts] : [donor, amount],
          sort: [{ field: amount, direction: 'desc' }],
          limit: { count: MAX_ROWS },
        }
      : null,
  );

  const entries = useMemo<Entry[]>(() => {
    if (!donor || !amount) return [];
    return rows
      .map((row) => ({
        name: String(row[donor.key] ?? 'Anonymous'),
        amount: Number(row[amount.key] ?? 0),
        gifts: gifts ? Number(row[gifts.key] ?? 0) : null,
      }))
      .filter((entry) => entry.amount > 0);
    // The field objects are rebuilt on every render; their keys don't change with them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, donor?.key, amount?.key, gifts?.key]);

  const selected = new Set(
    widgetApi.getCrossFilterSelections()?.flatMap((selection) => (selection.type === 'value' ? selection.values.map(String) : [])) ?? [],
  );
  const top = entries[0]?.amount || 1;
  return (
    <ol className="flex h-full flex-col gap-2 overflow-auto px-1 py-1">
      {entries.map((entry, i) => (
        <li
          key={entry.name}
          title={`Show only ${entry.name}`}
          onClick={() => donor && widgetApi.toggleCrossFilter({ type: 'value', group: 0, field: donor, value: entry.name })}
          className={`flex cursor-pointer items-center gap-3 rounded-xl bg-pp-canvas px-3 py-2 hover:bg-pp-highlight ${
            selected.has(entry.name) ? 'ring-2 ring-pp-blue' : ''
          }`}
        >
          <span className="w-7 shrink-0 text-center text-lg" aria-label={`Rank ${i + 1}`}>
            {MEDALS[i] ?? <span className="text-sm font-semibold text-pp-muted">{i + 1}</span>}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-2">
              <span className="truncate font-semibold text-pp-ink">{entry.name}</span>
              <span className="shrink-0 font-semibold text-pp-navy">
                {amount ? widgetApi.formatFieldValue(amount, entry.amount) : entry.amount}
              </span>
            </span>
            <span className="mt-1 flex items-center gap-2">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-pp-border">
                <span
                  className="block h-full rounded-full bg-pp-blue"
                  style={{ width: `${Math.max(4, (entry.amount / top) * 100)}%` }}
                />
              </span>
              {entry.gifts !== null && (
                <span className="shrink-0 text-xs text-pp-muted">
                  {entry.gifts} {entry.gifts === 1 ? 'gift' : 'gifts'}
                </span>
              )}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

const HEART_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20s-7-4.4-7-9.6C5 7.6 7 6 9.2 6c1.3 0 2.2.6 2.8 1.5C12.6 6.6 13.5 6 14.8 6 17 6 19 7.6 19 10.4 19 15.6 12 20 12 20Z"/></svg>';

export const donorWallDefinition: AgWidgetDefinition<'donor-wall'> = {
  id: 'donor-wall',
  label: 'Donor wall',
  icon: HEART_ICON,
  dataMapping: {
    donor: {
      type: 'field',
      supportedRoles: ['category'],
      required: true,
      aiDescription: 'Who gave: a donor name or organization field, e.g. Donors > Donor.',
    },
    amount: {
      type: 'field',
      supportedRoles: ['numeric'],
      required: true,
      aiDescription: 'How much they gave, aggregated with sum, e.g. Gift Payments > Net Cash.',
    },
    gifts: {
      type: 'field',
      supportedRoles: ['numeric'],
      aiDescription: 'Optional: how many gifts, e.g. a distinct count of the id field invoicePayments.giftId.',
    },
  },
  form: (params) =>
    params.createDefaults({
      dataMappingItems: [
        { key: 'donor', label: 'Donor' },
        { key: 'amount', label: 'Amount given' },
        { key: 'gifts', label: 'Number of gifts' },
      ],
    }),
  comp: DonorWall,
  defaultSize: { width: 360, height: 420 },
  minSize: { width: 260, height: 240 },
  ai: {
    label: 'Donor wall',
    description:
      'A thank-you board: donors ranked by how much they gave, a medal for the top three, a bar for each amount and an optional gift count.',
    usage: 'Use to celebrate the top supporters of the rescue or of one campaign. Not for trends over time.',
    configuration: 'Map donor to Donors > Donor and amount to the sum of Gift Payments > Net Cash; gifts is optional.',
  },
};
