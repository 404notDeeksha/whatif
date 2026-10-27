import OpenAI from 'openai';
import type { ZodType } from 'zod';
import { env } from '../config/env.js';

export class LlmError extends Error {
  constructor(message: string) {
    super(`LLM call failed: ${message}`);
    this.name = 'LlmError';
  }
}

export class LlmOutputError extends Error {
  constructor(
    message: string,
    public readonly raw: string | null,
  ) {
    super(message);
    this.name = 'LlmOutputError';
  }
}

// Created lazily so importing this module never requires a valid key (tests).
let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: env.openaiApiKey,
      baseURL: env.baseUrl, // undefined = real OpenAI
    });
  }
  return client;
}

/**
 * One LLM call in JSON mode: send the prompt, get the string back,
 * parse it and validate it against the given Zod schema.
 * Throws LlmError on transport/code failures of any kind,
 * LlmOutputError when the response is not parseable/validatable JSON.
 */
export async function callLlm<T>(opts: {
  prompt: string;
  schema: ZodType<T>;
}): Promise<T> {
  let raw: string | null = null;

  try {
    const completion = await getClient().chat.completions.create({
      model: env.model,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: opts.prompt }],
    });

    raw = completion.choices[0]?.message?.content ?? null;
    if (raw == null) {
      throw new LlmOutputError('LLM returned an empty response', null);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new LlmOutputError('LLM returned invalid JSON', raw);
    }

    const result = opts.schema.safeParse(parsed);
    if (!result.success) {
      throw new LlmOutputError(
        `LLM output failed schema validation: ${result.error.message}`,
        raw,
      );
    }

    return result.data;
  } catch (err) {
    // Do not double-wrap errors that come from this call already.
    if (err instanceof LlmOutputError || err instanceof LlmError) throw err;
    throw new LlmError(err instanceof Error ? err.message : String(err));
  }
}
