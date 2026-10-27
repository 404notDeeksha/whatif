import { z } from 'zod';
import type {
  Analysis,
  AssessResponse,
  AnalyzeResponse,
  UnsupportedInput,
} from '../types/analysis.js';
import {
  analysisSchema,
  questionSchema,
  unsupportedInputSchema,
} from '../types/analysis.js';
import { callLlm } from './llmClient.js';
import { systemPrompt } from '../prompts/systemPrompt.js';

export type DecisionOutcome =
  | { kind: 'complete'; analysis: Analysis }
  | { kind: 'needs_info'; questions: Question[] }
  | { kind: 'unsupported_input'; message: string };

export type DecisionInput =
  | { stage: 'assess'; dilemma: string }
  | { stage: 'analyze'; dilemma: string; questions: Question[]; answers: string[] };

export type Question = z.infer<typeof questionSchema>;

const assessResponseSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('complete'), analysis: analysisSchema }),
  z.object({
    status: z.literal('needs_info'),
    questions: z.array(questionSchema).min(1).max(4),
  }),
]);

const analyzeResponseSchema = z.object({ analysis: analysisSchema });

export async function runDecision(input: DecisionInput): Promise<DecisionOutcome> {
  const payload: Record<string, unknown> = {
    mode: input.stage,
    dilemma: input.dilemma,
  };
  if (input.stage === 'analyze') {
    payload.questions = input.questions.map((q) => q.text);
    payload.answers = input.answers;
  }

  // Two assembly-time nudges (Phase 3 addition; the frozen Phase 2 prompt is
  // never edited): free/live models occasionally ignore the mode or overrun
  // lengths, so restate the contract right before the payload.
  const modeNudge =
    input.stage === 'analyze'
      ? `Mode is "analyze": you MUST return exactly one JSON object with the key
"analysis" — do NOT ask questions now; the user's answers are above.`
      : `Mode is "assess": return EITHER questions OR an analysis, never both.`;
  const brevityNudge = `Keep every list item to one short line (under ~15 words).
Keep sentences short; respect all length limits in the rules.`;

  const prompt = [
    systemPrompt,
    '',
    '## Call instructions (binding)',
    modeNudge,
    brevityNudge,
    '',
    'Input:',
    JSON.stringify(payload),
  ].join('\n');

  // The model may reply with the unsupported-input error object in any mode,
  // so always allow it in the schema and route on the shape afterwards.
  const schema = z.union([
    assessResponseSchema,
    analyzeResponseSchema,
    unsupportedInputSchema,
  ]);

  const parsed = await callLlm<AssessResponse | AnalyzeResponse | UnsupportedInput>({
    prompt,
    schema,
  });

  if ('error' in parsed) {
    return { kind: 'unsupported_input', message: parsed.message };
  }

  if ('status' in parsed) {
    if (parsed.status === 'complete') {
      return { kind: 'complete', analysis: parsed.analysis };
    }
    return { kind: 'needs_info', questions: parsed.questions };
  }

  return { kind: 'complete', analysis: parsed.analysis };
}
