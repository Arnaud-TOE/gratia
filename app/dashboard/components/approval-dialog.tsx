'use client';

// Human in the loop for the agent. Anything that leaves the dashboard (a reminder PayPal emails
// to a donor) waits here for an explicit click: the agent's tool awaits `requestApproval`, which
// settles only when the user decides. The model can draft and ask, but it can't press the button.

import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Button, Dialog } from './ui/ui';

export type ApprovalRequest = {
  title: string;
  recipient: string;
  subject: string;
  message: string;
  confirmLabel: string;
};

export type RequestApproval = (request: ApprovalRequest) => Promise<boolean>;

export function useApprovals(): { requestApproval: RequestApproval; approvalDialog: ReactNode } {
  const [pending, setPending] = useState<ApprovalRequest | null>(null);
  const settle = useRef<((approved: boolean) => void) | null>(null);

  // Stable, because the agent's tools are built once and keep this reference.
  const requestApproval = useCallback<RequestApproval>((request) => {
    // A newer request replaces one still on screen; the older one counts as declined.
    settle.current?.(false);
    setPending(request);
    return new Promise<boolean>((resolve) => {
      settle.current = resolve;
    });
  }, []);

  const decide = (approved: boolean) => {
    settle.current?.(approved);
    settle.current = null;
    setPending(null);
  };

  const approvalDialog = (
    <Dialog
      open={pending !== null}
      title={pending?.title ?? ''}
      onClose={() => decide(false)}
      actions={
        <>
          <Button variant="ghost" onClick={() => decide(false)}>
            Don&apos;t send
          </Button>
          <Button variant="primary" onClick={() => decide(true)}>
            {pending?.confirmLabel ?? 'Send'}
          </Button>
        </>
      }
    >
      {pending && (
        <div className="space-y-3">
          <p className="text-sm text-pp-muted">
            The assistant drafted this message. PayPal will email it to <strong className="text-pp-ink">{pending.recipient}</strong> with
            a link to pay.
          </p>
          <div className="rounded-lg border border-pp-border bg-pp-canvas p-4">
            <p className="text-sm font-semibold text-pp-navy">{pending.subject}</p>
            <p className="mt-2 whitespace-pre-line text-sm text-pp-ink">{pending.message}</p>
          </div>
        </div>
      )}
    </Dialog>
  );

  return { requestApproval, approvalDialog };
}
