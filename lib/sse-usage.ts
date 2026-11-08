// The Responses API streams its answer as server-sent events, and the usage only arrives in the last
// one, "response.completed". This passes the stream through untouched and hands that usage on.

export function watchForUsage(onUsage: (usage: unknown) => void): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder();
  let pending = '';

  const read = (event: string) => {
    if (!event.includes('response.completed')) return;
    const data = event
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim())
      .join('');
    try {
      const parsed = JSON.parse(data) as { type?: string; response?: { usage?: unknown } };
      if (parsed.type === 'response.completed' && parsed.response?.usage) onUsage(parsed.response.usage);
    } catch {
      // Not the event we were after: the stream itself is never affected.
    }
  };

  return new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(chunk);
      pending += decoder.decode(chunk, { stream: true }).replace(/\r\n/g, '\n');
      let end = pending.indexOf('\n\n');
      while (end >= 0) {
        read(pending.slice(0, end));
        pending = pending.slice(end + 2);
        end = pending.indexOf('\n\n');
      }
    },
    flush() {
      if (pending.trim()) read(pending);
    },
  });
}
