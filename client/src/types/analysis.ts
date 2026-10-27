/**
 * Client-side mirror of the server contract (server/src/types/analysis.ts).
 */

export type Analysis = {
  restatement: string;
  priorities: string[];
  constraints: string[];
  options: {
    name: string;
    pros: string[];
    cons: string[];
    tradeoffs: string[];
  }[];
  blindSpot: string;
  recommendation: {
    choice: string;
    reasoning: string;
    changeIf: string[];
  };
  brief: boolean;
};

export type Question = {
  id: string;
  text: string;
  feeds: 'priorities' | 'constraints' | 'options' | 'blindSpot' | 'recommendation';
};

export const MAX_DILEMMA_LENGTH = 500;

export type AnalyzeBody = {
  dilemma: string;
};

export type AnalyzeBodyWithAnswers = {
  dilemma: string;
  questions: Question[];
  answers: string[];
};

/** Normalized outcome of a call to POST /api/analyze. */
export type AnalyzeOutcome =
  | { kind: 'questions'; questions: Question[] }
  | { kind: 'analysis'; analysis: Analysis }
  | { kind: 'unsupported_input'; message: string }
  | { kind: 'limit'; message: string } // per-IP / daily caps (step 7 wires the server side)
  | { kind: 'error'; message: string }; // network / server / ai failure
