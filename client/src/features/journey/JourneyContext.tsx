import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { analyze } from '../../services/analyze.js';
import type {
  Analysis,
  AnalyzeBody,
  AnalyzeBodyWithAnswers,
  AnalyzeOutcome,
  Question,
} from '../../types/analysis.js';

/**
 * The shared phase machine for the decision journey:
 * input → questions (only if the AI asks) → analyzing → results.
 * No Redux — one small context, per the tech-stack doc.
 */
export type JourneyPhase =
  | { stage: 'input' }
  | { stage: 'questions'; dilemma: string; questions: Question[] }
  | { stage: 'analyzing'; dilemma: string }
  | { stage: 'results'; dilemma: string; outcome: AnalyzeOutcome };

export type JourneyActions = {
  /** Stage 1: send the dilemma. */
  startAnalyse: (dilemma: string) => void;
  /** Stage 2: send the dilemma with the collected answers. */
  submitAnswers: (answers: string[]) => void;
  /** Back to input; clears everything. */
  reset: () => void;
};

type JourneyState = {
  phase: JourneyPhase;
  /** Kept across Q&A so the analysis uses the same dilemma the user typed. */
  dilemma: string | null;
  /** The questions from Call 1, kept for the second call. */
  questions: Question[];
  analysis: Analysis | null;
};

const JourneyContext = createContext<(JourneyState & JourneyActions) | null>(null);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<JourneyPhase>({ stage: 'input' });
  const [dilemma, setDilemma] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const handleOutcome = (sentDilemma: string, outcome: AnalyzeOutcome) => {
    if (outcome.kind === 'questions') {
      setQuestions(outcome.questions);
      setPhase({
        stage: 'questions',
        dilemma: sentDilemma,
        questions: outcome.questions,
      });
      return;
    }
    if (outcome.kind === 'analysis') setAnalysis(outcome.analysis);
    setPhase({ stage: 'results', dilemma: sentDilemma, outcome: outcome });
  };

  const actions: JourneyActions = useMemo(
    () => ({
      startAnalyse: (sentDilemma: string) => {
        setDilemma(sentDilemma);
        setPhase({ stage: 'analyzing', dilemma: sentDilemma });
        void analyze({ dilemma: sentDilemma } satisfies AnalyzeBody).then((outcome) =>
          handleOutcome(sentDilemma, outcome),
        );
      },
      submitAnswers: (answers: string[]) => {
        if (dilemma == null || questions.length === 0) return;
        setPhase({ stage: 'analyzing', dilemma: dilemma });
        void analyze({
          dilemma: dilemma,
          questions: questions,
          answers: answers,
        } satisfies AnalyzeBodyWithAnswers).then((outcome) =>
          handleOutcome(dilemma, outcome),
        );
      },
      reset: () => {
        setDilemma(null);
        setQuestions([]);
        setAnalysis(null);
        setPhase({ stage: 'input' });
      },
    }),
    // handleOutcome is stable (pure setters); dilemma/questions drive submitAnswers.
    [dilemma, questions],
  );

  const value = { phase, dilemma, questions, analysis, ...actions };

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourney() {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error('useJourney must be used inside <JourneyProvider>');
  return ctx;
}
