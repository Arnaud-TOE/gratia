import Link from 'next/link';
import { GratiaMark } from './dashboard/components/ui/gratia-mark';
import { HeroVideo } from '@/components/hero-video';
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

const stack = [
  { label: 'Donations', detail: 'PayPal JavaScript SDK v6, Orders v2 through the PayPal Server SDK' },
  { label: 'Gifts, pledges, reminders', detail: 'PayPal Invoicing v2' },
  { label: 'Ledger and balance', detail: 'PayPal Transaction Search and Balances' },
  { label: 'Dashboard and agents', detail: 'AG Studio, with custom widgets and a custom agent' },
  { label: 'Model', detail: 'OpenAI GPT-5.4 mini, behind a server proxy' },
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
        Four out of five first-time donors don&apos;t come back the next year. {PRODUCT} turns a nonprofit&apos;s PayPal donations into
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

      <Link href="/dashboard" className="mt-12 block overflow-hidden rounded-2xl border border-pp-border shadow-sm">
        <HeroVideo />
      </Link>

      <ul className="mt-14 grid gap-4 sm:grid-cols-3">
        {features.map((feature) => (
          <li key={feature.title} className="rounded-2xl border border-pp-border bg-white p-5">
            <h2 className="font-bold text-pp-navy">{feature.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-pp-muted">{feature.detail}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-14 text-sm font-semibold uppercase tracking-wider text-pp-muted">Under the hood</h2>
      <ul className="mt-2 divide-y divide-pp-border border-y border-pp-border">
        {stack.map((part) => (
          <li key={part.label} className="flex flex-wrap items-baseline justify-between gap-x-4 py-3">
            <span className="font-semibold">{part.label}</span>
            <span className="text-sm text-pp-muted">{part.detail}</span>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm text-pp-muted">
        Built for the PayPal AI Hackathon 2026.{' '}
        <a href="https://github.com/Arnaud-TOE/gratia" className="font-semibold text-pp-blue hover:underline">
          Source on GitHub
        </a>
      </p>
    </main>
  );
}
