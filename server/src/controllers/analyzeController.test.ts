import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/llmClient.js', () => ({
  LlmError: class LlmError extends Error {},
  LlmOutputError: class LlmOutputError extends Error {},
  callLlm: vi.fn(),
}));

import { callLlm, LlmError, LlmOutputError } from '../services/llmClient.js';
import { createApp } from '../app.js';

const callLlmMock = vi.mocked(callLlm);

beforeEach(() => {
  callLlmMock.mockReset();
});

describe('POST /api/analyze', () => {
  it('returns 400 for a missing dilemma', async () => {
    const res = await request(createApp()).post('/api/analyze').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_request');
  });

  it('returns 400 for a too-long dilemma (500 char cap)', async () => {
    const res = await request(createApp())
      .post('/api/analyze')
      .send({ dilemma: 'x'.repeat(501) });

    expect(res.status).toBe(400);
  });

  it('returns questions when info is missing', async () => {
    callLlmMock.mockResolvedValue({
      status: 'needs_info',
      questions: [{ id: 'q1', text: 'What matters more?', feeds: 'priorities' }],
    });

    const res = await request(createApp())
      .post('/api/analyze')
      .send({ dilemma: 'Job A or B?' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      questions: [{ id: 'q1', text: 'What matters more?', feeds: 'priorities' }],
    });
  });

  it('returns the analysis for a complete second call', async () => {
    callLlmMock.mockResolvedValue({
      analysis: {
        restatement: 'r',
        priorities: [],
        constraints: [],
        options: [
          { name: 'A', pros: ['p'], cons: ['c'], tradeoffs: ['t'] },
          { name: 'B', pros: [], cons: [], tradeoffs: [] },
        ],
        blindSpot: 'b',
        recommendation: { choice: 'A', reasoning: 'r', changeIf: [] },
        brief: false,
      },
    });

    const res = await request(createApp())
      .post('/api/analyze')
      .send({
        dilemma: 'Job A or B?',
        questions: [{ id: 'q1', text: 'What matters more?', feeds: 'priorities' }],
        answers: ['salary'],
      });

    expect(res.status).toBe(200);
    expect(res.body.analysis.recommendation.choice).toBe('A');
  });

  it('returns 422 for non-decision input', async () => {
    callLlmMock.mockResolvedValue({
      error: 'unsupported_input',
      message: "This doesn't look like a decision. Try rephrasing.",
    });

    const res = await request(createApp())
      .post('/api/analyze')
      .send({ dilemma: 'the moon is beautiful' });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('unsupported_input');
  });

  it('returns 502 when the LLM output is unusable', async () => {
    callLlmMock.mockRejectedValue(new LlmOutputError('invalid json', null));

    const res = await request(createApp())
      .post('/api/analyze')
      .send({ dilemma: 'Job A or B?' });

    expect(res.status).toBe(502);
    expect(res.body.error).toBe('ai_output_invalid');
  });

  it('returns 502 when the LLM cannot be reached', async () => {
    callLlmMock.mockRejectedValue(new LlmError('network down'));

    const res = await request(createApp())
      .post('/api/analyze')
      .send({ dilemma: 'Job A or B?' });

    expect(res.status).toBe(502);
    expect(res.body.error).toBe('ai_unavailable');
  });

  it('returns 500 for unexpected failures', async () => {
    callLlmMock.mockRejectedValue(new Error('something else'));

    const res = await request(createApp())
      .post('/api/analyze')
      .send({ dilemma: 'Job A or B?' });

    expect(res.status).toBe(500);
  });
});
