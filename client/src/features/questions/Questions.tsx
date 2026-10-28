import { useState } from 'react';
import { useJourney } from '../journey/JourneyContext.js';

/**
 * Step 2 of the journey: one AI question at a time (q1 → q2 → …).
 * Collects answers locally, then fires the second call via the journey.
 * Per the MVP scope: answers cannot be edited once submitted.
 */
export function Questions() {
  const { phase, submitAnswers } = useJourney();

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  if (phase.stage !== 'questions') return null;

  const total = phase.questions.length;
  const isLast = index === total - 1;
  // Keep answers in sync with the (stable) question list without side effects.
  const filled =
    answers.length === total
      ? answers
      : [...answers, ...Array<string>(total - answers.length).fill('')];
  const current = phase.questions[index]!;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <p className="text-sm text-zinc-500">
        To answer well, the AI needs {total} quick question{total === 1 ? '' : 's'}.
      </p>
      <div
        className="flex gap-1.5"
        role="progressbar"
        aria-label={`Question ${index + 1} of ${total}`}
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={total}
      >
        {phase.questions.map((_, i) => (
          <span
            key={phase.questions[i]!.id}
            className={`h-2 w-2 rounded-full ${i <= index ? 'bg-zinc-900' : 'bg-zinc-300'}`}
          />
        ))}
      </div>
      <p className="text-lg font-medium">{current.text}</p>
      <textarea
        rows={3}
        maxLength={500}
        aria-label={`Answer: ${current.text}`}
        className="w-full resize-none rounded-xl border border-zinc-300 bg-white p-4 text-base outline-none focus:border-zinc-900"
        placeholder="Answer as directly as you can…"
        value={filled[index] ?? ''}
        onChange={(e) =>
          setAnswers(filled.map((a, i) => (i === index ? e.target.value : a)))
        }
      />
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-500">
          {index + 1} / {total}
        </span>
        <button
          onClick={() => {
            if (!isLast) {
              setIndex(index + 1);
              return;
            }
            submitAnswers(filled);
          }}
          className="rounded-full bg-zinc-900 px-6 py-2 font-medium text-white"
        >
          {isLast ? 'Get my answer' : 'Next'}
        </button>
      </div>
    </div>
  );
}
