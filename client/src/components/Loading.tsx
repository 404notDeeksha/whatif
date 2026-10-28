/**
 * Waiting state used between API calls (input → questions, answers → results).
 */
export function Loading({ label = 'Thinking it through…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span
        aria-label="Loading"
        className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900"
      />
      <p className="text-lg text-zinc-600">{label}</p>
    </div>
  );
}
