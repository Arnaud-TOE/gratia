'use client';

// The donor-facing checkout: pick an amount and a campaign, then pay with the PayPal JavaScript
// SDK v6. The server creates and captures the order (app/api/donations), so the amount the donor
// sees is the amount PayPal charges.

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const SDK_URL = 'https://www.sandbox.paypal.com/web-sdk/v6/core';
const PRESETS = [25, 50, 100, 250];

type Receipt = { donor: string; amount: string; campaign: string; receiptNumber: string };

type Status =
  | { kind: 'loading' }
  | { kind: 'ready' }
  | { kind: 'processing' }
  | { kind: 'thanks'; receipt: Receipt }
  | { kind: 'error'; message: string };

// The slice of the PayPal JavaScript SDK v6 this page uses.
type PaymentSession = {
  start: (options: { presentationMode: 'auto' }, order: Promise<{ orderId: string }>) => Promise<void>;
};
type SdkInstance = {
  findEligibleMethods: (options: { currencyCode: string }) => Promise<{ isEligible: (method: string) => boolean }>;
  createPayPalOneTimePaymentSession: (options: {
    onApprove: (data: { orderId: string }) => Promise<void>;
    onCancel: () => void;
    onError: (error: Error) => void;
  }) => PaymentSession;
};

declare global {
  interface Window {
    paypal?: { createInstance: (options: Record<string, unknown>) => Promise<SdkInstance> };
  }
}

function loadSdk(): Promise<void> {
  if (window.paypal) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SDK_URL}"]`);
  return new Promise((resolve, reject) => {
    const script = existing ?? Object.assign(document.createElement('script'), { src: SDK_URL, async: true });
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error('The PayPal SDK failed to load.')));
    if (!existing) document.head.appendChild(script);
  });
}

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? 'Something went wrong. Please try again.');
  return data as T;
}

export function DonateForm({ clientId, campaigns }: { clientId: string; campaigns: string[] }) {
  const [amount, setAmount] = useState(50);
  const [custom, setCustom] = useState('');
  const [campaign, setCampaign] = useState(campaigns[0]);
  const [status, setStatus] = useState<Status>({ kind: 'loading' });
  const buttonRef = useRef<HTMLElement>(null);

  // The PayPal button is wired up once and reads the donor's current choice when clicked.
  const choice = useRef({ amount, campaign });
  useEffect(() => {
    choice.current = { amount, campaign };
  }, [amount, campaign]);

  useEffect(() => {
    let cancelled = false;
    const button = buttonRef.current;
    let onClick: (() => void) | undefined;

    (async () => {
      try {
        await loadSdk();
        if (!window.paypal) throw new Error('The PayPal SDK failed to load.');
        const sdk = await window.paypal.createInstance({ clientId, components: ['paypal-payments'], pageType: 'checkout' });
        const methods = await sdk.findEligibleMethods({ currencyCode: 'USD' });
        if (!methods.isEligible('paypal')) throw new Error('PayPal is not available in this browser.');

        const session = sdk.createPayPalOneTimePaymentSession({
          onApprove: async ({ orderId }) => {
            setStatus({ kind: 'processing' });
            try {
              setStatus({ kind: 'thanks', receipt: await postJson<Receipt>(`/api/donations/${orderId}/capture`) });
            } catch (error) {
              setStatus({ kind: 'error', message: (error as Error).message });
            }
          },
          onCancel: () => setStatus({ kind: 'ready' }),
          onError: (error) => setStatus({ kind: 'error', message: error.message || 'PayPal reported an error.' }),
        });

        onClick = () => {
          const order = postJson<{ orderId: string }>('/api/donations', choice.current);
          session.start({ presentationMode: 'auto' }, order).catch((error: Error) => {
            setStatus({ kind: 'error', message: error.message });
          });
        };
        if (cancelled) return;
        button?.addEventListener('click', onClick);
        button?.removeAttribute('hidden');
        setStatus({ kind: 'ready' });
      } catch (error) {
        if (!cancelled) setStatus({ kind: 'error', message: (error as Error).message });
      }
    })();

    return () => {
      cancelled = true;
      if (onClick) button?.removeEventListener('click', onClick);
    };
  }, [clientId]);

  if (status.kind === 'thanks') {
    const { receipt } = status;
    return (
      <div className="rounded-2xl border border-hl-border bg-white p-8 text-center shadow-sm">
        <p className="text-4xl" aria-hidden>
          🐾
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-hl-ink">Thank you, {receipt.donor.split(' ')[0]}!</h2>
        <p className="mt-2 text-hl-muted">
          Your ${receipt.amount} gift to the {receipt.campaign} is on its way to the animals.
        </p>
        <p className="mt-4 text-sm text-hl-muted">
          Receipt <span className="font-mono text-hl-ink">{receipt.receiptNumber}</span> was recorded in PayPal.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => setStatus({ kind: 'ready' })}
            className="rounded-full border border-hl-border px-5 py-2 text-sm font-semibold text-hl-ink hover:bg-hl-cream"
          >
            Give again
          </button>
          <Link href="/dashboard" className="rounded-full bg-hl-teal px-5 py-2 text-sm font-semibold text-white hover:bg-hl-teal-dark">
            See it on the dashboard
          </Link>
        </div>
      </div>
    );
  }

  const busy = status.kind === 'loading' || status.kind === 'processing';
  return (
    <div className="rounded-2xl border border-hl-border bg-white p-6 shadow-sm sm:p-8">
      <fieldset>
        <legend className="text-sm font-semibold text-hl-ink">Choose an amount</legend>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-pressed={!custom && amount === preset}
              onClick={() => {
                setCustom('');
                setAmount(preset);
              }}
              className="rounded-xl border border-hl-border py-3 font-semibold text-hl-ink aria-pressed:border-hl-teal aria-pressed:bg-hl-teal aria-pressed:text-white"
            >
              ${preset}
            </button>
          ))}
        </div>
        <label className="mt-3 flex items-center gap-2 rounded-xl border border-hl-border px-4 py-3 focus-within:border-hl-teal">
          <span className="text-hl-muted">$</span>
          <input
            inputMode="decimal"
            placeholder="Other amount"
            value={custom}
            onChange={(event) => {
              const value = event.target.value.replace(/[^0-9.]/g, '');
              setCustom(value);
              const parsed = Number(value);
              if (parsed > 0) setAmount(parsed);
            }}
            className="w-full bg-transparent text-hl-ink outline-none"
          />
        </label>
      </fieldset>

      <label className="mt-6 block text-sm font-semibold text-hl-ink">
        Where it goes
        <select
          value={campaign}
          onChange={(event) => setCampaign(event.target.value)}
          className="mt-2 block w-full rounded-xl border border-hl-border bg-white px-4 py-3 font-normal text-hl-ink"
        >
          {campaigns.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </label>

      <div className="mt-8" aria-busy={busy}>
        <paypal-button ref={buttonRef} type="donate" hidden className="block w-full" />
        {status.kind === 'loading' && <p className="text-center text-sm text-hl-muted">Loading PayPal…</p>}
        {status.kind === 'processing' && <p className="text-center text-sm text-hl-muted">Completing your gift…</p>}
        {status.kind === 'error' && (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {status.message}
          </p>
        )}
      </div>
      <p className="mt-4 text-center text-xs text-hl-muted">
        Secure checkout by PayPal · Sandbox demo: no real money moves.
      </p>
    </div>
  );
}
