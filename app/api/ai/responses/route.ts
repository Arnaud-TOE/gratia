import { aiModels, openAiKey } from '@/lib/ai';
import { aiCallAllowed } from '@/lib/ai-guard';
import { BUDGET_USED_UP, isOutOfCredit } from '@/lib/ai-messages';
import { logUsage } from '@/lib/model-usage';
import { isSameOrigin } from '@/lib/same-origin';
import { watchForUsage } from '@/lib/sse-usage';

// Proxy for AG Studio's OpenAI adapter (app/dashboard/studio/openai-adapter.ts). The adapter
// runs in the browser and POSTs to `${endpoint}/responses`; with its endpoint set to /api/ai it lands
// here. This adds the server's OpenAI key (see lib/ai.ts), forwards the body to the OpenAI Responses API and
// streams the SSE reply straight back, so the adapter works unchanged and the key never leaves the
// server.

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

// Bounds the cost of a single call, whatever the client asks for. Reasoning tokens count towards it.
const MAX_OUTPUT_TOKENS = 16_000;

// AG Studio asks for medium reasoning. Low costs about half as much per answer, and the director's
// tools do the counting and the filtering, so it doesn't need more.
const REASONING_EFFORT = process.env.OPENAI_REASONING_EFFORT || 'low';

const error = (status: number, message: string) => Response.json({ error: { message } }, { status });

export async function POST(request: Request) {
  const apiKey = openAiKey();
  if (!apiKey) return error(503, 'The AI assistant is not configured: set AG_STUDIO_OPENAI_API_KEY in .env.local.');

  // This is a public demo paying for its own model calls: only its own pages may use the proxy,
  // and only so much of it. The message is shown in the assistant's panel.
  if (!isSameOrigin(request)) return error(403, 'This endpoint only serves the Gratia dashboard.');
  const verdict = aiCallAllowed(request);
  if (!verdict.allowed) return error(429, verdict.message);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return error(400, 'Request body must be JSON.');
  }

  // Only the models offered in the picker (OPENAI_MODELS) may be called.
  const models = aiModels();
  const model = typeof body.model === 'string' && body.model ? body.model : models[0];
  if (!models.includes(model)) return error(400, `Model "${model}" is not enabled.`);

  const upstream = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      ...body,
      model,
      max_output_tokens: MAX_OUTPUT_TOKENS,
      reasoning: { ...(typeof body.reasoning === 'object' ? body.reasoning : {}), effort: REASONING_EFFORT },
    }),
    // Stopping the chat in Studio aborts the browser request, which cancels this one too.
    signal: request.signal,
  });

  if (!upstream.ok) {
    // Errors come back as JSON and the adapter reads `error.message` from them.
    const detail = (await upstream.json().catch(() => ({}))) as { error?: { code?: string; message?: string } };
    if (isOutOfCredit(detail.error?.code)) return error(429, BUDGET_USED_UP);
    return error(upstream.status, detail.error?.message ?? `The model request failed (HTTP ${upstream.status}).`);
  }

  // Success is an SSE stream. Its last event carries the usage, which is logged on the way through.
  return new Response(upstream.body?.pipeThrough(watchForUsage(logUsage)) ?? null, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
