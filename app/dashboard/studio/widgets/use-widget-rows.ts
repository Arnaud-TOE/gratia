'use client';

import { useEffect, useRef, useState } from 'react';
import type { AgWidgetParams } from 'ag-studio';

type WidgetApi = AgWidgetParams['widgetApi'];
type Query = Parameters<WidgetApi['getData']>[0];
export type WidgetRow = Record<string, unknown>;

type DisplayState = 'loading' | 'displayed' | 'noData' | 'incompleteDataMapping';

/**
 * Rows for a custom widget, kept current. When a filter, a cross filter or the data changes, Studio
 * re-renders the widget without necessarily changing any prop, so the query runs after every
 * render. A result equal to the last one changes nothing, which is what ends the cycle.
 * `query` is null while the widget's data mapping is incomplete.
 */
export function useWidgetRows(widgetApi: WidgetApi, query: Query | null): WidgetRow[] {
  const [rows, setRows] = useState<WidgetRow[]>([]);
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
      .getData(query, { signal: controller.signal })
      .then((response) => {
        const next = (response as { results: { rows: WidgetRow[] } }).results.rows;
        const result = JSON.stringify(next);
        if (result !== lastResult.current) {
          lastResult.current = result;
          setRows(next);
        }
        show(next.length > 0 ? 'displayed' : 'noData');
      })
      .catch(() => {
        // Superseded by a newer query, or the widget went away: not an empty result.
        if (!controller.signal.aborted) show('noData');
      });
    return () => controller.abort();
  });

  return rows;
}

/** A field's value as 'YYYY-MM-DD'. The data engine may hand dates back as strings or as Date objects. */
export function dayOf(value: unknown): string | null {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = value instanceof Date ? value : typeof value === 'number' ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : null;
}
