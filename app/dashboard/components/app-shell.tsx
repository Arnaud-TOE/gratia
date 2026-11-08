'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ORGANIZATION, PRODUCT } from '@/lib/organization';
import { GratiaMark } from './ui/gratia-mark';
import { BellIcon, HelpIcon } from './ui/icons';

// The app frame: a white top bar, a left sidebar and a warm canvas. Shared by the dashboard, its
// loading skeleton and its error page.

// PayPal's own colours, whatever the theme: it is their mark.
function PayPalWordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-bold italic tracking-tight ${className}`}>
      <span className="text-[#003087]">Pay</span>
      <span className="text-[#009cde]">Pal</span>
    </span>
  );
}

function BrandLockup() {
  return (
    <div className="flex items-center gap-3">
      <Link href="/" className="flex items-center gap-3">
        <GratiaMark className="size-9" />
        <span className="flex flex-col leading-tight">
          <span className="text-lg font-extrabold tracking-tight text-pp-navy">{PRODUCT}</span>
          <span className="text-xs text-pp-muted">for {ORGANIZATION}</span>
        </span>
      </Link>
      <span className="ml-2 hidden h-6 w-px bg-pp-border md:block" aria-hidden />
      <span className="hidden items-baseline gap-1 text-xs text-pp-muted md:flex">
        on <PayPalWordmark className="text-base" /> and AG Studio
      </span>
    </div>
  );
}

function TopBar() {
  return (
    <header className="relative z-10 flex h-16 shrink-0 items-center gap-6 border-b border-pp-border bg-white/85 px-6 backdrop-blur-xl">
      <span className="brand-strip" aria-hidden />
      <BrandLockup />
      <div className="ml-auto flex items-center gap-1 text-pp-navy">
        <Link
          href="/donate"
          target="_blank"
          className="mr-2 hidden rounded-full border border-pp-border bg-white px-4 py-1.5 text-sm font-semibold text-pp-blue shadow-sm transition hover:-translate-y-px hover:border-pp-blue/40 hover:shadow-md sm:inline-flex"
        >
          Donation page ↗
        </Link>
        <span className="inline-flex size-9 items-center justify-center rounded-full" title="Help">
          <HelpIcon />
        </span>
        <span className="inline-flex size-9 items-center justify-center rounded-full" title="Notifications">
          <BellIcon />
        </span>
        <span className="ml-2 flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-pp-navy text-sm font-semibold text-white shadow-md shadow-teal-700/30 ring-2 ring-white">
            HL
          </span>
          <span className="hidden text-sm font-semibold sm:inline">Harbor Lane team</span>
        </span>
      </div>
    </header>
  );
}

export function AppShell({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col bg-pp-canvas font-paypal text-pp-ink">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <nav className="flex w-64 shrink-0 flex-col border-r border-pp-border bg-white" aria-label="Reports">
          {sidebar}
        </nav>
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
