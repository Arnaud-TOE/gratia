import Link from 'next/link';
import { GratiaMark } from './dashboard/components/ui/gratia-mark';
import { HeroVideo } from '@/components/hero-video';
import { ArrowIcon, BoltIcon, HandIcon, PlugIcon, SendIcon, ShieldIcon, SparkIcon } from '@/components/icons';
import { Reveal } from '@/components/reveal';
import { ORGANIZATION, PRODUCT } from '@/lib/organization';

// The front door: what Gratia is, why it matters, and the two ways into the demo.

const steps = [
  {
    icon: PlugIcon,
    title: 'PayPal flows in',
    detail: 'Every gift, monthly sponsorship and business pledge from PayPal lands in one live AG Studio dashboard.',
  },
  {
    icon: SparkIcon,
    title: 'Your director reads it',
    detail: 'Ask who you are about to lose. It finds the donors going quiet and drafts a personal note for each.',
  },
  {
    icon: SendIcon,
    title: 'You click, PayPal sends',
    detail: 'Overdue pledges get a reminder through PayPal Invoicing, only after a person presses send.',
  },
];

const guarantees = [
  { icon: HandIcon, title: 'A person presses send', detail: 'The model drafts and asks. Every reminder waits for an explicit click.' },
  { icon: ShieldIcon, title: 'The server checks again', detail: 'Before PayPal sends anything, the pledge is re-read and reminders are rate-limited.' },
  { icon: BoltIcon, title: 'Live, not a mock-up', detail: 'A real PayPal sandbox account behind every number, with new gifts arriving every day.' },
];

const stack = [
  { label: 'Donations', detail: 'PayPal JavaScript SDK v6, Orders v2 through the PayPal Server SDK' },
  { label: 'Gifts, pledges, reminders', detail: 'PayPal Invoicing v2' },
  { label: 'Ledger and balance', detail: 'PayPal Transaction Search and Balances' },
  { label: 'Dashboard and agents', detail: 'AG Studio: four custom widgets, and a custom agent working with the five built-in ones' },
  { label: 'Model', detail: 'OpenAI GPT-5.4 mini, behind a server proxy' },
];

