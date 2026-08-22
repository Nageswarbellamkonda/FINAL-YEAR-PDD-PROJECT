import { Router } from 'express';
import { getAllAiCaseSummaries, createAiCaseSummaries } from '../controllers/ai_case_summaries.controller';

const router = Router();

router.get('/', getAllAiCaseSummaries);
router.post('/', createAiCaseSummaries);

export default router;
