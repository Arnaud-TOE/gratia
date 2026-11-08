import Link from 'next/link';
import type { CSSProperties } from 'react';
import { GratiaMark } from './dashboard/components/ui/gratia-mark';
import { HeroVideo } from '@/components/hero-video';
import { CountUp, Marquee, Spot } from '@/components/fx';
import { ArrowIcon, BoltIcon, HandIcon, PlugIcon, SendIcon, ShieldIcon, SparkIcon } from '@/components/icons';
import { Reveal } from '@/components/reveal';
import { ORGANIZATION, PRODUCT } from '@/lib/organization';

// The front door: what Gratia is, why it matters, and the two ways into the demo. A night page in the
// theme's teal and amber (app/fx.css).

const NIGHT = {
  '--night': '#04191a',
  '--glow-a': '#14b8a6',
  '--glow-b': '#f59e0b',
  '--glow-c': '#34d399',
} as CSSProperties;

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

const STACK = [
  'PayPal Invoicing v2',
  'PayPal Orders v2',
  'PayPal JavaScript SDK v6',
  'PayPal Transaction Search',
  'PayPal Balances',
  'PayPal Server SDK by APIMatic',
  'AG Studio',
  'AG Grid',
  'OpenAI GPT-5.4 mini',
  'Next.js 16',
];

