import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense, type CSSProperties } from 'react';
import { connection } from 'next/server';
import { FlameIcon, HeartPulseIcon, LockIcon, SyringeIcon } from '@/components/icons';
import { CountUp } from '@/components/fx';
import { readCampaignProgress } from '@/lib/campaign-progress';
import { CAMPAIGNS, ORGANIZATION } from '@/lib/donations';
import { DonateForm } from './donate-form';

export const metadata: Metadata = {
  title: `Donate to ${ORGANIZATION}`,
};

const APPEAL = 'Winter Shelter Drive';

// The form's light border, in the rescue's teal and amber (app/fx.css).
const BEAM = { '--beam-fill': '#fff', '--beam-base': '#e4dccf', '--glow-a': '#0f766e', '--glow-b': '#f59e0b' } as CSSProperties;

const impact = [
  { icon: FlameIcon, amount: '$25', detail: 'keeps one kennel heated for a week' },
  { icon: SyringeIcon, amount: '$50', detail: 'covers vaccines for a new arrival' },
  { icon: HeartPulseIcon, amount: '$250', detail: 'pays for an emergency surgery' },
];

const usd = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

// The appeal's progress, live from PayPal. It streams in after the page, so a slow PayPal never holds up a donor.
async function AppealProgress() {
  await connection();
  const progress = await readCampaignProgress(APPEAL);
  if (!progress || progress.raised <= 0) return null;
  const share = progress.goal ? Math.min(1, progress.raised / progress.goal) : null;

  return (
    <div className="appear rounded-3xl border border-hl-border bg-white/90 p-6 shadow-sm backdrop-blur">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-4xl font-bold tracking-tight text-hl-ink">
          <CountUp to={Math.round(progress.raised)} prefix="$" />
        </p>
        {progress.goal && <p className="text-sm text-hl-muted">raised of {usd(progress.goal)}</p>}
      </div>
      {share !== null && (
        <span className="mt-3 block h-3 overflow-hidden rounded-full bg-hl-cream">
          <span className="fill-bar block h-full rounded-full bg-gradient-to-r from-hl-teal to-amber-500" style={{ width: `${Math.max(4, share * 100)}%` }} />
        </span>
      )}
      <p className="mt-3 text-sm text-hl-muted">
        <strong className="text-hl-ink">{progress.donors} neighbors</strong> have given to the {APPEAL}
        {progress.goal && progress.raised < progress.goal ? `. ${usd(progress.goal - progress.raised)} to go.` : '. Goal reached!'}
      </p>
      {progress.recent.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {progress.recent.map((donor) => (
            <li key={donor.name} className="rounded-full bg-hl-cream px-3 py-1 text-xs text-hl-ink">
              <span aria-hidden>♥ </span>
              {donor.name} gave {usd(donor.amount)}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-[11px] uppercase tracking-wider text-hl-muted">Live from PayPal</p>
    </div>
  );
}

function ProgressPlaceholder() {
  return (
    <div className="rounded-3xl border border-hl-border bg-white/70 p-6" aria-hidden>
      <div className="h-8 w-32 animate-pulse rounded-lg bg-hl-cream" />
      <div className="mt-4 h-3 animate-pulse rounded-full bg-hl-cream" />
      <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-hl-cream" />
    </div>
  );
}

// The rescue's public donation page: what a donor sees, as opposed to the team's dashboard.
export default function DonatePage() {
  // A PayPal client id is public by design; the secret never leaves the server.
  const clientId = process.env.PAYPAL_CLIENT_ID ?? '';

  return (
    <main className="donate-bg paw-pattern min-h-dvh font-sans text-hl-ink">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <span className="flex items-center gap-2.5 font-semibold">
          <span className="grid size-10 place-items-center rounded-2xl bg-hl-teal text-white" aria-hidden>
            <svg viewBox="0 0 24 24" className="size-6" fill="currentColor">
              <ellipse cx="12" cy="15.5" rx="4.6" ry="3.9" />
              <circle cx="6.2" cy="10.2" r="2.1" />
              <circle cx="9.6" cy="6.6" r="2.1" />
              <circle cx="14.4" cy="6.6" r="2.1" />
              <circle cx="17.8" cy="10.2" r="2.1" />
            </svg>
          </span>
          {ORGANIZATION}
        </span>
        <Link href="/" className="rounded-full border border-hl-border bg-white/70 px-3 py-1.5 text-xs font-semibold text-hl-muted hover:text-hl-ink">
          <span className="hidden sm:inline">Sandbox demo · </span>made with Gratia
        </Link>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 pb-16 pt-6 md:grid-cols-[1.15fr_1fr] md:gap-x-10 md:pt-10">
        <section>
          <p className="inline-flex items-center gap-2 rounded-full bg-hl-teal/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-hl-teal">
            Winter appeal
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-hl-ink sm:text-6xl">
            Keep them <span className="text-hl-teal">warm</span> this winter.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-hl-muted">
            Every night this winter, 64 dogs and cats sleep in our shelter. Your gift pays for heating, warm bedding and the vet
            visits that get them ready for a home of their own.
          </p>

          <div className="mt-8 max-w-xl">
            <Suspense fallback={<ProgressPlaceholder />}>
              <AppealProgress />
            </Suspense>
          </div>
        </section>

        <section className="md:sticky md:top-6 md:col-start-2 md:row-span-2 md:row-start-1 md:self-start">
          {clientId ? (
            <div className="beam rounded-[1.5rem] shadow-2xl shadow-hl-teal/20" style={BEAM}>
              <DonateForm clientId={clientId} campaigns={[...CAMPAIGNS]} />
            </div>
          ) : (
            <p className="rounded-2xl bg-white p-8 text-hl-muted">
              Donations are not configured: set PAYPAL_CLIENT_ID and PAYPAL_SECRET in .env.local.
            </p>
          )}
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-hl-muted">
            <LockIcon className="size-3.5" />
            Your payment details go to PayPal, never to us.
          </p>
        </section>

        <section className="md:col-start-1 md:row-start-2">
          <ul className="grid max-w-xl gap-3 sm:grid-cols-3">
            {impact.map((item) => (
              <li key={item.amount} className="rounded-2xl border border-hl-border bg-white/80 p-4">
                <span className="grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-700">
                  <item.icon className="size-5" />
                </span>
                <p className="mt-3 text-xl font-bold">{item.amount}</p>
                <p className="mt-1 text-sm leading-snug text-hl-muted">{item.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
