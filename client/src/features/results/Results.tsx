import type { Analysis } from '../../types/analysis.js';

/**
 * Step 3 of the journey: the five-part structured analysis, in order.
 * Layout mirrors the Phase 2 wireframes: one card per section.
 */
export function Results({ analysis }: { analysis: Analysis }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 text-left">
      <section className="rounded-xl border border-zinc-300 bg-white p-4">
        <p className="text-sm text-zinc-500">Your dilemma, restated</p>
        <p className="text-lg font-medium">{analysis.restatement}</p>
      </section>

      <section className="rounded-xl border border-zinc-300 bg-white p-4">
        <h2 className="text-sm text-zinc-500">Priorities & constraints</h2>
        <div className="flex flex-wrap gap-2">
          {analysis.priorities.map((p) => (
            <span
              key={p}
              className="rounded-full bg-zinc-900 px-3 py-1 text-sm text-white"
            >
              {p}
            </span>
          ))}
          {analysis.constraints.map((c) => (
            <span
              key={c}
              className="rounded-full border border-zinc-400 px-3 py-1 text-sm"
            >
              {c}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-300 bg-white p-4">
        <h2 className="mb-2 text-sm text-zinc-500">Options</h2>
        <div className="flex flex-col gap-3">
          {analysis.options.map((o) => (
            <div
              key={o.name}
              className={
                o.name === analysis.recommendation.choice
                  ? 'rounded-lg border-2 border-zinc-900 p-3'
                  : 'rounded-lg border border-zinc-300 p-3'
              }
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">{o.name}</p>
                {o.name === analysis.recommendation.choice && (
                  <span className="text-xs text-zinc-600">← recommended</span>
                )}
              </div>
              <p className="mt-1 text-sm text-green-700">＋ {o.pros.join('· ')}</p>
              <p className="text-sm text-red-700">− {o.cons.join('· ')}</p>
              <p className="mt-1 text-xs text-zinc-600">{o.tradeoffs.join('· ')}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-300 bg-white p-4">
        <h2 className="text-sm text-zinc-500">One thing you may be missing</h2>
        <p>{analysis.blindSpot}</p>
      </section>

      <section className="mb-8 rounded-xl border-2 border-zinc-900 bg-white p-4">
        <h2 className="text-sm text-zinc-500">Recommendation</h2>
        <p className="text-lg font-semibold">{analysis.recommendation.choice}</p>
        <p className="text-base">{analysis.recommendation.reasoning}</p>
        {analysis.recommendation.changeIf.length > 0 && (
          <p className="mt-2 text-sm text-zinc-600">
            Would change if: {analysis.recommendation.changeIf.join('. ')}.
          </p>
        )}
      </section>
    </div>
  );
}
