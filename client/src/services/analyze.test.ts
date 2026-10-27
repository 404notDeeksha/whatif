import { afterEach, describe, expect, it, vi } from 'vitest';
import { analyze } from './analyze.js';

const ok = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status: status }));

afterEach(() => vi.unstubAllGlobals());

describe('analyze()', () => {
  it('returns questions outcome', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockReturnValue(
          ok({ questions: [{ id: 'q1', text: 't', feeds: 'priorities' }] }),
        ),
    );
    const outcome = await analyze({ dilemma: 'x' });
    expect(outcome.kind).toBe('questions');
  });

  it('returns analysis outcome', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(ok({ analysis: { restatement: 'r' } })),
    );
    const outcome = await analyze({ dilemma: 'x' });
    expect(outcome.kind).toBe('analysis');
  });

  it('maps 422 to unsupported_input without throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(ok({ error: 'unsupported_input', message: 'msg' }, 422)),
    );
    const outcome = await analyze({ dilemma: 'x' });
    expect(outcome).toEqual({ kind: 'unsupported_input', message: 'msg' });
  });

  it('maps 429 to limit with friendly default message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(ok({ message: 'cap' }, 429)));
    const outcome = await analyze({ dilemma: 'x' });
    expect(outcome).toEqual({ kind: 'limit', message: 'cap' });
    expect(outcome.kind === 'limit' && outcome.message).toBeTruthy();
  });

  it('maps network failure to error and keeps the process alive', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
    const outcome = await analyze({ dilemma: 'x' });
    expect(outcome.kind).toBe('error');
  });

  it('maps unparseable success bodies to a generic error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(Promise.resolve(new Response('<html>', { status: 200 }))),
    );
    const outcome = await analyze({ dilemma: 'x' });
    expect(outcome.kind).toBe('error');
  });
});
