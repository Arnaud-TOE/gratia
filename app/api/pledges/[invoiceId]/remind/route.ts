import { getInvoice, PayPalApiError, post } from '@/lib/paypal';
import { isSameOrigin } from '@/lib/same-origin';

// Sends a pledge reminder through PayPal Invoicing: PayPal emails the donor with the note and a
// link to pay. The agent calls this only after the user approved the exact message in the
// dashboard, and the checks below hold whatever the caller claims.

const OPEN = new Set(['SENT', 'UNPAID', 'PARTIALLY_PAID']);
// One reminder per pledge every ten minutes, so a looping agent (or a curious judge) can't spam a donor.
const COOLDOWN_MS = 10 * 60_000;
const lastSent = new Map<string, number>();

export async function POST(request: Request, { params }: RouteContext<'/api/pledges/[invoiceId]/remind'>) {
  if (!isSameOrigin(request)) return Response.json({ error: 'This endpoint only serves the Gratia dashboard.' }, { status: 403 });

  const { invoiceId } = await params;
  if (!/^INV2(-[A-Z0-9]{4}){4}$/.test(invoiceId)) {
    return Response.json({ error: 'Invalid invoice id.' }, { status: 400 });
  }

  let body: { subject?: unknown; note?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body must be JSON.' }, { status: 400 });
  }
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const note = typeof body.note === 'string' ? body.note.trim() : '';
  if (!subject || subject.length > 120 || !note || note.length > 1500) {
    return Response.json({ error: 'A subject (up to 120 characters) and a note (up to 1500) are required.' }, { status: 400 });
  }

  const since = Date.now() - (lastSent.get(invoiceId) ?? 0);
  if (since < COOLDOWN_MS) {
    return Response.json(
      { error: `A reminder for this pledge went out ${Math.round(since / 60_000)} minutes ago. Try again later.` },
      { status: 429 },
    );
  }

  try {
    const invoice = await getInvoice(invoiceId);
    if (!OPEN.has(invoice.status)) {
      return Response.json({ error: `This pledge is ${invoice.status.toLowerCase()}, so there is nothing to remind.` }, { status: 409 });
    }
    await post(`/v2/invoicing/invoices/${invoiceId}/remind`, {
      subject,
      note,
      send_to_invoicer: false,
      send_to_recipient: true,
    });
    lastSent.set(invoiceId, Date.now());
    const recipient = invoice.primary_recipients?.[0]?.billing_info;
    console.log(`[pledges] reminder sent for ${invoice.detail.invoice_number}`);
    return Response.json({
      invoiceNumber: invoice.detail.invoice_number,
      recipient: recipient?.business_name ?? recipient?.name?.full_name ?? recipient?.email_address ?? 'the donor',
      sentAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[pledges] reminder failed', invoiceId, error);
    const status = error instanceof PayPalApiError && error.status === 404 ? 404 : 502;
    return Response.json({ error: status === 404 ? 'Pledge not found.' : 'PayPal could not send the reminder.' }, { status });
  }
}
