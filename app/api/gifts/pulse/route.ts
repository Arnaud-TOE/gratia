import { countInvoices } from '@/lib/paypal';

// Polled by an open dashboard to notice a new gift (app/dashboard/use-live-gifts.ts). Every gift
// made on the donation page adds a receipt to PayPal Invoicing, so the invoice count is enough, and
// it costs one PayPal call instead of re-reading every invoice. Several open dashboards share
// the answer for a few seconds.

const MAX_AGE_MS = 4000;

let latest: { at: number; total: number } | undefined;

export async function GET() {
  try {
    if (!latest || Date.now() - latest.at > MAX_AGE_MS) latest = { at: Date.now(), total: await countInvoices() };
    return Response.json({ total: latest.total }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[gifts] Could not read the invoice count:', error);
    return Response.json({ error: 'PayPal did not answer.' }, { status: 502 });
  }
}
