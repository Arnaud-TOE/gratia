'use client';

import { useEffect, useRef, useState } from 'react';
import type { AgWidgetParams } from 'ag-studio';

type WidgetApi = AgWidgetParams['widgetApi'];
type Query = Parameters<WidgetApi['getData']>[0];
export type WidgetRow = Record<string, unknown>;

type DisplayState = 'loading' | 'displayed' | 'noData' | 'incompleteDataMapping';

export type WidgetData = {
  rows: WidgetRow[];
  /** With a cross filter on the page, the rows that match it; null when nothing is selected. */
  highlighted: WidgetRow[] | null;
};

/**
 * Rows for a custom widget, kept current. When a filter, a cross filter or the data changes, Studio
 * re-renders the widget without necessarily changing any prop, so the query runs after every
 * render. A result equal to the last one changes nothing, which is what ends the cycle.
 * `query` is null while the widget's data mapping is incomplete.
 */
export function useWidgetRows(widgetApi: WidgetApi, query: Query | null): WidgetRow[] {
  return useWidgetData(widgetApi, query, 'filter').rows;
}

/**
 * Like useWidgetRows, but in AG Studio's highlight mode: a cross filter leaves every row in place and
 * says which ones match, the way the built-in charts fade what is not selected instead of dropping it.
 */
export function useHighlightedRows(widgetApi: WidgetApi, query: Query | null): WidgetData {
  return useWidgetData(widgetApi, query, 'highlight');
}

function useWidgetData(widgetApi: WidgetApi, query: Query | null, crossFilter: 'filter' | 'highlight'): WidgetData {
  const [data, setData] = useState<WidgetData>({ rows: [], highlighted: null });
  const lastResult = useRef<string | null>(null);
  const shown = useRef<DisplayState | null>(null);

  useEffect(() => {
    const show = (state: DisplayState) => {
      if (shown.current === state) return;
      shown.current = state;
      if (state === 'loading') widgetApi.setDisplayState('loading', { prominent: false });
      else widgetApi.setDisplayState(state);
    };

    if (!query) {
      show('incompleteDataMapping');
      return;
    }
    if (shown.current === null) show('loading');

    const controller = new AbortController();
    widgetApi
      .getData(query, { signal: controller.signal, crossFilter })
      .then((response) => {
        const { results, crossFilter: matching } = response as { results: { rows: WidgetRow[] }; crossFilter?: { rows: WidgetRow[] } };
        const next: WidgetData = { rows: results.rows, highlighted: crossFilter === 'highlight' && matching ? matching.rows : null };
        const result = JSON.stringify(next);
        if (result !== lastResult.current) {
          lastResult.current = result;
          setData(next);
        }
        show(next.rows.length > 0 ? 'displayed' : 'noData');
      })
      .catch(() => {
        // Superseded by a newer query, or the widget went away: not an empty result.
        if (!controller.signal.aborted) show('noData');
      });
    return () => controller.abort();
  });

  return data;
}

/** Each matching row's value for one field, by the row's label; null when nothing is selected. */
export function matchingValues(highlighted: WidgetRow[] | null, labelKey: string, valueKey: string): Map<string, number> | null {
  if (!highlighted) return null;
  return new Map(highlighted.map((row) => [String(row[labelKey]), Number(row[valueKey] ?? 0)]));
}

/** A field's value as 'YYYY-MM-DD'. The data engine may hand dates back as strings or as Date objects. */
export function dayOf(value: unknown): string | null {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = value instanceof Date ? value : typeof value === 'number' ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : null;
}
