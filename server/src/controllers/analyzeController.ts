import type { NextFunction, Request, Response } from 'express';
import { analyzeRequestSchema } from '../types/analysis.js';
import { runDecision } from '../services/decisionService.js';

export async function analyze(req: Request, res: Response, next: NextFunction) {
  const body = analyzeRequestSchema.safeParse(req.body);

  if (!body.success) {
    res.status(400).json({
      error: 'invalid_request',
      message: 'Send { dilemma } (max 500 chars), or { dilemma, questions, answers }.',
      details: body.error.issues,
    });
    return;
  }

  try {
    const outcome = await runDecision(
      'questions' in body.data
        ? {
            stage: 'analyze',
            dilemma: body.data.dilemma,
            questions: body.data.questions,
            answers: body.data.answers,
          }
        : { stage: 'assess', dilemma: body.data.dilemma },
    );

    if (outcome.kind === 'unsupported_input') {
      res.status(422).json({ error: 'unsupported_input', message: outcome.message });
      return;
    }

    if (outcome.kind === 'needs_info') {
      res.json({ questions: outcome.questions });
      return;
    }

    res.json({ analysis: outcome.analysis });
  } catch (err) {
    next(err);
  }
}
