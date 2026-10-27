import { useState } from 'react';
import { DilemmaInput } from './features/dilemma/DilemmaInput.js';
import { analyze } from './services/analyze.js';
import type { AnalyzeBody, AnalyzeOutcome } from './types/analysis.js';

type Phase =
  | { stage: 'input' }
  | { stage: 'loading'; dilemma: string }
  | { stage: 'outcome'; dilemma: string; outcome: AnalyzeOutcome };

function OutcomeView({
  dilemma,
  outcome,
  onReset,
}: {
  dilemma: string;
  outcome: AnalyzeOutcome;
  onReset: () => void;
}) {
  if (
    outcome.kind === 'error' ||
    outcome.kind === 'unsupported_input' ||
    outcome.kind === 'limit'
  ) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
        <p className="text-lg">{outcome.message}</p>
        <p className="text-sm text-zinc-600">{dilemma}</p>
        <button
          onClick={onReset}
          className="rounded-full border border-zinc-300 px-6 py-2"
        >
          Start over
        </button>
      </div>
    );
  }
  // Questions and full results get dedicated screens in the next steps.
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <p className="text-lg font-medium">Got it — journey continues next step.</p>
      <pre className="max-h-96 overflow-auto rounded-xl bg-zinc-100 p-4 text-xs">
        {JSON.stringify(outcome, null, 2)}
      </pre>
      <button
        onClick={onReset}
        className="rounded-full border border-zinc-300 px-6 py-2"
      >
        Start over
      </button>
    </div>
  );
}

export function App() {
  const [phase, setPhase] = useState<Phase>({ stage: 'input' });

  const start = (dilemma: string) => {
    setPhase({ stage: 'loading', dilemma: dilemma });
    void analyze({ dilemma: dilemma } satisfies AnalyzeBody).then((outcome) =>
      setPhase({ stage: 'outcome', dilemma: dilemma, outcome: outcome }),
    );
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 text-zinc-900">
      <div className="w-full">
        <h1 className="mb-8 text-center text-3xl font-semibold">whatIf</h1>
        {phase.stage === 'input' && <DilemmaInput onSubmit={start} />}
        {phase.stage === 'loading' && (
          <p className="text-center text-zinc-600">Thinking it through…</p>
        )}
        {phase.stage === 'outcome' && (
          <OutcomeView
            dilemma={phase.dilemma}
            outcome={phase.outcome}
            onReset={() => setPhase({ stage: 'input' })}
          />
        )}
      </div>
    </main>
  );
}
