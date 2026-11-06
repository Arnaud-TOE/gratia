import { aiEnabled } from '@/lib/ai';
import { countInvoices } from '@/lib/paypal';

// For checking that a deployment is configured and PayPal answers, without opening the dashboard.
// Says what is set up, never what the values are.

export async function GET() {
  const license = Boolean(process.env.AG_STUDIO);
  const ai = aiEnabled();
  try {
    const invoices = await countInvoices();
    return Response.json({ status: 'ok', paypal: 'ok', invoices, license, ai }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[health] PayPal did not answer:', error);
    return Response.json({ status: 'degraded', paypal: 'error', license, ai }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
