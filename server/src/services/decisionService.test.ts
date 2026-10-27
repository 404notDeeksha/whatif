import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./llmClient.js', () => ({
  LlmError: class LlmError extends Error {},
  LlmOutputError: class LlmOutputError extends Error {},
  callLlm: vi.fn(),
}));

import { callLlm } from './llmClient.js';
import { runDecision } from './decisionService.js';

const callLlmMock = vi.mocked(callLlm);

const analysis = {
  restatement: 'Choosing between two jobs',
  priorities: ['salary'],
  constraints: [],
  options: [
    { name: 'Job A', pros: ['money'], cons: ['stress'], tradeoffs: ['less time'] },
    { name: 'Job B', pros: ['growth'], cons: ['less pay'], tradeoffs: ['uncertainty'] },
  ],
  blindSpot: 'What commute time is acceptable?',
  recommendation: {
    choice: 'Job A',
    reasoning: 'on balance, salary matters most to you',
    changeIf: ['if learning matters more'],
  },
  brief: false,
};

beforeEach(() => {
  callLlmMock.mockReset();
});

describe('runDecision — assess', () => {
  it('returns questions when the model says info is missing', async () => {
    callLlmMock.mockResolvedValue({
      status: 'needs_info',
      questions: [
        {
          id: 'q1',
          text: 'What matters more: salary or learning?',
          feeds: 'priorities',
        },
      ],
    });

    const outcome = await runDecision({ stage: 'assess', dilemma: 'Job A or Job B?' });

    expect(outcome).toEqual({
      kind: 'needs_info',
      questions: [
        {
          id: 'q1',
          text: 'What matters more: salary or learning?',
          feeds: 'priorities',
        },
      ],
    });
    expect(callLlmMock).toHaveBeenCalledOnce();
  });

  it('returns a complete analysis when the model is done in one pass', async () => {
    callLlmMock.mockResolvedValue({ status: 'complete', analysis });

    const outcome = await runDecision({
      stage: 'assess',
      dilemma: 'Job A or Job B for salary?',
    });

    expect(outcome).toEqual({ kind: 'complete', analysis });
  });

  it('routes an unsupported-input reply to its own outcome', async () => {
    callLlmMock.mockResolvedValue({
      error: 'unsupported_input',
      message: "This doesn't look like a decision. Try rephrasing.",
    });

    const outcome = await runDecision({
      stage: 'assess',
      dilemma: 'the moon is beautiful',
    });

    expect(outcome).toEqual({
      kind: 'unsupported_input',
      message: "This doesn't look like a decision. Try rephrasing.",
    });
  });
});

describe('runDecision — analyze', () => {
  it('sends questions and answers, and returns the analysis', async () => {
    callLlmMock.mockResolvedValue({ analysis });

    const outcome = await runDecision({
      stage: 'analyze',
      dilemma: 'Job A or Job B?',
      questions: [{ id: 'q1', text: 'What matters more?', feeds: 'priorities' }],
      answers: ['salary'],
    });

    expect(outcome).toEqual({ kind: 'complete', analysis });

    const [promptArg] = callLlmMock.mock.calls[0]!;
    expect(promptArg.prompt).toContain('"mode":"analyze"');
    expect(promptArg.prompt).toContain('What matters more?');
    expect(promptArg.prompt).toContain('salary');
  });
});
