'use client';

// Keeps an open dashboard current: a few times a minute it asks whether PayPal has a newly paid
// invoice (every gift adds a paid receipt), and if so reloads the page's data, which refreshes every
// widget and announces the gift. Only while the tab is visible, so a forgotten tab costs nothing.

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { DashboardData } from '@/lib/dashboard-data';
import { giftsSince, type NewGift } from '@/lib/insights';

const POLL_MS = 5000;
const ANNOUNCE_MS = 9000;

export function useLiveGifts(data: DashboardData) {
  const router = useRouter();
  const [arrival, setArrival] = useState<NewGift | null>(null);
  const dismissArrival = useCallback(() => setArrival(null), []);

  useEffect(() => {
    let known: number | undefined;
    const check = async () => {
      if (document.visibilityState !== 'visible') return;
      const response = await fetch('/api/gifts/pulse', { cache: 'no-store' }).catch(() => null);
      if (!response?.ok) return;
      const { total } = (await response.json()) as { total: number };
      if (known !== undefined && total !== known) router.refresh();
      known = total;
    };
    void check();
    const timer = setInterval(check, POLL_MS);
    return () => clearInterval(timer);
  }, [router]);

  // Announce a gift the first time its payment appears in the data.
  const knownPayments = useRef(new Set(data.invoicePayments.map((payment) => payment.id)));
  useEffect(() => {
    const fresh = giftsSince(knownPayments.current, data);
    for (const gift of fresh) knownPayments.current.add(gift.id);
    const latest = fresh[fresh.length - 1];
    if (!latest) return;
    setArrival(latest);
    const timer = setTimeout(() => setArrival(null), ANNOUNCE_MS);
    return () => clearTimeout(timer);
  }, [data]);

  return { arrival, dismissArrival };
}
