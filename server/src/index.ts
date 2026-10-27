import { createApp } from './app.js';
import { env, missingEnvVars } from './config/env.js';

const app = createApp();

app.listen(env.port, () => {
  console.log(`whatIf API listening on http://localhost:${env.port}`);
  if (missingEnvVars.length > 0) {
    console.warn(
      `Missing env vars: ${missingEnvVars.join(', ')} — copy server/.env.example to server/.env`,
    );
  }
});
