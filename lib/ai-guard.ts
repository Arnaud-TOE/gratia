// Keeps the public demo's model bill bounded. The assistant calls the model several times per
// question, so the limits count model calls, not questions. Counters live in memory, per server
// instance: they stop a runaway tab or a casual script, and the OpenAI account's prepaid credit is the
// hard ceiling behind them.

const WINDOW_MS = 10 * 60_000;
const DAY_MS = 24 * 60 * 60_000;

// About a dozen questions per visitor per window: enough to try everything the demo offers.
const CALLS_PER_VISITOR = Number(process.env.AI_CALLS_PER_VISITOR) || 120;
const CALLS_PER_DAY = Number(process.env.AI_CALLS_PER_DAY) || 600;

type Verdict = { allowed: true } | { allowed: false; message: string };

/** A sliding-window counter: `hit` says whether one more call fits. Exported for the tests. */
export class CallLimiter {
  private calls = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  hit(key: string, now = Date.now()): boolean {
    const recent = (this.calls.get(key) ?? []).filter((at) => now - at < this.windowMs);
    const allowed = recent.length < this.limit;
    if (allowed) recent.push(now);
    this.calls.set(key, recent);
    // Visitors come and go; don't keep their empty lists forever.
    if (this.calls.size > 5000) {
      for (const [k, times] of this.calls) if (times.every((at) => now - at >= this.windowMs)) this.calls.delete(k);
    }
    return allowed;
  }
}

const perVisitor = new CallLimiter(CALLS_PER_VISITOR, WINDOW_MS);
const perDay = new CallLimiter(CALLS_PER_DAY, DAY_MS);

const visitorOf = (request: Request) => request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';

export function aiCallAllowed(request: Request): Verdict {
  if (!perVisitor.hit(visitorOf(request))) {
    return { allowed: false, message: 'The demo limits how much one visitor can ask the assistant in ten minutes. Please try again in a few minutes.' };
  }
  if (!perDay.hit('all')) {
    return { allowed: false, message: "The demo's AI budget for today is used up. It resets within a day; the demo video shows the assistant at work." };
  }
  return { allowed: true };
}

