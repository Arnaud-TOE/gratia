import Link from 'next/link';
import type { CSSProperties } from 'react';
import { GratiaMark } from './dashboard/components/ui/gratia-mark';

const NIGHT = { '--night': '#04191a', '--glow-a': '#14b8a6', '--glow-b': '#f59e0b', '--glow-c': '#34d399' } as CSSProperties;

// A wrong address still lands somewhere friendly, with the two ways into the demo.
export default function NotFound() {
  return (
    <main className="night grain grid min-h-dvh place-items-center overflow-hidden px-6 font-paypal" style={NIGHT}>
      <div className="aurora" aria-hidden>
        <i />
        <i />
        <i />
      </div>
      <div className="grid-lines" aria-hidden />
      <div className="relative max-w-lg text-center">
        <GratiaMark className="mx-auto size-14" />
        <p className="shimmer-text mt-8 text-[7rem] font-extrabold leading-none tracking-[-0.05em]">404</p>
        <h1 className="text-balance mt-4 text-3xl font-extrabold tracking-tight">This page wandered off, like a lapsed donor.</h1>
        <p className="mt-3 text-white/60">Gratia would have noticed sooner. Here&apos;s the way back.</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className="btn-glow rounded-full px-7 py-3.5 font-bold">
            Open the dashboard
          </Link>
          <Link href="/" className="btn-ghost rounded-full px-7 py-3.5 font-bold">
            Front page
          </Link>
        </div>
      </div>
    </main>
  );
}