// A small, static picture of the loyalty heatmap: rows that stop short are donors going quiet.
const HEATMAP = [
  [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  [2, 2, 3, 2, 3, 2, 3, 3, 2, 3, 2, 3],
  [0, 3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0],
  [0, 0, 2, 2, 2, 2, 1, 1, 1, 0, 0, 0],
  [2, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 3, 3, 3, 2, 3, 3],
];
const HEAT = ['bg-white/[0.05]', 'bg-teal-400/30', 'bg-teal-400/55', 'bg-teal-400/85'];

export default function Home() {
  return (
    <main className="night font-paypal" style={NIGHT}>
      <header className="sticky top-0 z-40 border-b hairline bg-[#04191a]/70 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <GratiaMark className="size-8" />
            <span className="text-lg font-extrabold tracking-tight">{PRODUCT}</span>
          </Link>
          <div className="flex items-center gap-1 text-sm font-semibold">
            <a href="#how" className="hidden rounded-full px-3 py-2 text-white/60 transition hover:text-white sm:block">
              How it works
            </a>
            <a href="#widgets" className="hidden rounded-full px-3 py-2 text-white/60 transition hover:text-white md:block">
              Widgets
            </a>
            <Link href="/donate" className="hidden rounded-full px-3 py-2 text-white/60 transition hover:text-white sm:block">
              Donation page
            </Link>
            <Link href="/dashboard" className="btn-glow ml-2 rounded-full px-4 py-2 font-bold">
              Open the dashboard
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="grain relative overflow-hidden">
        <div className="aurora" aria-hidden>
          <i />
          <i />
          <i />
        </div>
        <div className="grid-lines" aria-hidden />

        <div className="mx-auto max-w-6xl px-6 pb-24 pt-16 sm:pt-24">
          <div className="mx-auto max-w-4xl text-center">
            <p className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white/80">
              <span className="live-dot" aria-hidden />
              Live on the PayPal sandbox · built with AG Studio
            </p>
            <h1 className="text-balance mt-7 text-5xl font-extrabold leading-[0.98] tracking-[-0.035em] sm:text-7xl lg:text-[5.4rem]">
              The AI development director <span className="shimmer-text">for small nonprofits.</span>
            </h1>
            <p className="text-balance mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-white/65">
              Four out of five first-time donors don&apos;t come back. {PRODUCT} turns a nonprofit&apos;s PayPal donations into a live dashboard and an AI
              teammate that keeps donors close, shown here for {ORGANIZATION}, a fictional shelter.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/dashboard" className="btn-glow group inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-bold">
                Open the team dashboard
                <ArrowIcon className="size-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link href="/donate" className="btn-ghost inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-bold">
                Give to Harbor Lane
              </Link>
            </div>
            <p className="mt-4 text-xs text-white/45">No sign-in. Sandbox money only.</p>
          </div>

          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className="glow-under" aria-hidden />
            <div className="tilt-in">
              <Link href="/dashboard" className="beam block overflow-hidden rounded-[1.4rem] p-1.5" aria-label="Open the dashboard">
                <span className="block overflow-hidden rounded-[1.05rem] bg-white">
                  <span className="browser-bar" aria-hidden>
                    <i />
                    <i />
                    <i />
                    <span className="browser-url">gratia-peach.vercel.app/dashboard</span>
                  </span>
                  <HeroVideo />
                </span>
              </Link>
            </div>

            <div className="float-chip float-a left-[-3rem] top-20" aria-hidden>
              <span className="chip-icon bg-emerald-100 text-emerald-700">$</span>
              <span>
                <b>New gift</b>
                <br />
                Tara gave $20 to the Winter Shelter Drive
              </span>
            </div>
            <div className="float-chip float-b right-[-3rem] top-[42%]" aria-hidden>
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

      {/* Built with */}
      <section className="border-y hairline py-7">
        <Marquee items={STACK} />
      </section>

      {/* The problem, in numbers */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-300">The problem</p>
          <h2 className="text-balance mt-4 text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">Most donors leave quietly. Nobody on a volunteer team has time to notice.</h2>
        </Reveal>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {[
            { value: <CountUp to={18.9} decimals={1} suffix="%" />, text: 'of first-time donors give again the next year.' },
            { value: <CountUp to={43.3} decimals={1} suffix="%" />, text: 'of all donors give again. The rest drift away, usually without a word.' },
            { value: 'Seconds', text: 'for a new PayPal gift to reach the team’s dashboard, so a thank-you can go out the same day.' },
          ].map((fact, i) => (
            <Reveal key={i} delay={i * 100}>
              <Spot className="glass h-full rounded-3xl p-8">
                <p className="text-6xl font-extrabold tracking-[-0.04em] text-white">{fact.value}</p>
                <p className="mt-4 leading-relaxed text-white/60">{fact.text}</p>
              </Spot>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-xs text-white/40">
          Sources: the Fundraising Effectiveness Project, Q4 2025 (43.3% overall), and Bloomerang, citing it (18.9% for first-time donors). The last figure is Gratia&apos;s own.
        </p>
      </section>

      {/* How it works */}
      <section id="how" className="relative scroll-mt-20 overflow-hidden border-y hairline py-24">
        <div className="aurora opacity-60" aria-hidden>
          <i />
          <i />
          <i />
        </div>
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-300">How it works</p>
            <h2 className="text-balance mt-4 text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">From a PayPal gift to a thank-you, in three steps.</h2>
          </Reveal>
          <div role="list" className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-6">
            <span className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-teal-300/50 to-transparent md:block" aria-hidden />
            {steps.map((step, i) => (
              <Reveal key={step.title} delay={i * 120}>
                <div role="listitem" className="relative">
                  <span className="relative grid size-14 place-items-center rounded-2xl border border-teal-300/40 bg-[#04191a] text-teal-200 shadow-[0_0_30px_-4px] shadow-teal-400/50">
                    <step.icon className="size-6" />
                  </span>
                  <p className="mt-6 text-sm font-bold text-white/40">0{i + 1}</p>
                  <h3 className="mt-1 text-2xl font-bold tracking-tight">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-white/60">{step.detail}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* What the team sees */}
      <section id="widgets" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
        <Reveal className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-300">What the team sees</p>
          <h2 className="text-balance mt-4 text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">Four widgets AG Studio doesn&apos;t ship, built for people who keep a rescue running.</h2>
        </Reveal>
        <div className="mt-14 grid gap-4 md:grid-cols-6">
          <Reveal className="md:col-span-4">
            <Spot className="glass h-full rounded-3xl p-7">
              <h3 className="text-lg font-bold">Who keeps coming back</h3>
              <p className="mt-1 text-sm text-white/55">One row per donor, one column per month. Rows that stop short turn amber: they&apos;re going quiet.</p>
              <div className="mt-6 space-y-1.5" aria-hidden>
                {HEATMAP.map((row, r) => {
                  const last = row.findLastIndex((v) => v > 0);
                  return (
                    <div key={r} className="grid grid-cols-12 gap-1.5">
                      {row.map((value, c) => (
                        <span key={c} className={`h-6 rounded-md ${value > 0 ? HEAT[value] : c > last ? 'bg-amber-400/40' : HEAT[0]}`} />
                      ))}
                    </div>
                  );
                })}
              </div>
            </Spot>
          </Reveal>
          <Reveal className="md:col-span-2" delay={100}>
            <Spot className="glass h-full rounded-3xl p-7">
              <h3 className="text-lg font-bold">Campaign goals</h3>
              <p className="mt-1 text-sm text-white/55">Raised against the goal, live from PayPal.</p>
              <ul className="mt-6 space-y-5" aria-hidden>
                {[
                  ['Sponsor a Pet', 85],
                  ['Medical Fund', 66],
                  ['Winter Shelter', 44],
                ].map(([name, share]) => (
                  <li key={name}>
                    <div className="flex justify-between text-sm font-semibold">
                      <span>{name}</span>
                      <span className="text-teal-300">{share}%</span>
                    </div>
                    <span className="mt-2 block h-2 overflow-hidden rounded-full bg-white/10">
                      <span className="grow-bar block h-full rounded-full bg-gradient-to-r from-teal-400 to-amber-400" style={{ width: `${share}%` }} />
                    </span>
                  </li>
                ))}
              </ul>
            </Spot>
          </Reveal>
          <Reveal className="md:col-span-3">
            <Spot className="glass h-full rounded-3xl p-7">
              <h3 className="text-lg font-bold">Gifts arrive as they happen</h3>
              <p className="mt-1 text-sm text-white/55">Give on the donation page with the dashboard open: within seconds, the numbers move.</p>
              <div className="mt-6 space-y-2" aria-hidden>
                {[
                  ['TS', 'Tara Singh', 'Winter Shelter Drive', '$20', true],
                  ['AR', 'Alex Rivera', 'Winter Shelter Drive', '$50', false],
                  ['DM', 'Daniel Martin', 'Community Spay & Neuter', '$100', false],
                ].map(([initials, name, program, amount, fresh]) => (
                  <div key={String(name)} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${fresh ? 'bg-emerald-400/10 ring-1 ring-emerald-300/40' : 'bg-white/[0.04]'}`}>
                    <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-teal-400 to-teal-700 text-xs font-bold">{initials}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{name}</span>
                      <span className="block truncate text-xs text-white/50">{program}</span>
                    </span>
                    {fresh && <span className="rounded-full bg-emerald-400 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-950">New</span>}
                    <span className="font-bold">{amount}</span>
                  </div>
                ))}
              </div>
            </Spot>
          </Reveal>
          <Reveal className="md:col-span-3" delay={100}>
            <Spot className="glass h-full rounded-3xl p-7">
              <h3 className="text-lg font-bold">A reminder you approve</h3>
              <p className="mt-1 text-sm text-white/55">The director writes it. PayPal Invoicing sends it, with a link to pay, after your click.</p>
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm" aria-hidden>
                <p className="font-semibold">To: Cedar &amp; Sage Dental · $2,500 pledge, overdue</p>
                <p className="mt-2 leading-relaxed text-white/60">
                  &ldquo;Thank you again for backing the Business Partnership this year. Your pledge is still open, and here is the link whenever it suits&hellip;&rdquo;
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <span className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold">Not now</span>
                  <span className="btn-glow rounded-full px-3 py-1.5 text-xs font-bold">Send through PayPal</span>
                </div>
              </div>
            </Spot>
          </Reveal>
        </div>
      </section>

      {/* Trust */}
      <section className="border-y hairline bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal>
            <h2 className="text-balance max-w-3xl text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">An AI teammate that writes to donors has to know its place.</h2>
          </Reveal>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {guarantees.map((item, i) => (
              <Reveal key={item.title} delay={i * 110}>
                <Spot className="glass h-full rounded-3xl p-7">
                  <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-teal-400/30 to-amber-400/20 text-teal-200 ring-1 ring-white/15">
                    <item.icon className="size-6" />
                  </span>
                  <h3 className="mt-6 text-xl font-bold">{item.title}</h3>
                  <p className="mt-2 leading-relaxed text-white/60">{item.detail}</p>
                </Spot>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Closing call */}
      <section className="px-6 py-24">
        <Reveal>
          <div className="beam relative mx-auto max-w-6xl overflow-hidden rounded-[2.2rem]" style={{ '--beam-fill': '#062826' } as CSSProperties}>
            <div className="aurora" aria-hidden>
              <i />
              <i />
              <i />
            </div>
            <div className="relative px-8 py-20 text-center sm:px-16">
              <h2 className="text-balance mx-auto max-w-3xl text-4xl font-extrabold tracking-[-0.035em] sm:text-6xl">See who Harbor Lane is about to lose.</h2>
              <p className="mx-auto mt-5 max-w-xl text-white/65">Open the dashboard, click &ldquo;Ask your director&rdquo; and pick a suggestion. It takes about a minute.</p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Link href="/dashboard" className="btn-glow inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-bold">
                  Open the team dashboard
                  <ArrowIcon className="size-4" />
                </Link>
                <Link href="/donate" className="btn-ghost rounded-full px-7 py-3.5 font-bold">
                  Make a sandbox gift
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="overflow-hidden border-t hairline">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 pt-10 text-sm text-white/50">
          <span className="flex items-center gap-2">
            <GratiaMark className="size-6" />
            Built for the PayPal AI Hackathon 2026. {ORGANIZATION} is fictional.
          </span>
          <a href="https://github.com/Arnaud-TOE/gratia" className="font-semibold text-teal-300 hover:underline">
            Source on GitHub, MIT license
          </a>
        </div>
        <p className="wordmark mx-auto max-w-6xl px-6 pt-6 text-[22vw] sm:text-[13rem]" aria-hidden>
          {PRODUCT}
        </p>
      </footer>
    </main>
  );
}
