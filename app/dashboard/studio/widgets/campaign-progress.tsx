'use client';

// Campaign goals: a custom AG Studio widget with one progress bar per campaign, what it has raised against
// its goal, and how many donors got it there. AG Studio has gauges for one number, not a board of goals, so
// this one is ours. It reads through the widget API like a built-in widget, so page, date and cross
// filters apply; clicking a campaign filters the rest of the page to it; and it carries AI metadata so the
// agents can place it.

import { useMemo } from 'react';
import type { AgWidgetField, AgWidgetParams } from 'ag-studio';
import type { AgWidgetDefinition } from 'ag-studio-react';
import { goalFor } from '@/lib/organization';
import { matchingValues, useHighlightedRows } from './use-widget-rows';

const MAX_ROWS = 8;

type Mapping = { campaign?: AgWidgetField[]; amount?: AgWidgetField[]; donors?: AgWidgetField[] };
type Line = { name: string; raised: number; donors: number | null; goal: number | null; matching: number | null };

function CampaignProgress({ widgetApi, dataMapping }: AgWidgetParams) {
  const mapping = dataMapping as Mapping;
  const campaign = mapping.campaign?.[0];
  const amount = mapping.amount?.[0];
  const donors = mapping.donors?.[0];

  const { rows, highlighted } = useHighlightedRows(
    widgetApi,
    campaign && amount
      ? {
          fields: donors ? [campaign, amount, donors] : [campaign, amount],
          sort: [{ field: amount, direction: 'desc' }],
          limit: { count: MAX_ROWS },
        }
      : null,
  );

  const lines = useMemo<Line[]>(() => {
    if (!campaign || !amount) return [];
    const matching = matchingValues(highlighted, campaign.key, amount.key);
    return rows
      .map((row) => {
        const name = String(row[campaign.key] ?? 'General fund');
        return {
          name,
          raised: Number(row[amount.key] ?? 0),
          donors: donors ? Number(row[donors.key] ?? 0) : null,
          goal: goalFor(name),
          matching: matching ? (matching.get(name) ?? 0) : null,
        };
      })
      .filter((line) => line.raised > 0);
    // The field objects are rebuilt on every render; their keys don't change with them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, highlighted, campaign?.key, amount?.key, donors?.key]);

  const selected = new Set(
    widgetApi.getCrossFilterSelections()?.flatMap((selection) => (selection.type === 'value' ? selection.values.map(String) : [])) ?? [],
  );
  const money = (value: number) => (amount ? widgetApi.formatFieldValue(amount, value) : String(value));

  return (
    <ul className="flex h-full flex-col gap-1 overflow-auto px-2 py-0.5">
      {lines.map((line) => {
        const share = line.goal ? line.raised / line.goal : null;
        const reached = share !== null && share >= 1;
        // With a selection elsewhere on the page, the bar's solid part is the selected share and the rest fades.
        const solid = line.goal && line.matching !== null ? Math.min(1, line.matching / line.goal) : null;
        const faded = line.matching !== null && line.matching <= 0;
        return (
          <li
            key={line.name}
            title={`Show only ${line.name}`}
            onClick={() => campaign && widgetApi.toggleCrossFilter({ type: 'value', group: 0, field: campaign, value: line.name })}
            className={`cursor-pointer rounded-xl px-2 py-0.5 transition-opacity hover:bg-pp-highlight ${selected.has(line.name) ? 'ring-2 ring-pp-blue' : ''} ${faded ? 'opacity-45' : ''}`}
          >
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate font-semibold text-pp-ink">{line.name}</span>
              <span className="shrink-0 text-pp-navy">
                <span className="font-semibold">{money(line.raised)}</span>
                {line.goal !== null && <span className="text-pp-muted"> of {money(line.goal)}</span>}
              </span>
            </div>
            {share !== null ? (
              <div className="mt-0.5 flex items-center gap-2">
                <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-pp-border">
                  <span
                    className={`campaign-bar block h-full rounded-full ${reached ? 'bg-pp-success' : 'bg-pp-blue'} ${solid !== null ? 'opacity-30' : ''}`}
                    style={{ width: `${Math.max(3, Math.min(100, share * 100))}%` }}
                  />
                  {solid !== null && solid > 0 && (
                    <span
                      className={`absolute inset-y-0 left-0 rounded-full ${reached ? 'bg-pp-success' : 'bg-pp-blue'}`}
                      style={{ width: `${Math.max(3, solid * 100)}%` }}
                    />
                  )}
                </span>
                <span className={`w-12 shrink-0 text-right text-xs font-semibold ${reached ? 'text-pp-success' : 'text-pp-navy'}`}>
                  {reached ? 'Done' : `${Math.round(share * 100)}%`}
                </span>
              </div>
            ) : null}
            <p className="text-xs text-pp-muted">
              {line.matching !== null && line.matching > 0 && line.matching < line.raised && (
                <span className="font-semibold text-pp-navy">{money(line.matching)} from this selection · </span>
              )}
              {line.donors !== null && `${line.donors} ${line.donors === 1 ? 'donor' : 'donors'}`}
              {line.donors !== null && line.goal !== null && ' · '}
              {line.goal !== null && (reached ? 'Goal reached. Thank them!' : `${money(Math.max(0, line.goal - line.raised))} to go`)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

const FLAG_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/></svg>';

export const campaignProgressDefinition: AgWidgetDefinition<'campaign-progress'> = {
  id: 'campaign-progress',
  label: 'Campaign goals',
  icon: FLAG_ICON,
  dataMapping: {
    campaign: {
      type: 'field',
      supportedRoles: ['category'],
      required: true,
      aiDescription: 'Which campaign or program: e.g. Gift Payments > Program.',
    },
    amount: {
      type: 'field',
      supportedRoles: ['numeric'],
      required: true,
      aiDescription: 'What it has raised, aggregated with sum, e.g. Gift Payments > Net Cash.',
    },
    donors: {
      type: 'field',
      supportedRoles: ['numeric'],
      aiDescription: 'Optional: how many donors gave, e.g. a distinct count of invoices.customerId.',
    },
  },
  form: (params) =>
    params.createDefaults({
      dataMappingItems: [
        { key: 'campaign', label: 'Campaign' },
        { key: 'amount', label: 'Amount raised' },
        { key: 'donors', label: 'Number of donors' },
      ],
    }),
  comp: CampaignProgress,
  defaultSize: { width: 360, height: 320 },
  minSize: { width: 260, height: 200 },
  ai: {
    label: 'Campaign goals',
    description:
      "One progress bar per campaign: what it raised against the rescue's goal for it, how much is left, and how many donors gave.",
    usage: 'Use to show how fundraising campaigns are doing against their goals. Not for trends over time.',
    configuration: 'Map campaign to Gift Payments > Program, amount to the sum of Gift Payments > Net Cash; donors is optional.',
  },
};
