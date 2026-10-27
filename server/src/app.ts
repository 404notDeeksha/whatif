import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.js';
import { analyzeRouter } from './routes/analyze.js';
import { errorHandler } from './middleware/errors.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json());

  app.use('/api/analyze', analyzeRouter);

  app.use(errorHandler);

  app.use('/health', healthRouter);

  return app;
}
