import { captureDonation } from '@/lib/donations';

// Completes a donation the donor approved in the PayPal window, then records its receipt.
export async function POST(_request: Request, { params }: RouteContext<'/api/donations/[orderId]/capture'>) {
  const { orderId } = await params;
  if (!/^[A-Z0-9]{10,30}$/.test(orderId)) {
    return Response.json({ error: 'Invalid order id.' }, { status: 400 });
  }

  try {
    return Response.json(await captureDonation(orderId));
  } catch (error) {
    console.error('[donations] capture failed', orderId, error);
    return Response.json({ error: 'The donation could not be completed. You have not been charged.' }, { status: 502 });
  }
}