// A small, static picture of the loyalty heatmap: rows that stop short are donors going quiet.
const HEATMAP = [
  [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  [2, 2, 3, 2, 3, 2, 3, 3, 2, 3],
  [0, 3, 3, 3, 3, 3, 3, 0, 0, 0],
  [0, 0, 2, 2, 2, 2, 1, 1, 0, 0],
  [2, 3, 3, 3, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 3, 3, 3, 2, 3],
];
const HEAT = ['bg-pp-canvas', 'bg-pp-blue/35', 'bg-pp-blue/60', 'bg-pp-blue/85'];

export default function Home() {
  return (
    <main className="landing font-paypal text-pp-ink">
      <header className="sticky top-0 z-30 border-b border-pp-border/70 bg-pp-canvas/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <GratiaMark className="size-9" />
            <span className="text-xl font-extrabold tracking-tight text-pp-navy">{PRODUCT}</span>
          </Link>
          <div className="flex items-center gap-1 text-sm font-semibold sm:gap-2">
            <a href="#how" className="hidden rounded-full px-3 py-2 text-pp-muted hover:text-pp-navy sm:block">
              How it works
            </a>
            <Link href="/donate" className="hidden rounded-full px-3 py-2 text-pp-muted hover:text-pp-navy sm:block">
              Donation page
            </Link>
            <Link href="/dashboard" className="rounded-full bg-pp-navy px-4 py-2 text-white hover:bg-pp-blue-dark">
              Open the dashboard
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="hero-glow relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 pb-20 pt-14 sm:pt-20">
          <div className="mx-auto max-w-4xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-pp-border bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-pp-navy shadow-sm">
              <span className="live-dot" aria-hidden />
              Live on the PayPal sandbox · built with AG Studio
            </p>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-pp-navy sm:text-6xl">
              The AI development director <span className="text-gradient">for small nonprofits.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-pp-muted">
              Four out of five first-time donors don&apos;t come back. {PRODUCT} turns a nonprofit&apos;s PayPal donations into a live
              dashboard and an AI teammate that keeps donors close, shown here for {ORGANIZATION}, a fictional shelter.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 rounded-full bg-pp-blue px-6 py-3.5 font-bold text-white shadow-lg shadow-pp-blue/25 transition hover:-translate-y-0.5 hover:bg-pp-blue-dark"
              >
                Open the team dashboard
                <ArrowIcon className="size-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/donate"
                className="inline-flex items-center gap-2 rounded-full border border-pp-border bg-white px-6 py-3.5 font-bold text-pp-navy transition hover:-translate-y-0.5 hover:bg-pp-highlight"
              >
                Give to Harbor Lane
              </Link>
            </div>
            <p className="mt-4 text-xs text-pp-muted">No sign-in. Sandbox money only.</p>
          </div>

          <div className="relative mx-auto mt-14 max-w-5xl">
            <Link href="/dashboard" className="browser-frame block" aria-label="Open the dashboard">
              <span className="browser-bar" aria-hidden>
                <i />
                <i />
                <i />
                <span className="browser-url">gratia-peach.vercel.app/dashboard</span>
              </span>
              <HeroVideo />
            </Link>

            <div className="float-chip float-a left-[-2.5rem] top-16" aria-hidden>
              <span className="chip-icon bg-emerald-100 text-emerald-700">$</span>
              <span>
                <b>New gift</b>
                <br />
                Tara gave $20 to the Winter Shelter Drive
              </span>
            </div>
            <div className="float-chip float-b right-[-2.5rem] top-[42%]" aria-hidden>
              <span className="chip-icon bg-amber-100 text-amber-700">✎</span>
              <span>
                <b>Draft ready</b>
                <br />A note for Lucas, who has gone quiet
              </span>
            </div>
            <div className="float-chip float-c bottom-10 left-[8%]" aria-hidden>
              <span className="chip-icon bg-pp-highlight text-pp-blue">✓</span>
              <span>
                <b>Sent through PayPal</b>
                <br />
                after you clicked send
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* The problem, in numbers */}
      <section className="border-y border-pp-border bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-3">
          {[
            { figure: '18.9%', text: 'of first-time donors give again the next year.' },
            { figure: '43.3%', text: 'of all donors give again. The rest drift away, usually without a word.' },
            { figure: 'Seconds', text: 'for a new PayPal gift to reach the team’s dashboard, so a thank-you can go out the same day.' },
          ].map((fact, i) => (
            <Reveal key={fact.figure} delay={i * 90}>
              <p className="text-5xl font-extrabold tracking-tight text-pp-blue">{fact.figure}</p>
              <p className="mt-2 leading-relaxed text-pp-muted">{fact.text}</p>
            </Reveal>
          ))}
        </div>
        <p className="mx-auto max-w-6xl px-6 pb-8 text-xs text-pp-muted">
          Sources: the Fundraising Effectiveness Project, Q4 2025 (43.3% overall), and Bloomerang, citing it (18.9% for first-time
          donors). The last figure is Gratia&apos;s own.
        </p>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-widest text-pp-blue">How it works</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-pp-navy sm:text-4xl">From a PayPal gift to a thank-you, in three steps.</h2>
        </Reveal>
        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 110}>
              <li className="card-lift h-full rounded-3xl border border-pp-border bg-white p-7">
                <div className="flex items-center justify-between">
                  <span className="grid size-12 place-items-center rounded-2xl bg-pp-highlight text-pp-blue">
                    <step.icon className="size-6" />
                  </span>
                  <span className="text-5xl font-extrabold text-pp-border">{i + 1}</span>
                </div>
                <h3 className="mt-6 text-xl font-bold text-pp-navy">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-pp-muted">{step.detail}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* What the team sees */}
      <section className="bg-pp-highlight/50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-widest text-pp-blue">What the team sees</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-pp-navy sm:text-4xl">
              Widgets AG Studio doesn&apos;t ship, built for people who keep a rescue running.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-6">
            <Reveal className="md:col-span-4">
              <article className="card-lift h-full rounded-3xl border border-pp-border bg-white p-7">
                <h3 className="text-lg font-bold text-pp-navy">Who keeps coming back</h3>
                <p className="mt-1 text-sm text-pp-muted">One row per donor, one column per month. Rows that stop short turn amber: they&apos;re going quiet.</p>
                <div className="mt-6 space-y-1.5" aria-hidden>
                  {HEATMAP.map((row, r) => {
                    const last = row.findLastIndex((v) => v > 0);
                    return (
                      <div key={r} className="grid grid-cols-10 gap-1.5">
                        {row.map((value, c) => (
                          <span key={c} className={`h-6 rounded-md ${value > 0 ? HEAT[value] : c > last ? 'bg-amber-100' : HEAT[0]}`} />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </article>
            </Reveal>
            <Reveal className="md:col-span-2" delay={100}>
              <article className="card-lift h-full rounded-3xl border border-pp-border bg-white p-7">
                <h3 className="text-lg font-bold text-pp-navy">Campaign goals</h3>
                <p className="mt-1 text-sm text-pp-muted">Raised against the goal, live from PayPal.</p>
                <ul className="mt-6 space-y-4" aria-hidden>
                  {[
                    ['Sponsor a Pet', 85],
                    ['Medical Fund', 66],
                    ['Winter Shelter', 44],
                  ].map(([name, share]) => (
                    <li key={name}>
                      <div className="flex justify-between text-sm font-semibold">
                        <span>{name}</span>
                        <span className="text-pp-blue">{share}%</span>
                      </div>
                      <span className="mt-1.5 block h-2.5 overflow-hidden rounded-full bg-pp-canvas">
                        <span className="grow-bar block h-full rounded-full bg-pp-blue" style={{ width: `${share}%` }} />
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
            <Reveal className="md:col-span-3">
              <article className="card-lift h-full rounded-3xl border border-pp-border bg-white p-7">
                <h3 className="text-lg font-bold text-pp-navy">Gifts arrive as they happen</h3>
                <p className="mt-1 text-sm text-pp-muted">Give on the donation page with the dashboard open: within seconds, the numbers move.</p>
                <div className="mt-6 space-y-2" aria-hidden>
                  {[
                    ['TS', 'Tara Singh', 'Winter Shelter Drive', '$20', true],
                    ['AR', 'Alex Rivera', 'Winter Shelter Drive', '$50', false],
                    ['DM', 'Daniel Martin', 'Community Spay & Neuter', '$100', false],
                  ].map(([initials, name, program, amount, fresh]) => (
                    <div key={String(name)} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${fresh ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'bg-pp-canvas'}`}>
                      <span className="grid size-9 place-items-center rounded-full bg-pp-blue text-xs font-bold text-white">{initials}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{name}</span>
                        <span className="block truncate text-xs text-pp-muted">{program}</span>
                      </span>
                      {fresh && <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">New</span>}
                      <span className="font-bold text-pp-navy">{amount}</span>
                    </div>
                  ))}
                </div>
              </article>
            </Reveal>
            <Reveal className="md:col-span-3" delay={100}>
              <article className="card-lift h-full rounded-3xl border border-pp-border bg-white p-7">
                <h3 className="text-lg font-bold text-pp-navy">A reminder you approve</h3>
                <p className="mt-1 text-sm text-pp-muted">The director writes it. PayPal Invoicing sends it, with a link to pay, after your click.</p>
                <div className="mt-6 rounded-2xl border border-pp-border bg-pp-canvas p-4 text-sm" aria-hidden>
                  <p className="font-semibold text-pp-navy">To: Cedar &amp; Sage Dental · $2,500 pledge, overdue</p>
                  <p className="mt-2 leading-relaxed text-pp-muted">
                    &ldquo;Thank you again for backing the Business Partnership this year. Your pledge is still open, and here is the link
                    whenever it suits&hellip;&rdquo;
                  </p>
                  <div className="mt-4 flex justify-end gap-2">
                    <span className="rounded-full border border-pp-border bg-white px-3 py-1.5 text-xs font-semibold">Not now</span>
                    <span className="rounded-full bg-pp-blue px-3 py-1.5 text-xs font-bold text-white">Send through PayPal</span>
                  </div>
                </div>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="bg-pp-navy text-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Reveal>
            <h2 className="max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">An AI teammate that writes to donors has to know its place.</h2>
          </Reveal>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {guarantees.map((item, i) => (
              <Reveal key={item.title} delay={i * 110}>
                <span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-teal-200">
                  <item.icon className="size-6" />
                </span>
                <h3 className="mt-5 text-lg font-bold">{item.title}</h3>
                <p className="mt-2 leading-relaxed text-white/75">{item.detail}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Under the hood */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Reveal>
          <p className="text-sm font-bold uppercase tracking-widest text-pp-blue">Under the hood</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {stack.map((part) => (
              <li key={part.label} className="rounded-2xl border border-pp-border bg-white px-5 py-4 sm:last:col-span-2">
                <span className="block font-bold text-pp-navy">{part.label}</span>
                <span className="mt-1 block text-sm leading-relaxed text-pp-muted">{part.detail}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* Closing call */}
      <section className="px-6 pb-20">
        <Reveal>
          <div className="cta-band mx-auto max-w-6xl overflow-hidden rounded-[2rem] px-8 py-14 text-center text-white sm:px-16">
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">See who Harbor Lane is about to lose.</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/80">Open the dashboard, click &ldquo;Ask your director&rdquo; and pick a suggestion. It takes about a minute.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-bold text-pp-navy transition hover:-translate-y-0.5">
                Open the team dashboard
                <ArrowIcon className="size-4" />
              </Link>
              <Link href="/donate" className="rounded-full border border-white/40 px-6 py-3.5 font-bold text-white transition hover:bg-white/10">
                Make a sandbox gift
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-pp-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-pp-muted">
          <span className="flex items-center gap-2">
            <GratiaMark className="size-6" />
            Built for the PayPal AI Hackathon 2026. {ORGANIZATION} is fictional.
          </span>
          <a href="https://github.com/Arnaud-TOE/gratia" className="font-semibold text-pp-blue hover:underline">
            Source on GitHub, MIT license
          </a>
        </div>
      </footer>
    </main>
  );
}
