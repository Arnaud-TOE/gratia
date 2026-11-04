import type { Metadata } from 'next';
import { CAMPAIGNS, ORGANIZATION } from '@/lib/donations';
import { DonateForm } from './donate-form';

export const metadata: Metadata = {
  title: `Donate to ${ORGANIZATION}`,
};

// The rescue's public donation page: what a donor sees, as opposed to the team's dashboard.
export default function DonatePage() {
  // A PayPal client id is public by design; the secret never leaves the server.
  const clientId = process.env.PAYPAL_CLIENT_ID ?? '';

  return (
    <main className="min-h-dvh bg-hl-cream font-sans text-hl-ink">
      <div className="mx-auto grid w-full max-w-5xl gap-10 px-6 py-12 md:grid-cols-[1.1fr_1fr] md:py-20">
        <section>
          <p className="text-sm font-semibold uppercase tracking-widest text-hl-teal">{ORGANIZATION}</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-hl-ink sm:text-5xl">
            Keep them warm this winter.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-hl-muted">
            Every night this winter, 64 dogs and cats sleep in our shelter. Your gift pays for heating, warm
            bedding and the vet visits that get them ready for a home of their own.
          </p>
          <ul className="mt-8 space-y-3 text-hl-ink">
            <li>
              <strong>$25</strong> keeps one kennel heated for a week
            </li>
            <li>
              <strong>$50</strong> covers vaccines for a new arrival
            </li>
            <li>
              <strong>$250</strong> pays for an emergency surgery
            </li>
          </ul>
        </section>
        <section>
          {clientId ? (
            <DonateForm clientId={clientId} campaigns={[...CAMPAIGNS]} />
          ) : (
            <p className="rounded-2xl bg-white p-8 text-hl-muted">
              Donations are not configured: set PAYPAL_CLIENT_ID and PAYPAL_SECRET in .env.local.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
