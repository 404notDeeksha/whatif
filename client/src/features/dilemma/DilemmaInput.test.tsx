import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DilemmaInput } from './DilemmaInput';

describe('DilemmaInput', () => {
  it('starts with the counter at 500 and a disabled Analyze button', () => {
    expect.hasAssertions();
    render(<DilemmaInput onSubmit={() => {}} />);
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analyze' })).toBeDisabled();
  });

  it('calls onSubmit with the typed dilemma', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<DilemmaInput onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/What's your dilemma/), 'Job A or B?');
    expect(screen.getByRole('button', { name: 'Analyze' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Analyze' }));
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('Job A or B?');
  });

  it('caps typing at 500 chars and keeps the button enabled in whitespace trim case', async () => {
    const user = userEvent.setup();
    render(<DilemmaInput onSubmit={() => {}} />);

    const box = screen.getByLabelText(/What's your dilemma/);
    await user.type(box, 'x'.repeat(499));
    await user.type(box, 'y'.repeat(5)); // textarea maxLength stops extra chars

    expect((box as HTMLTextAreaElement).value.length).toBe(500);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analyze' })).toBeEnabled();
  });

  it('disables Analyze when the text is only whitespace', async () => {
    const user = userEvent.setup();
    render(<DilemmaInput onSubmit={() => {}} />);

    await user.type(screen.getByLabelText(/What's your dilemma/), '     ');
    expect(screen.getByRole('button', { name: 'Analyze' })).toBeDisabled();
  });
});
