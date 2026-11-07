import { givingRows } from '@/lib/dashboard-data';
import { giftsDueOn } from '@/lib/daily-gifts';
import { ORGANIZATION } from '@/lib/organization';
import { recordPaidGift } from '@/lib/paid-gift';
import { listInvoices } from '@/lib/paypal';

// Called once a day by Vercel Cron (vercel.json), which sends CRON_SECRET as a bearer token. See
// lib/daily-gifts.ts for why this exists. Nothing in the request decides what gets recorded.

export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Not allowed.' }, { status: 401 });
  }

  const today = new Date();
  const invoices = await listInvoices();
  const due = giftsDueOn(givingRows(invoices, today.toISOString().slice(0, 10)), today);

  const recorded: string[] = [];
  const failed: string[] = [];
  for (const gift of due) {
    try {
      await recordPaidGift({
        ...gift,
        amount: gift.amount.toFixed(2),
        reference: 'demo-daily',
        itemDescription: 'Demo gift, recorded by the daily job',
        note: `Thank you for supporting ${ORGANIZATION}.`,
        paymentNote: 'Daily demo gift',
      });
      recorded.push(gift.number);
    } catch (error) {
      console.error('[daily-gifts] could not record', gift.number, error);
      failed.push(gift.number);
    }
  }
  return Response.json({ recorded, failed }, { status: failed.length ? 502 : 200 });
}
