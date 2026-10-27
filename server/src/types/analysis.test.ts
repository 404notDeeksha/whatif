import { describe, expect, it } from 'vitest';
import { analysisSchema, analyzeRequestSchema } from './analysis.js';

const validBase = {
  restatement: 'Choosing between two jobs',
  priorities: ['salary'],
  constraints: [],
  options: [
    { name: 'Job A', pros: ['p'], cons: ['c'], tradeoffs: ['t'] },
    { name: 'Job B', pros: [], cons: [], tradeoffs: [] },
  ],
  blindSpot: 'One specific risk',
  recommendation: {
    choice: 'Job A',
    reasoning: 'on balance, salary matters most',
    changeIf: ['if learning matters more'],
  },
  brief: false,
};

describe('analysisSchema length caps', () => {
  it('accepts a well-formed short analysis and normalises fields', () => {
    expect(analysisSchema.safeParse(validBase)).toMatchObject({ success: true });
  });

  it('rejects when a list item overruns 160 chars', () => {
    const withLongItem = {
      ...validBase,
      priorities: ['x'.repeat(161)],
    };
    expect(analysisSchema.safeParse(withLongItem)).toMatchObject({ success: false });
  });

  it('rejects when reasoning overruns 600 chars', () => {
    const withLongReasoning = {
      ...validBase,
      recommendation: { ...validBase.recommendation, reasoning: 'x'.repeat(601) },
    };
    expect(analysisSchema.safeParse(withLongReasoning)).toMatchObject({
      success: false,
    });
  });

  it('rejects when restatement overruns 300 chars', () => {
    const withLongRestatement = { ...validBase, restatement: 'x'.repeat(301) };
    expect(analysisSchema.safeParse(withLongRestatement)).toMatchObject({
      success: false,
    });
  });

  it('rejects when a list has more items than allowed', () => {
    const withTooMany = {
      ...validBase,
      priorities: Array.from({ length: 7 }, () => 'x'),
    };
    expect(analysisSchema.safeParse(withTooMany)).toMatchObject({ success: false });
  });
});

describe('analyzeRequestSchema caps', () => {
  it('accepts a dilemma at exactly 500 chars and rejects 501', () => {
    expect(analyzeRequestSchema.safeParse({ dilemma: 'x'.repeat(500) })).toMatchObject({
      success: true,
    });
    expect(analyzeRequestSchema.safeParse({ dilemma: 'x'.repeat(501) })).toMatchObject({
      success: false,
    });
  });
});
