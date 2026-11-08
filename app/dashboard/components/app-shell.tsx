'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { CommandButton } from '@/components/command-palette';
import { ORGANIZATION, PRODUCT } from '@/lib/organization';
import { GratiaMark } from './ui/gratia-mark';
import { BellIcon, HelpIcon } from './ui/icons';

// The app frame: dark chrome (the top bar and the sidebar, in the front page's night teal) round a
// light, rounded panel where the dashboard lives. Shared by the dashboard, its loading skeleton and its
// error page. The sidebar's own classes are recoloured for the dark in globals.css (.dark-rail).

// PayPal's mark on a dark background: the all-white version.
function PayPalWordmark({ className = '' }: { className?: string }) {
  return <span className={`font-bold italic tracking-tight text-white ${className}`}>PayPal</span>;
}

function BrandLockup() {
  return (
    <div className="flex items-center gap-3">
      <Link href="/" className="flex items-center gap-3">
        <GratiaMark className="size-9 drop-shadow-[0_0_14px_rgb(20_184_166_/_0.45)]" />
        <span className="flex flex-col leading-tight">
          <span className="text-lg font-extrabold tracking-tight text-white">{PRODUCT}</span>
          <span className="text-xs text-white/50">for {ORGANIZATION}</span>
        </span>
      </Link>
      <span className="ml-2 hidden h-6 w-px bg-white/15 md:block" aria-hidden />
      <span className="hidden items-baseline gap-1 text-xs text-white/50 md:flex">
        on <PayPalWordmark className="text-base" /> and AG Studio
      </span>
    </div>
  );
}

function TopBar({ search }: { search: boolean }) {
  return (
    <header className="relative flex h-16 shrink-0 items-center gap-5 px-6 text-white">
      <BrandLockup />
      <span className="live-pill hidden lg:inline-flex">Live from PayPal</span>
      {search && <CommandButton label="Search or ask your director" className="ml-auto hidden w-72 md:inline-flex" />}
      <div className={`flex items-center gap-1 ${search ? '' : 'ml-auto'}`}>
        <Link
          href="/donate"
          target="_blank"
          className="mr-2 hidden rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-semibold text-white/85 transition hover:-translate-y-px hover:bg-white/10 sm:inline-flex"
        >
          Donation page ↗
        </Link>
        <span className="inline-flex size-9 items-center justify-center rounded-full text-white/70" title="Help">
          <HelpIcon />
        </span>
        <span className="inline-flex size-9 items-center justify-center rounded-full text-white/70" title="Notifications">
          <BellIcon />
        </span>
        <span className="ml-2 flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-800 text-sm font-semibold text-white shadow-md shadow-teal-500/30 ring-2 ring-white/20">
            HL
          </span>
          <span className="hidden text-sm font-semibold text-white/85 sm:inline">Harbor Lane team</span>
        </span>
      </div>
    </header>
  );
}

export function AppShell({ sidebar, children, search = false }: { sidebar: ReactNode; children: ReactNode; search?: boolean }) {
  return (
    <div className="app-frame flex h-dvh flex-col font-paypal text-pp-ink">
      <TopBar search={search} />
      <div className="flex min-h-0 flex-1 gap-2 pb-2 pr-2">
        <nav className="dark-rail flex w-64 shrink-0 flex-col" aria-label="Reports">
          {sidebar}
        </nav>
        <main className="app-panel flex min-w-0 flex-1 flex-col bg-pp-canvas">{children}</main>
      </div>
    </div>
  );
}
