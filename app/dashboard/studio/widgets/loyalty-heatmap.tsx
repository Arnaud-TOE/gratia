'use client';

// The loyalty heatmap: a custom AG Studio widget with one row per donor and one column per month, so
// a volunteer can see at a glance who keeps coming back and who has stopped. AG Studio has no
// heatmap, and the question it answers ("who are we losing?") is the one the assistant is here for.
// Clicking a donor filters the rest of the page to them.

import { useMemo } from 'react';
import type { AgWidgetField, AgWidgetParams } from 'ag-studio';
import type { AgWidgetDefinition } from 'ag-studio-react';
import { buildLoyaltyGrid } from '@/lib/loyalty';
import { dayOf, useWidgetRows } from './use-widget-rows';

const MAX_DONORS = 9;
const QUIET_TINT = 'rgba(245, 158, 11, 0.18)';

type Mapping = { donor?: AgWidgetField[]; date?: AgWidgetField[]; amount?: AgWidgetField[] };

// Darker for more, on a log scale, so a $15 monthly gift still shows next to a $3,000 pledge.
const heat = (amount: number, top: number) =>
  `color-mix(in srgb, var(--pp-blue) ${Math.round(25 + 75 * (Math.log1p(amount) / Math.log1p(top || 1)) ** 1.5)}%, transparent)`;

function LoyaltyHeatmap({ widgetApi, dataMapping }: AgWidgetParams) {
  const mapping = dataMapping as Mapping;
  const donor = mapping.donor?.[0];
  const date = mapping.date?.[0];
  const amount = mapping.amount?.[0];

  const rows = useWidgetRows(widgetApi, donor && date && amount ? { fields: [donor, date, amount], limit: { count: 5000 } } : null);

  const grid = useMemo(() => {
    if (!donor || !date || !amount) return null;
    const gifts = rows.flatMap((row) => {
      const day = dayOf(row[date.key]);
      return day ? [{ donor: String(row[donor.key] ?? 'Anonymous'), day, amount: Number(row[amount.key] ?? 0) }] : [];
    });
    return buildLoyaltyGrid(gifts, new Date());
    // The field objects are rebuilt on every render; their keys don't change with them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, donor?.key, date?.key, amount?.key]);

  if (!grid || !donor || !amount) return null;

  const selected = new Set(
    widgetApi.getCrossFilterSelections()?.flatMap((selection) => (selection.type === 'value' ? selection.values.map(String) : [])) ?? [],
  );
  const shown = grid.donors.slice(0, MAX_DONORS);
  const columns = `minmax(96px, 1.5fr) repeat(${grid.months.length}, minmax(0, 1fr))`;

  return (
    <div className="flex h-full flex-col gap-1.5 px-1 text-xs">
      <div className="grid items-center gap-[3px] text-center text-pp-muted" style={{ gridTemplateColumns: columns }}>
        <span />
        {grid.months.map((month) => (
          <span key={month.key} title={month.label}>
            {month.letter}
          </span>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-[3px]">
        {shown.map((row) => (
          <button
            key={row.name}
            type="button"
            title={`Show only ${row.name}`}
            onClick={() => widgetApi.toggleCrossFilter({ type: 'value', group: 0, field: donor, value: row.name })}
            className={`grid min-h-0 flex-1 items-stretch gap-[3px] rounded text-left hover:bg-pp-highlight ${
              selected.has(row.name) ? 'ring-2 ring-pp-blue' : ''
            }`}
            style={{ gridTemplateColumns: columns }}
          >
            <span className="flex items-center gap-1.5 truncate pr-1 font-medium text-pp-ink">
              <span className="truncate">{row.name}</span>
              {row.quiet && <span className="size-1.5 shrink-0 rounded-full bg-amber-500" aria-label="Gone quiet" />}
            </span>
            {row.months.map((given, i) => (
              <span
                key={grid.months[i].key}
                className="rounded-[3px]"
                title={given > 0 ? `${grid.months[i].label}: ${widgetApi.formatFieldValue(amount, given)}` : `${grid.months[i].label}: no gift`}
                style={{
                  backgroundColor:
                    given > 0 ? heat(given, grid.top) : row.quiet && i > row.lastActive ? QUIET_TINT : 'var(--pp-canvas)',
                }}
              />
            ))}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 pt-0.5 text-pp-muted">
        <span className="flex items-center gap-1">
          Less
          {[10, 50, 250, 2500].map((level) => (
            <span key={level} className="size-2.5 rounded-[3px]" style={{ backgroundColor: heat(level, 2500) }} />
          ))}
          More
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: QUIET_TINT }} />
          {grid.quietCount} of {grid.donors.length} donors gone quiet
        </span>
      </div>
    </div>
  );
}

const GRID_ICON =
  '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="5" height="5" rx="1"/><rect x="10" y="3" width="5" height="5" rx="1" opacity=".7"/><rect x="17" y="3" width="4" height="5" rx="1" opacity=".3"/><rect x="3" y="10" width="5" height="5" rx="1" opacity=".7"/><rect x="10" y="10" width="5" height="5" rx="1" opacity=".3"/><rect x="17" y="10" width="4" height="5" rx="1" opacity=".15"/><rect x="3" y="17" width="5" height="4" rx="1" opacity=".3"/><rect x="10" y="17" width="5" height="4" rx="1" opacity=".15"/><rect x="17" y="17" width="4" height="4" rx="1" opacity=".15"/></svg>';

export const loyaltyHeatmapDefinition: AgWidgetDefinition<'loyalty-heatmap'> = {
  id: 'loyalty-heatmap',
  label: 'Loyalty heatmap',
  icon: GRID_ICON,
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
  },
  form: (params) =>
    params.createDefaults({
      dataMappingItems: [
        { key: 'donor', label: 'Donor' },
        { key: 'date', label: 'Gift date' },
        { key: 'amount', label: 'Amount given' },
      ],
    }),
  comp: LoyaltyHeatmap,
  defaultSize: { width: 640, height: 320 },
  minSize: { width: 420, height: 220 },
  ai: {
    label: 'Loyalty heatmap',
    description:
      'One row per donor and one column per month of the last year, darker for larger gifts. Rows that stop short, tinted amber, are donors who have gone quiet.',
    usage: 'Use to see who keeps giving and who has stopped, month by month. Not for totals: use a KPI or the donor wall for those.',
    configuration: 'Map donor to Donors > Donor, date to Gift Payments > Payment Date and amount to the sum of Gift Payments > Net Cash.',
  },
};
