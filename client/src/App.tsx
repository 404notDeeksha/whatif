import { JourneyProvider, useJourney } from './features/journey/JourneyContext.js';
import { DilemmaInput } from './features/dilemma/DilemmaInput.js';
import type { AnalyzeOutcome } from './types/analysis.js';

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

function Screen() {
  const { phase, reset } = useJourney();

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-200 p-6 text-zinc-900">
      <div className="w-full">
        <h1 className="mb-8 text-center text-3xl font-semibold">whatIf</h1>
        {phase.stage === 'input' && <DilemmaInput />}
        {phase.stage === 'analyzing' && (
          <p className="text-center text-zinc-600">Thinking it through…</p>
        )}
        {phase.stage === 'questions' && (
          // Interim: real questions screen lands in the next commit.
          <div className="mx-auto max-w-xl space-y-4">
            <p className="text-lg font-medium">
              The AI asked {phase.questions.length} question(s).
            </p>
            <pre className="max-h-96 overflow-auto rounded-xl bg-zinc-100 p-4 text-xs">
              {JSON.stringify(phase.questions, null, 2)}
            </pre>
            <button
              onClick={reset}
              className="rounded-full border border-zinc-300 px-6 py-2"
            >
              Start over
            </button>
          </div>
        )}
        {phase.stage === 'results' && (
          <OutcomeView
            dilemma={phase.dilemma}
            outcome={phase.outcome}
            onReset={reset}
          />
        )}
      </div>
    </main>
  );
}

export function App() {
  return (
    <JourneyProvider>
      <Screen />
    </JourneyProvider>
  );
}
