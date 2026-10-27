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

  // Assembly-time bindings (Phase 3 addition; the frozen Phase 2 prompt is
  // never edited). Live models on free tiers sometimes replay questions in
  // analyze mode even when answers are in hand, so the binding comes FIRST
  // (before the payload) and is repeated LAST (after it).
  const analyzeBinding = `BINDING — mode "analyze". The user already answered the
follow-up questions below; this is the final answer pass, not a new question round.
- Return exactly one JSON object of the form {"analysis": <Analysis>}.
- Do NOT ask any question. "needs_info" is forbidden in this mode.
- If an answer flags something unknown, work with what was given and place the
  missing factor in the analysis (blindSpot / recommendation.changeIf).`;
  const assessBinding = `BINDING — mode "assess". Return EITHER an analysis OR
questions, never both, per the ground rules.`;
  const binding = input.stage === 'analyze' ? analyzeBinding : assessBinding;
  const brevityNudge = `Keep every list item to one short line (under ~15 words).
Keep sentences short; respect all length limits in the rules.`;

  const inputBlock = `Input:
${JSON.stringify(payload)}`;

  const prompt = [
    systemPrompt,
    '',
    binding,
    '',
    brevityNudge,
    '',
    inputBlock,
    '',
    `FINAL REMINDER: ${input.stage === 'analyze' ? 'reply with {"analysis": <Analysis>} only; asking anything is forbidden.' : 'reply with EITHER {"status":"complete",...} OR {"status":"needs_info",...} only.'}`,
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
