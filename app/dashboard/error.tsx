'use client';

import { useEffect, useState } from 'react';
import { AlertIcon } from './components/ui/icons';
import { AppShell } from './components/app-shell';
import { SidebarSkeleton } from './components/skeleton';
import { Button } from './components/ui/ui';

const AUTOMATIC_RETRIES = 2;
const RETRY_AFTER_MS = 4000;
let retried = 0;

// Shown when PayPal can't be reached, or rejects the request, while loading the page. The sandbox is
// usually back within seconds, so this tries again by itself before asking anything of the visitor.
export default function DashboardError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const [retrying] = useState(() => retried < AUTOMATIC_RETRIES);

  useEffect(() => {
    console.error(error);
  }, [error]);

  useEffect(() => {
    if (!retrying) return;
    const timer = setTimeout(() => {
      retried++;
      retry();
    }, RETRY_AFTER_MS);
    return () => clearTimeout(timer);
  }, [retrying, retry]);

  return (
    <AppShell sidebar={<SidebarSkeleton />}>
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-lg rounded-lg border border-pp-border bg-white p-8 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-pp-danger/10 text-pp-danger">
            <AlertIcon className="size-7" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-pp-navy">PayPal&apos;s sandbox didn&apos;t answer this time</h1>
          <p className="mt-2 text-[15px] text-pp-muted">
            {retrying ? 'Trying again in a moment…' : 'It is usually back within a minute. Nothing has been lost.'}
          </p>
          {error.digest && <p className="mt-3 text-xs text-pp-muted">Reference: {error.digest}</p>}
          <Button variant="primary" className="mt-6" onClick={retry}>
            Try again now
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
