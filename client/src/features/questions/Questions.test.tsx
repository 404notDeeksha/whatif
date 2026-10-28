import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../App.js';

const questionsPayload = {
  questions: [
    { id: 'q1', text: 'What matters more: growth or income?', feeds: 'priorities' },
    { id: 'q2', text: 'Any hard monthly cost?', feeds: 'constraints' },
  ],
};

const analysisPayload = {
  analysis: {
    restatement: 'r',
    priorities: ['growth'],
    constraints: [],
    options: [
      { name: 'A', pros: ['p'], cons: ['c'], tradeoffs: ['t'] },
      { name: 'B', pros: [], cons: [], tradeoffs: [] },
    ],
    blindSpot: 'b',
    recommendation: { choice: 'A', reasoning: 'r', changeIf: [] },
    brief: false,
  },
};

function typeAndSubmit(dilemma: string) {
  return async () => {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/What's your dilemma/), dilemma);
    fireEvent.submit(screen.getByLabelText(/What's your dilemma/).closest('form')!);
  };
}

// jsdom does not implement requestSubmit — answered inside the journey tests via fireEvent.
beforeEach(() => {
  cleanup();
});

describe('end-to-end questions journey (mocked fetch)', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('input → q1 → q2 → second call → analysis', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(questionsPayload), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(analysisPayload), { status: 200 }),
      );
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await typeAndSubmit('Job A or B?')();

    // q1 shows with progress; answer and advance
    await screen.findByText('What matters more: growth or income?');
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Answer: /), 'growth');
    await user.click(screen.getByText('Next'));

    // q2 shows; last answer fires call 2
    expect(screen.getByText('Any hard monthly cost?')).toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Answer: /), '3500');
    await user.click(screen.getByText('Get my answer'));

    await screen.findByText(/journey continues next step/i); // interim results view until step 6
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondBody = JSON.parse(
      (fetchMock.mock.calls[1]![1] as { body: string }).body,
    );
    expect(secondBody).toEqual({
      dilemma: 'Job A or B?',
      questions: questionsPayload.questions,
      answers: ['growth', '3500'],
    });
  });

  it('unsupported_input keeps the message and offers start over', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ error: 'unsupported_input', message: 'Try rephrasing.' }),
            { status: 422 },
          ),
        ),
    );

    render(<App />);
    await typeAndSubmit('the moon is nice lol')();

    await screen.findByText('Try rephrasing.');
    expect(screen.getByRole('button', { name: 'Start over' })).toBeInTheDocument();
  });

  it('reset from outcome returns to a clean input', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify(analysisPayload), { status: 200 }),
        ),
    );

    render(<App />);
    await typeAndSubmit('clear case')();

    await screen.findByText(/journey continues next step/i);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Start over' }));

    expect(screen.getByLabelText(/What's your dilemma/)).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('error outcome keeps the dilemma text on screen', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ error: 'ai_unavailable', message: 'Try again.' }),
          {
            status: 502,
          },
        ),
      ),
    );

    render(<App />);
    await typeAndSubmit('Job A or B?')();

    await screen.findByText('Try again.');
    expect(screen.getByText('Job A or B?')).toBeInTheDocument();
  });
});

describe('Questions() component in isolation', () => {
  it('renders nothing outside the questions phase', () => {
    expect.hasAssertions();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('x')));
    render(<App />);
    // No question text exists in input stage.
    expect(screen.queryByText(/To answer well,/)).not.toBeInTheDocument();
  });
});
