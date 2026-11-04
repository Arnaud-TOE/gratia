import Link from 'next/link';
import { GratiaMark } from './dashboard/components/ui/gratia-mark';
import { ORGANIZATION, PRODUCT } from '@/lib/organization';

// The front door: what Gratia is, and the two ways into the demo.

const features = [
  {
    title: 'A live giving dashboard',
    detail: 'Every PayPal gift, monthly sponsorship and business pledge in one AG Studio dashboard the team can reshape.',
  },
  {
    title: 'An AI development director',
    detail: 'Finds donors you are about to lose, drafts the personal note, and chases overdue pledges through PayPal.',
  },
  {
    title: 'Nothing leaves without you',
    detail: 'Every reminder waits for an explicit click before PayPal sends it. The AI drafts; the team decides.',
  },
];

// One page per PayPal endpoint the dashboard reads, each in app/(endpoints).
const endpoints = [
  { href: '/invoices', label: 'Gifts & pledges', detail: 'GET /v2/invoicing/invoices' },
  { href: '/transactions', label: 'PayPal ledger', detail: 'GET /v1/reporting/transactions' },
  { href: '/products', label: 'Programs', detail: 'GET /v1/catalogs/products' },
  { href: '/plans', label: 'Giving plans', detail: 'GET /v1/billing/plans' },
  { href: '/balances', label: 'Balances', detail: 'GET /v1/reporting/balances' },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-16 font-paypal text-pp-ink">
      <div className="flex items-center gap-3">
        <GratiaMark className="size-11" />
        <span className="text-2xl font-extrabold tracking-tight text-pp-navy">{PRODUCT}</span>
      </div>
      <h1 className="mt-8 text-4xl font-bold leading-tight text-pp-navy sm:text-5xl">
        The AI development director for small nonprofits.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-pp-muted">
        Four out of five first-time donors never give again. {PRODUCT} turns a nonprofit&apos;s PayPal donations into
        a live dashboard and an AI teammate that keeps donors close, built here for {ORGANIZATION}, a fictional
        shelter running on the PayPal sandbox.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/dashboard" className="rounded-full bg-pp-blue px-6 py-3 font-semibold text-white hover:bg-pp-blue-dark">
          Open the team dashboard
        </Link>
        <Link href="/donate" className="rounded-full border border-pp-border bg-white px-6 py-3 font-semibold text-pp-navy hover:bg-pp-highlight">
          See the donation page
        </Link>
      </div>

      <ul className="mt-14 grid gap-4 sm:grid-cols-3">
        {features.map((feature) => (
          <li key={feature.title} className="rounded-2xl border border-pp-border bg-white p-5">
            <h2 className="font-bold text-pp-navy">{feature.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-pp-muted">{feature.detail}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-14 text-sm font-semibold uppercase tracking-wider text-pp-muted">Under the hood: the PayPal data it reads</h2>
      <ul className="mt-2 divide-y divide-pp-border border-y border-pp-border">
        {endpoints.map((page) => (
          <li key={page.href}>
            <Link href={page.href} className="flex items-baseline justify-between gap-4 py-3 hover:text-pp-blue">
              <span className="font-semibold">{page.label} →</span>
              <code className="text-sm text-pp-muted">{page.detail}</code>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
