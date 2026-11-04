// The development director's own tools, on top of Studio's. The read tools answer from the
// PayPal data already on the dashboard; the one write tool sends a pledge reminder through PayPal
// Invoicing (app/api/pledges), and only after the user approved the exact message.

import type { AgAiTool, AgStudioApi } from 'ag-studio';
import type { DashboardData } from '@/lib/dashboard-data';
import { donorsAtRisk, overduePledges } from '@/lib/insights';
import type { RequestApproval } from '../components/approval-dialog';

export function buildDonorTools(api: AgStudioApi, data: DashboardData, requestApproval: RequestApproval): AgAiTool[] {
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
      const donors = donorsAtRisk(data).slice(0, limit ?? 8);
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
      const pledges = overduePledges(data);
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
      const pledge = overduePledges(data).find((p) => p.invoiceId === invoiceId);
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

  return [findDonorsAtRisk, listOverduePledges, sendPledgeReminder];
}
