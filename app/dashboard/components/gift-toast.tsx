'use client';

import type { NewGift } from '@/lib/insights';

const dollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2, minimumFractionDigits: 0 });

/** Announces a gift that has just come in through PayPal, whichever page of the report is open. */
export function GiftToast({ gift, onDismiss }: { gift: NewGift; onDismiss: () => void }) {
  return (
    <div
      role="status"
      className="gift-arrived fixed right-6 bottom-6 z-50 flex max-w-sm items-center gap-4 rounded-2xl bg-pp-navy px-5 py-4 text-white shadow-2xl"
    >
      <span className="text-3xl" aria-hidden>
        💚
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold tracking-wide text-white/70 uppercase">New gift, just in through PayPal</span>
        <span className="block truncate text-lg font-bold">
          {dollars.format(gift.amount)} from {gift.donor}
        </span>
        {gift.program && <span className="block truncate text-sm text-white/80">{gift.program}</span>}
      </span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="self-start text-white/60 hover:text-white">
        ✕
      </button>
    </div>
  );
}
