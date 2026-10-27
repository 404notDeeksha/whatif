# server (whatIf API)

Express + TypeScript backend for whatIf.

## Run locally

```bash
npm install --prefix server
cp .env.example .env         # then put in your OPENAI_API_KEY
npm run dev --prefix server  # starts on http://localhost:3000
```

## Scripts

| Script | Does |
|---|---|
| `dev` | Start dev server with auto-reload (tsx) |
| `build` | Typecheck + compile to `dist/` |
| `start` | Run compiled output (used by Render later) |
| `test` | Run vitest once |
| `test:watch` | Watch mode |
| `lint` | ESLint over src |
| `format` | Prettier write |

## Env vars

| Name | Required | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | Yes (warns until wired) | LLM access for `/api/analyze` |
| `PORT` | No | Default 3000 |
| `OPENAI_MODEL` | No | Default `gpt-4o-mini` |
