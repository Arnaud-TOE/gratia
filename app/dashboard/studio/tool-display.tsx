'use client';

// How the director's own tools read in the chat: what each call is doing, in plain words, and the
// donors or pledges it found, instead of a raw tool name.

import type { AgAiToolDetailParams } from 'ag-studio';
import type { AgAiToolDisplay } from 'ag-studio-react';
import type { DonorAtRisk, OverduePledge } from '@/lib/insights';

const dollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function rowsOf<T>(result: AgAiToolDetailParams['result']): T[] {
  return result?.success && Array.isArray(result.data) ? (result.data as T[]) : [];
}

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

function DonorsFound({ result }: AgAiToolDetailParams) {
  const donors = rowsOf<DonorAtRisk>(result);
  return (
    <ul className="space-y-1.5 text-sm">
      {donors.map((donor) => (
        <li key={donor.name} className="rounded-lg bg-pp-canvas px-2.5 py-1.5">
          <span className="flex justify-between gap-2 font-semibold text-pp-ink">
            <span className="truncate">{donor.name}</span>
            <span className="shrink-0">{dollars.format(donor.totalGiven)}</span>
          </span>
          <span className="block text-xs text-pp-muted">
            {donor.segment} · last gift {donor.daysSinceLastGift} days ago
          </span>
        </li>
      ))}
    </ul>
  );
}

function PledgesFound({ result }: AgAiToolDetailParams) {
  const pledges = rowsOf<OverduePledge>(result);
  return (
    <ul className="space-y-1.5 text-sm">
      {pledges.map((pledge) => (
        <li key={pledge.invoiceId} className="rounded-lg bg-pp-canvas px-2.5 py-1.5">
          <span className="flex justify-between gap-2 font-semibold text-pp-ink">
            <span className="truncate">{pledge.donor}</span>
            <span className="shrink-0">{dollars.format(pledge.outstanding)}</span>
          </span>
          <span className="block text-xs text-pp-muted">
            {pledge.invoiceNumber} · {pledge.daysOverdue} days overdue
          </span>
        </li>
      ))}
    </ul>
  );
}

function ReminderDrafted({ args }: AgAiToolDetailParams) {
  const { subject, note } = args as { subject?: string; note?: string };
  return (
    <div className="rounded-lg bg-pp-canvas px-2.5 py-1.5 text-sm">
      {subject && <p className="font-semibold text-pp-ink">{subject}</p>}
      {note && <p className="mt-1 whitespace-pre-line text-pp-muted">{note}</p>}
    </div>
  );
}

export const toolDisplay: Record<string, AgAiToolDisplay> = {
  find_donors_at_risk: {
    label: ({ result }) => ({
      text: 'Reading giving history',
      pill: result?.success ? plural(rowsOf(result).length, 'donor') : undefined,
    }),
    detail: DonorsFound,
  },
  list_overdue_pledges: {
    label: ({ result }) => ({
      text: 'Checking PayPal pledges',
      pill: result?.success ? `${rowsOf(result).length} overdue` : undefined,
    }),
    detail: PledgesFound,
  },
  send_pledge_reminder: {
    label: ({ status, result }) => {
      if (status !== 'done') return { text: 'Waiting for your approval' };
      if (!result?.success) return { text: 'Reminder through PayPal', pill: 'Failed' };
      return result.data ? { text: 'Reminder through PayPal', pill: 'Sent' } : { text: 'Reminder through PayPal', pill: 'Not sent' };
    },
    detail: ReminderDrafted,
  },
};
