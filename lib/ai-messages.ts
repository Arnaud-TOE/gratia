// What the assistant's panel shows when the demo's model budget is gone. Client-safe.

export const BUDGET_USED_UP =
  "The demo's AI budget has run out for now, so the director can't answer. The rest of the dashboard still works, and the demo video shows the director at work.";

/** OpenAI's error codes for an account out of credit. */
export const isOutOfCredit = (code: unknown) => code === 'insufficient_quota' || code === 'credit_balance_exhausted';
