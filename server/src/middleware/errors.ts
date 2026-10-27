import type { NextFunction, Request, Response } from 'express';
import { LlmError, LlmOutputError } from '../services/llmClient.js';

/**
 * Last-resort handler. Never leaks details to the client; logs server-side.
 * Handles LLM failure cases from the service layer centrally.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error('Unhandled request error:', err);

  if (err instanceof LlmOutputError) {
    // Model answered, but not in a usable shape — the client may retry.
    res.status(502).json({
      error: 'ai_output_invalid',
      message: 'The AI gave an unusable response. Try again.',
    });
    return;
  }

  if (err instanceof LlmError) {
    res.status(502).json({
      error: 'ai_unavailable',
      message: 'Could not reach the AI service. Try again shortly.',
    });
    return;
  }

  res.status(500).json({
    error: 'internal_error',
    message: 'Something went wrong. Try again.',
  });
}
