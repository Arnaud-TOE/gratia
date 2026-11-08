import Link from 'next/link';
import { GratiaMark } from './dashboard/components/ui/gratia-mark';

// A wrong address still lands somewhere friendly, with the two ways into the demo.
export default function NotFound() {
  return (
    <main className="hero-glow relative grid min-h-dvh place-items-center overflow-hidden px-6 font-paypal text-pp-ink">
      <div className="relative max-w-lg text-center">
        <GratiaMark className="mx-auto size-14" />
        <p className="mt-8 text-7xl font-extrabold tracking-tight text-gradient">404</p>
        <h1 className="mt-3 text-2xl font-bold text-pp-navy">This page wandered off, like a lapsed donor.</h1>
        <p className="mt-3 text-pp-muted">Gratia would have noticed sooner. Here&apos;s the way back.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className="rounded-full bg-pp-blue px-6 py-3 font-bold text-white shadow-lg shadow-pp-blue/25 hover:bg-pp-blue-dark">
            Open the dashboard
          </Link>
          <Link href="/" className="rounded-full border border-pp-border bg-white px-6 py-3 font-bold text-pp-navy hover:bg-pp-highlight">
            Front page
          </Link>
        </div>
      </div>
    </main>
  );
}
