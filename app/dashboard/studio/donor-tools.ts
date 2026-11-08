// The development director's own tools, on top of Studio's. The read tools answer from the
// PayPal data already on the dashboard; the one write tool sends a pledge reminder through PayPal
// Invoicing (app/api/pledges), and only after the user approved the exact message. Studio leaves
// pages to the host, so opening a new page is a tool here too.

import type { AgAiTool, AgPageState, AgStudioApi } from 'ag-studio';
import type { DashboardData } from '@/lib/dashboard-data';
import { donorsAtRisk, overduePledges } from '@/lib/insights';
import type { RequestApproval } from '../components/approval-dialog';

/** Adds an empty page to the open report, names it and opens it; returns its id. */
export type OpenPage = (title: string) => string;

export function buildDonorTools(api: AgStudioApi, getData: () => DashboardData, requestApproval: RequestApproval, openPage: OpenPage): AgAiTool[] {
  const findDonorsAtRisk = api.defineAiTool({
    name: 'find_donors_at_risk',
    description:
      'Lists individual donors the rescue is at risk of losing, from their PayPal giving history: monthly sponsors who ' +
      'stopped, repeat donors gone quiet, and first-time donors who never gave again. Sorted by how much they have given.',
    params: (s) =>
      s.object({
        limit: s.number({ description: 'How many donors to return (default 8).' }).optional(),
      }),
    execute: ({ limit }, ctx) => {
      const donors = donorsAtRisk(getData()).slice(0, limit ?? 8);
      if (donors.length === 0) return ctx.success('No donors look at risk right now.', []);
      return ctx.success(`${donors.length} donors at risk, most given first.`, donors);
    },
  });

  const listOverduePledges = api.defineAiTool({
    name: 'list_overdue_pledges',
    description:
      'Lists business pledges recorded as PayPal invoices that are past their due date and not fully paid, largest ' +
      'outstanding amount first. Each has the invoiceId needed to send a reminder.',
    params: (s) => s.object({}),
    execute: (_args, ctx) => {
      const pledges = overduePledges(getData());
      if (pledges.length === 0) return ctx.success('No pledges are overdue.', []);
      return ctx.success(`${pledges.length} overdue pledges.`, pledges);
    },
  });

  const sendPledgeReminder = api.defineAiTool({
    name: 'send_pledge_reminder',
    description:
      'Sends a reminder for one overdue pledge through PayPal Invoicing: PayPal emails the donor your subject and note ' +
      'with a link to pay. The user sees the exact message in a dialog and must approve it; if they decline, nothing is ' +
      'sent. Write the note in a warm, personal tone and keep it under 120 words.',
    params: (s) =>
      s.object({
        invoiceId: s.string({ description: 'The pledge invoiceId from list_overdue_pledges.' }),
        subject: s.string({ description: 'Email subject, under 80 characters.' }),
        note: s.string({ description: 'The personal note PayPal includes in the reminder email.' }),
      }),
    execute: async ({ invoiceId, subject, note }, ctx) => {
      const pledge = overduePledges(getData()).find((p) => p.invoiceId === invoiceId);
      if (!pledge) return ctx.error(`No overdue pledge has invoiceId ${invoiceId}. Call list_overdue_pledges first.`);

      const approved = await requestApproval({
        title: `Send a reminder to ${pledge.donor}?`,
        recipient: `${pledge.contact} (${pledge.donor})`,
        subject,
        message: note,
        confirmLabel: 'Send through PayPal',
      });
      if (!approved) return ctx.success('The user declined. The reminder was NOT sent; ask what they would like to change.');

      const res = await fetch(`/api/pledges/${encodeURIComponent(invoiceId)}/remind`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, note }),
        signal: ctx.signal,
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) return ctx.error(result.error ?? `PayPal could not send the reminder (HTTP ${res.status}).`);
      return ctx.success(
        `Reminder for pledge ${result.invoiceNumber} sent by PayPal to ${result.recipient}.`,
        result,
      );
    },
  });

  const openNewPage = api.defineAiTool({
    name: 'open_new_page',
    description:
      'Adds a new, empty page to the report, gives it a name in the sidebar and opens it. Widgets always go on the page ' +
      'that is open, so call this before asking the Lead agent to build a new page, and only then delegate.',
    params: (s) =>
      s.object({
        title: s.string({ description: 'The page name shown in the sidebar, under 30 characters, e.g. "Board summary".' }),
      }),
    execute: ({ title }, ctx) => {
      const name = title.trim().slice(0, 40) || 'New page';
      const pageId = openPage(name);
      return ctx.success(`Opened a new empty page, "${name}". Ask the Lead agent to add the widgets to the current page.`, { pageId, title: name });
    },
  });

  // Studio's agents tend to count the pledges in a table instead of listing them, so this one is built here,
  // with the same columns as the Pledges page.
  const addOverduePledgesTable = api.defineAiTool({
    name: 'add_overdue_pledges_table',
    description:
      'Adds a table of the overdue business pledges to the page that is open, below what is already there: one row per ' +
      'pledge with its number, organization, due date, days overdue and outstanding amount, most overdue first.',
    params: (s) =>
      s.object({
        title: s.string({ description: 'The table title (default "Overdue pledges, most overdue first").' }).optional(),
      }),
    execute: ({ title }, ctx) => {
      const state = api.getState();
      const page = state.pages.find((candidate) => candidate.id === state.selectedPageId);
      if (!page) return ctx.error('No page is open.');
      const id = `overdue-pledges-${Date.now().toString(36)}`;
      const bottom = Math.max(0, ...Object.values(page.widgetLayout ?? {}).map((at) => (at?.yTrack ?? 0) + (at?.ySpan ?? 0)));
      const widget = {
        type: 'grid',
        dataMapping: {
          cols: [
            { id: 'invoices.number' },
            { id: 'customers.company' },
            { id: 'invoices.dueDate' },
            { id: 'invoices.daysOverdue' },
            { id: 'invoices.outstanding', aggregation: 'sum' },
          ],
        },
        sort: [{ field: { id: 'invoices.daysOverdue' }, direction: 'desc' }],
        format: { title: { enabled: true, text: title?.trim() || 'Overdue pledges, most overdue first' } },
      } as unknown as NonNullable<AgPageState['widgets']>[string];
      const onlyOverdue = [{ field: { id: 'invoices.overdueAmount' }, model: { operator: 'greaterThan', value: 0 } }];
      api.setState({
        ...state,
        pages: state.pages.map((candidate) =>
          candidate.id !== page.id
            ? candidate
            : {
                ...candidate,
                widgets: { ...candidate.widgets, [id]: widget },
                widgetLayout: { ...candidate.widgetLayout, [id]: { xTrack: 0, yTrack: bottom, xSpan: 24, ySpan: 14 } },
                filter: { ...candidate.filter, widget: { ...candidate.filter?.widget, [id]: onlyOverdue } } as AgPageState['filter'],
              },
        ),
      });
      return ctx.success('Added the overdue pledges table, one row per pledge, to the open page.', { widgetId: id });
    },
  });

  return [findDonorsAtRisk, listOverduePledges, sendPledgeReminder, openNewPage, addOverduePledgesTable];
}
