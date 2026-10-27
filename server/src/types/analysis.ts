/**
 * Shapes of the AI-facing data contract, validated with Zod.
 * Source of truth: docs/phase-2/04-ai-workflow.md and 05-system-prompt.md.
 */
import { z } from 'zod';

// ---------- Shared LLM output ----------

export const analysisSchema = z.object({
  restatement: z.string().min(1),
  priorities: z.array(z.string()),
  constraints: z.array(z.string()),
  options: z
    .array(
      z.object({
        name: z.string().min(1),
        pros: z.array(z.string()),
        cons: z.array(z.string()),
        tradeoffs: z.array(z.string()),
      }),
    )
    .min(2)
    .max(4),
  blindSpot: z.string().min(1),
  recommendation: z.object({
    choice: z.string().min(1),
    reasoning: z.string().min(1),
    changeIf: z.array(z.string()),
  }),
  brief: z.boolean(),
});

const feedFieldSchema = z.enum([
  'priorities',
  'constraints',
  'options',
  'blindSpot',
  'recommendation',
]);

export const questionSchema = z.object({
  id: z.string().regex(/^q[1-4]$/),
  text: z.string().min(1),
  feeds: feedFieldSchema,
});

export const assessResponseSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('complete'), analysis: analysisSchema }),
  z.object({
    status: z.literal('needs_info'),
    questions: z.array(questionSchema).min(1).max(4),
  }),
]);

export const analyzeResponseSchema = z.object({ analysis: analysisSchema });

// ---------- API request bodies (from the client) ----------

const MAX_DILEMMA_LENGTH = 500;
const MAX_ANSWER_LENGTH = 500;

export const analyzeRequestSchema = z.union([
  z.object({ dilemma: z.string().trim().min(1).max(MAX_DILEMMA_LENGTH) }),
  z.object({
    dilemma: z.string().trim().min(1).max(MAX_DILEMMA_LENGTH),
    questions: z.array(questionSchema).min(1).max(4),
    answers: z.array(z.string().max(MAX_ANSWER_LENGTH)).min(1).max(4),
  }),
]);

export const unsupportedInputSchema = z.object({
  error: z.literal('unsupported_input'),
  message: z.string(),
});

// ---------- Exported types ----------

export type Analysis = z.infer<typeof analysisSchema>;
export type Question = z.infer<typeof questionSchema>;
export type AssessResponse = z.infer<typeof assessResponseSchema>;
export type AnalyzeResponse = z.infer<typeof analyzeResponseSchema>;
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type UnsupportedInput = z.infer<typeof unsupportedInputSchema>;
