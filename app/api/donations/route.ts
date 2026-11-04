import { createDonationOrder, parseDonation } from '@/lib/donations';

// Starts a donation: creates the PayPal order the donor then approves in the PayPal window. The
// amount and campaign come from the browser, so they are validated here before PayPal sees them.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body must be JSON.' }, { status: 400 });
  }

  const donation = parseDonation(body);
  if ('error' in donation) return Response.json({ error: donation.error }, { status: 400 });

  try {
    return Response.json({ orderId: await createDonationOrder(donation) });
  } catch (error) {
    console.error('[donations] order creation failed', error);
    return Response.json({ error: 'PayPal could not start the donation. Please try again.' }, { status: 502 });
  }
}
