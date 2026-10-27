import { Router } from 'express';
import { analyze } from '../controllers/analyzeController.js';

export const analyzeRouter = Router();

analyzeRouter.post('/', analyze);
