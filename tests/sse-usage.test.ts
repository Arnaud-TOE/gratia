import { describe, expect, it } from 'vitest';
import { watchForUsage } from '@/lib/sse-usage';

const encoder = new TextEncoder();

async function pipe(chunks: string[]) {
  const seen: unknown[] = [];
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  }).pipeThrough(watchForUsage((usage) => seen.push(usage)));
  const text = await new Response(stream).text();
  return { text, seen };
}

const USAGE = { input_tokens: 9000, output_tokens: 300 };
const STREAM = [
  'event: response.output_text.delta\ndata: {"type":"response.output_text.delta","delta":"Hi"}\n\n',
  `event: response.completed\ndata: {"type":"response.completed","response":{"usage":${JSON.stringify(USAGE)}}}\n\n`,
].join('');

describe('watchForUsage', () => {
  it('passes the stream through untouched and finds the usage', async () => {
    const { text, seen } = await pipe([STREAM]);
    expect(text).toBe(STREAM);
    expect(seen).toEqual([USAGE]);
  });

  it('finds it when the event is split across chunks, with Windows line ends', async () => {
    const crlf = STREAM.replaceAll('\n', '\r\n');
    const { text, seen } = await pipe([crlf.slice(0, 40), crlf.slice(40, 130), crlf.slice(130)]);
    expect(text).toBe(crlf);
    expect(seen).toEqual([USAGE]);
  });

  it('ignores a stream without usage, and bad data', async () => {
    const { seen } = await pipe(['data: {"type":"response.completed"\n\n', 'event: ping\ndata: x\n\n']);
    expect(seen).toEqual([]);
  });
});
