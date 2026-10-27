import 'dotenv/config';

export const missingEnvVars: string[] = [];

function envOrWarn(name: string, fallback: string): string {
  const value = process.env[name];
  if (!value) {
    missingEnvVars.push(name);
    return fallback;
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT) || 3000,
  openaiApiKey: envOrWarn('OPENAI_API_KEY', ''),
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  baseUrl: process.env.OPENAI_BASE_URL, // optional: any OpenAI-compatible provider
} as const;
