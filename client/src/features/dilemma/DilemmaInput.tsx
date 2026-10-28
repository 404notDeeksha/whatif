import { useState } from 'react';
import { useJourney } from '../journey/JourneyContext.js';
import { MAX_DILEMMA_LENGTH } from '../../types/analysis.js';

/**
 * Step 1 of the journey: describe the dilemma (max 500 chars).
 */
export function DilemmaInput() {
  const [dilemma, setDilemma] = useState('');
  const { startAnalyse } = useJourney();
  const remaining = MAX_DILEMMA_LENGTH - dilemma.length;
  const canSubmit = dilemma.trim().length > 0 && remaining >= 0;

  return (
    <form
      className="mx-auto flex w-full max-w-xl flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        startAnalyse(dilemma);
      }}
    >
      <label htmlFor="dilemma" className="text-lg font-medium">
        What's your dilemma?
      </label>
      <textarea
        id="dilemma"
        autoFocus
        rows={5}
        maxLength={MAX_DILEMMA_LENGTH}
        className="w-full resize-none rounded-xl border border-zinc-300 bg-white p-4 text-base outline-none focus:border-zinc-900"
        placeholder="Should I take the lower-paying startup job or stay at my corporate job?"
        value={dilemma}
        onChange={(e) => setDilemma(e.target.value)}
      />
      <div className="flex items-center justify-between">
        <span
          className={`text-sm ${remaining < 50 ? 'text-red-600' : 'text-zinc-500'}`}
        >
          {remaining}
        </span>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-full bg-zinc-900 px-6 py-2 font-medium text-white disabled:opacity-40"
        >
          Analyze
        </button>
      </div>
      {remaining === 0 && (
        <p className="text-sm text-zinc-600">
          You've hit the {MAX_DILEMMA_LENGTH}-character limit.
        </p>
      )}
    </form>
  );
}
