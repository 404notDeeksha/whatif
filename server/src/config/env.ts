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
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
} as const;
