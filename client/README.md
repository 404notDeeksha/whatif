# client (whatIf web app)

React 19 + TypeScript + Vite frontend for whatIf.

## Run locally

```bash
npm install --prefix client
npm run dev --prefix client   # dev server, usually http://localhost:5173
```

Run the server alongside (`npm run dev --prefix server`) so the app can call the API.

## Scripts

| Script | Does |
|---|---|
| `dev` | Vite dev server with hot reload |
| `build` | Typecheck + production build to `dist/` (Vercel) |
| `preview` | Serve the production build locally |
| `test` | Vitest once (jsdom + Testing Library) |
| `test:watch` | Watch mode |
| `lint` | ESLint over src |
| `format` | Prettier write |

## Structure

- `src/features/` — screens: `dilemma/`, `questions/`, `results/`
- `src/components/` — shared UI
- `src/services/` — backend calls
- `src/lib/` — api client, helpers
- `src/styles/index.css` — global styles (Tailwind entry)
- `src/types/` — shared TS types

Styling uses Tailwind v4 via the `@tailwindcss/vite` plugin — there is no
`tailwind.config.js`; global styles/import live in `src/styles/index.css`.
