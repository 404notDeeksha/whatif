import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../App';
import { JourneyProvider } from '../journey/JourneyContext.js';
import { DilemmaInput } from './DilemmaInput';

// Start in the input phase and keep fetch from firing real requests.
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('no network in tests')));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('DilemmaInput (journey-wired, rendered inside App)', () => {
  it('starts at the 500 counter and a disabled Analyze button', () => {
    expect.hasAssertions();
    render(<App />);
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analyze' })).toBeDisabled();
  });

  it('moves through analyzing to the outcome on submit (fetch fired)', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/What's your dilemma/), 'Job A or B?');
    // jsdom does not implement requestSubmit, so we fire submit directly.
    fireEvent.submit(screen.getByLabelText(/What's your dilemma/).closest('form')!);

    await screen.findByRole('button', { name: 'Start over' });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/analyze'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('caps typing at 500 chars', async () => {
    const user = userEvent.setup();
    render(<App />);

    const box = screen.getByLabelText(/What's your dilemma/);
    await user.type(box, 'x'.repeat(503)); // textarea maxLength stops extra chars

    expect((box as HTMLTextAreaElement).value).toHaveLength(500);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('disables Analyze when the text is only whitespace', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/What's your dilemma/), '     ');
    expect(screen.getByRole('button', { name: 'Analyze' })).toBeDisabled();
  });
});

describe('DilemmaInput standalone (still mountable)', () => {
  it('mounts inside a bare JourneyProvider', () => {
    expect.hasAssertions();
    render(
      <JourneyProvider>
        <DilemmaInput />
      </JourneyProvider>,
    );
    expect(screen.getByText('500')).toBeInTheDocument();
    cleanup();
  });

  it('DilemmaInput renders without onSubmit prop (context-driven)', () => {
    expect.hasAssertions();
    render(
      <JourneyProvider>
        <DilemmaInput />
      </JourneyProvider>,
    );
    expect(screen.getByRole('button', { name: 'Analyze' })).toBeInTheDocument();
    cleanup();
  });
});
