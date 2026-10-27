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

  const prompt = `${systemPrompt}\n\nInput:\n${JSON.stringify(payload)}`;

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
