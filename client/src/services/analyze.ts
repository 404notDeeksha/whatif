import { API_URL } from '../lib/config.js';
import type {
  AnalyzeBody,
  AnalyzeBodyWithAnswers,
  AnalyzeOutcome,
} from '../types/analysis.js';

/**
 * Calls POST /api/analyze (stage 1: dilemma only; stage 2: with Q&A)
 * and normalizes every possible server reply into an AnalyzeOutcome.
 * Never throws; the caller renders the outcome.
 */
export async function analyze(
  body: AnalyzeBody | AnalyzeBodyWithAnswers,
): Promise<AnalyzeOutcome> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return {
      kind: 'error',
      message: 'Could not reach the server. Is it running?',
    };
  }

  if (res.status === 429) {
    const data = (await res.json().catch(() => null)) as { message?: string } | null;
    return {
      kind: 'limit',
      message: data?.message ?? 'Too many requests today. Try again later.',
    };
  }

  const data = (await res.json().catch(() => null)) as
    | { questions?: unknown; analysis?: unknown; error?: unknown; message?: unknown }
    | null;

  if (res.status === 422 && data?.error === 'unsupported_input') {
    return {
      kind: 'unsupported_input',
      message:
        (data.message as string) ?? "This doesn't look like a decision. Try rephrasing.",
    };
  }

  if (data && typeof data === 'object' && 'questions' in data) {
    return { kind: 'questions', questions: data.questions as never };
  }
  if (data && typeof data === 'object' && 'analysis' in data) {
    return { kind: 'analysis', analysis: data.analysis as never };
  }

  // 400 invalid_request, 502 ai_unavailable / ai_output_invalid, 500 ...
  return {
    kind: 'error',
    message: (data?.message as string) ?? 'Something went wrong. Try again.',
  };
}
